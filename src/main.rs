use std::{
    env, fmt, fs,
    io::{self, Read},
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};
use serde_json::Value;
use superlig_fantasy_optimizer::{
    calculate_player_match_score,
    data::{
        fixtures::FixtureDataset,
        fixtures::MatchStatus,
        matches::MatchDataset,
        matches::MatchPlayerPerformance,
        players::PlayerDataset,
        players::PlayerRecord,
        projections::{validate_projections, ProjectionDataset},
        team_names,
        teams::TeamDataset,
        validation::{
            read_json, validate_fixtures, validate_match, validate_players,
            validate_season_directory, validate_teams,
        },
        DatasetContext, SourceMetadata,
    },
    error::DataValidationError,
    models::{MatchPerformance, PlayerMatchScore},
    optimize_squad, project_all_players, validate_squad, Budget, Formation, NamedPlayerProjection,
    Position, ScoringRules, Squad, SquadRules,
};

const VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug)]
enum CliError {
    Usage(String),
    Io(io::Error),
    Json(serde_json::Error),
    Data(DataValidationError),
}

impl fmt::Display for CliError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Usage(message) => write!(formatter, "{message}"),
            Self::Io(error) => write!(formatter, "Girdi okunamadı: {error}"),
            Self::Json(error) => write!(formatter, "Geçersiz JSON: {error}"),
            Self::Data(error) => write!(formatter, "Veri doğrulama hatası: {error}"),
        }
    }
}

impl std::error::Error for CliError {}

impl From<io::Error> for CliError {
    fn from(error: io::Error) -> Self {
        Self::Io(error)
    }
}

impl From<serde_json::Error> for CliError {
    fn from(error: serde_json::Error) -> Self {
        Self::Json(error)
    }
}

impl From<DataValidationError> for CliError {
    fn from(error: DataValidationError) -> Self {
        Self::Data(error)
    }
}

#[derive(Debug, Deserialize)]
struct PlayerInput {
    name: String,
    position: Position,
}

#[derive(Debug, Deserialize)]
struct MatchPerformanceInput {
    player: PlayerInput,
    minutes: u16,
    goals: u16,
    assists: u16,
    saves: u16,
    penalty_saves: u16,
    penalty_misses: u16,
    goals_conceded: u16,
    yellow_cards: u16,
    red_cards: u16,
    own_goals: u16,
    clean_sheet: bool,
    bonus_rank: Option<u8>,
}

impl MatchPerformanceInput {
    fn into_domain(self) -> MatchPerformance {
        MatchPerformance {
            player_id: 0,
            player_name: self.player.name,
            position: self.player.position,
            minutes: self.minutes,
            goals: self.goals,
            assists: self.assists,
            saves: self.saves,
            penalty_saves: self.penalty_saves,
            penalty_misses: self.penalty_misses,
            goals_conceded: self.goals_conceded,
            yellow_cards: self.yellow_cards,
            red_cards: self.red_cards,
            own_goals: self.own_goals,
            clean_sheet: self.clean_sheet,
            bonus_rank: self.bonus_rank,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
enum OutputFormat {
    Human,
    Json,
}

impl OutputFormat {
    fn parse(value: &str) -> Result<Self, CliError> {
        match value {
            "human" => Ok(Self::Human),
            "json" => Ok(Self::Json),
            _ => Err(CliError::Usage(format!(
                "Desteklenmeyen çıktı formatı: {value}. Beklenen: human veya json."
            ))),
        }
    }
}

#[derive(Debug)]
struct ScoreOptions<'a> {
    input: Option<&'a str>,
    match_path: Option<&'a str>,
    format: OutputFormat,
}

#[derive(Debug, Serialize)]
struct MatchScoreOutput {
    match_id: String,
    players: Vec<PlayerMatchScore>,
}

const DEFAULT_DATASET_PATH: &str = "data/2026-27";

#[derive(Debug)]
struct DataOptions {
    path: String,
    format: OutputFormat,
    position: Option<Position>,
    team: Option<String>,
    status: Option<MatchStatus>,
}

#[derive(Debug)]
struct OptimizeOptions {
    budget: Budget,
    formation: Option<Formation>,
    format: OutputFormat,
}

#[derive(Debug)]
struct ProjectionCalculateOptions {
    format: OutputFormat,
    dry_run: bool,
}

#[derive(Debug, Serialize)]
struct ProjectionCalculateOutput {
    players: usize,
    projected: usize,
    missing: usize,
    changed: usize,
    min: Option<f64>,
    max: Option<f64>,
    average: Option<f64>,
    fixture_context_available: usize,
    fixture_context_unavailable: usize,
    dry_run: bool,
}

#[derive(Debug, Serialize)]
struct MatchListItem {
    match_id: String,
    home_team_id: String,
    away_team_id: String,
    home_team: String,
    away_team: String,
    home_score: u16,
    away_score: u16,
    players: usize,
    status: MatchStatus,
}

fn print_help() {
    println!(
        "Süper Lig Fantasy Optimizer\n\nKullanım:\n  sf score [--input DOSYA] [--match DOSYA] [--format human|json]\n  sf optimize --budget BÜTÇE [--formation FORMATION] [--format human|json]\n  sf projection stats [--format human|json]\n  sf projection validate\n  sf projection show PLAYER_ID\n  sf rules [--format human|json]\n  sf formation list\n  sf formation show FORMATION\n  sf validate DOSYA\n  sf data --help\n  sf fixture score-forward|score-defender|score-goalkeeper\n  sf version"
    );
}

fn load_projection_data() -> Result<(TeamDataset, PlayerDataset, ProjectionDataset), CliError> {
    let root = default_dataset_root();
    let teams: TeamDataset = read_json(&root.join("teams.json"))?;
    let players: PlayerDataset = read_json(&root.join("players.json"))?;
    validate_teams(&teams)?;
    validate_players(&players, &teams)?;
    let projection_path = root.join("projections.json");
    let projections = if projection_path.exists() {
        read_json(&projection_path)?
    } else {
        ProjectionDataset {
            schema_version: 1,
            season: players.season.clone(),
            source: SourceMetadata {
                name: "manual".to_owned(),
                retrieved_at: "not-provided".to_owned(),
                url: None,
            },
            projections: Vec::new(),
        }
    };
    validate_projections(&projections, &players, &teams)?;
    Ok((teams, players, projections))
}

fn load_match_datasets(root: &Path) -> Result<Vec<MatchDataset>, CliError> {
    let matches_dir = root.join("matches");
    if !matches_dir.exists() {
        return Ok(Vec::new());
    }
    let mut paths = fs::read_dir(matches_dir)?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<Result<Vec<_>, _>>()?;
    paths.sort();
    paths
        .into_iter()
        .filter(|path| {
            path.extension()
                .is_some_and(|extension| extension == "json")
        })
        .map(|path| read_json(&path).map_err(CliError::from))
        .collect()
}

fn parse_projection_calculate_options(
    args: &[String],
) -> Result<ProjectionCalculateOptions, CliError> {
    let mut format = OutputFormat::Human;
    let mut dry_run = false;
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "--dry-run" => dry_run = true,
            "--format" => {
                index += 1;
                format = OutputFormat::parse(args.get(index).ok_or_else(|| {
                    CliError::Usage("--format bir değer gerektirir.".to_owned())
                })?)?;
            }
            unknown => {
                return Err(CliError::Usage(format!(
                    "Bilinmeyen projection calculate seçeneği: {unknown}"
                )))
            }
        }
        index += 1;
    }
    Ok(ProjectionCalculateOptions { format, dry_run })
}

fn projection_calculate_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_projection_calculate_options(args)?;
    let root = default_dataset_root();
    let (teams, players, current) = load_projection_data()?;
    if current.source.name == "manual" && !current.projections.is_empty() {
        return Err(CliError::Usage(
            "Manual projection kayıtları bulundu; otomatik hesaplama bunları ezmez.".to_owned(),
        ));
    }
    let fixtures: FixtureDataset = read_json(&root.join("fixtures.json"))?;
    let matches = load_match_datasets(&root)?;
    let calculation = project_all_players(
        &players,
        &matches,
        &fixtures.fixtures,
        &ScoringRules::default(),
    );
    validate_projections(&calculation.projections, &players, &teams)?;
    let stats = calculation.projections.stats(&players);
    let previous = current
        .projections
        .iter()
        .map(|projection| (projection.player_id.as_str(), projection.expected_points))
        .collect::<std::collections::HashMap<_, _>>();
    let changed = calculation
        .projections
        .projections
        .iter()
        .filter(|projection| {
            previous
                .get(projection.player_id.as_str())
                .is_none_or(|old| old.total_cmp(&projection.expected_points).is_ne())
        })
        .count();
    if !options.dry_run {
        fs::write(
            root.join("projections.json"),
            serde_json::to_string_pretty(&calculation.projections)?,
        )?;
    }
    let output = ProjectionCalculateOutput {
        players: stats.players,
        projected: stats.projected,
        missing: stats.missing,
        changed,
        min: stats.minimum,
        max: stats.maximum,
        average: stats.average,
        fixture_context_available: calculation
            .summaries
            .iter()
            .filter(|summary| !summary.upcoming_fixtures.is_empty())
            .count(),
        fixture_context_unavailable: calculation
            .summaries
            .iter()
            .filter(|summary| summary.upcoming_fixtures.is_empty())
            .count(),
        dry_run: options.dry_run,
    };
    match options.format {
        OutputFormat::Human => {
            println!("Projection calculation successful.");
            println!("Players: {}", output.players);
            println!("Projected: {}", output.projected);
            println!("Missing: {}", output.missing);
            println!("Changed: {}", output.changed);
            println!("Written: {}", !output.dry_run);
            if let (Some(minimum), Some(maximum), Some(average)) =
                (output.min, output.max, output.average)
            {
                println!("Min: {minimum:.2}");
                println!("Max: {maximum:.2}");
                println!("Average: {average:.2}");
            }
            println!(
                "Fixture context available: {}",
                output.fixture_context_available
            );
            println!(
                "Fixture context unavailable: {}",
                output.fixture_context_unavailable
            );
        }
        OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&output)?),
    }
    Ok(())
}

fn projection_command(args: &[String]) -> Result<(), CliError> {
    match args.first().map(String::as_str) {
        Some("calculate") => projection_calculate_command(&args[1..]),
        Some("stats") => {
            let format = match args {
                [_, flag, value] if flag == "--format" => OutputFormat::parse(value)?,
                [_] => OutputFormat::Human,
                _ => {
                    return Err(CliError::Usage(
                        "Kullanım: sf projection stats [--format human|json]".to_owned(),
                    ))
                }
            };
            let (_, players, projections) = load_projection_data()?;
            let stats = projections.stats(&players);
            match format {
                OutputFormat::Human => {
                    println!("Projection Statistics\n");
                    println!("Players: {}", stats.players);
                    println!("Projected: {}", stats.projected);
                    println!("Missing: {}", stats.missing);
                    if let (Some(minimum), Some(maximum), Some(average)) =
                        (stats.minimum, stats.maximum, stats.average)
                    {
                        println!("\nMin: {minimum:.2}");
                        println!("Max: {maximum:.2}");
                        println!("Average: {average:.2}");
                    }
                }
                OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&stats)?),
            }
            Ok(())
        }
        Some("validate") if args.len() == 1 => {
            let (_, _, projections) = load_projection_data()?;
            println!(
                "Projection validation successful. Records: {}",
                projections.projections.len()
            );
            Ok(())
        }
        Some("show") if args.len() == 2 => {
            let (teams, players, projections) = load_projection_data()?;
            let player = players
                .players
                .iter()
                .find(|player| player.id == args[1])
                .ok_or_else(|| CliError::Usage(format!("Bilinmeyen oyuncu: {}", args[1])))?;
            let expected_points = projections
                .by_player_id()
                .get(player.id.as_str())
                .copied()
                .unwrap_or(0.0);
            let root = default_dataset_root();
            let fixtures: FixtureDataset = read_json(&root.join("fixtures.json"))?;
            let matches = load_match_datasets(&root)?;
            let calculation = project_all_players(
                &players,
                &matches,
                &fixtures.fixtures,
                &ScoringRules::default(),
            );
            let summary = calculation
                .summaries
                .iter()
                .find(|summary| summary.player_id == player.id);
            println!("Player: {}", player.name);
            println!("Player ID: {}", player.id);
            if let Some(summary) = summary {
                println!("Historical Matches: {}", summary.matches_considered);
                println!("Historical Average: {:.2}", summary.average_points);
                println!("Weighted Average: {:.2}", summary.weighted_average);
            }
            println!("Expected Points: {expected_points:.2}");
            println!("Upcoming Fixtures:");
            if let Some(summary) = summary {
                let team_names = teams
                    .teams
                    .iter()
                    .map(|team| (team.id.as_str(), team.name.as_str()))
                    .collect::<std::collections::HashMap<_, _>>();
                for fixture in &summary.upcoming_fixtures {
                    let opponent = team_names
                        .get(fixture.opponent_team_id.as_str())
                        .copied()
                        .unwrap_or(fixture.opponent_team_id.as_str());
                    println!(
                        "  Round {} | Opponent: {} | {} | Difficulty: {:?}",
                        fixture.round,
                        opponent,
                        if fixture.is_home { "Home" } else { "Away" },
                        fixture.difficulty
                    );
                }
                if summary.upcoming_fixtures.is_empty() {
                    println!("  None");
                }
            }
            Ok(())
        }
        _ => Err(CliError::Usage(
            "Kullanım: sf projection stats | validate | show PLAYER_ID".to_owned(),
        )),
    }
}

fn parse_optimize_options(args: &[String]) -> Result<OptimizeOptions, CliError> {
    let mut budget = None;
    let mut formation = None;
    let mut format = OutputFormat::Human;
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "--budget" => {
                index += 1;
                let value = args
                    .get(index)
                    .ok_or_else(|| CliError::Usage("--budget bir değer gerektirir.".to_owned()))?;
                let parsed = value.parse::<i64>().map_err(|_| {
                    CliError::Usage("--budget tam sayı bir fiyat birimi olmalıdır.".to_owned())
                })?;
                budget = Some(
                    Budget::try_from_i64(parsed)
                        .map_err(|error| CliError::Usage(error.to_string()))?,
                );
            }
            "--formation" => {
                index += 1;
                let value = args.get(index).ok_or_else(|| {
                    CliError::Usage("--formation bir formasyon gerektirir.".to_owned())
                })?;
                formation = Some(
                    value
                        .parse::<Formation>()
                        .map_err(|error| CliError::Usage(error.to_string()))?,
                );
            }
            "--format" => {
                index += 1;
                format = OutputFormat::parse(args.get(index).ok_or_else(|| {
                    CliError::Usage("--format bir değer gerektirir.".to_owned())
                })?)?;
            }
            unknown => {
                return Err(CliError::Usage(format!(
                    "Bilinmeyen optimize seçeneği: {unknown}"
                )))
            }
        }
        index += 1;
    }
    Ok(OptimizeOptions {
        budget: budget
            .ok_or_else(|| CliError::Usage("Kullanım: sf optimize --budget BÜTÇE".to_owned()))?,
        formation,
        format,
    })
}

fn optimize_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_optimize_options(args)?;
    let (_, players, projection_dataset) = load_projection_data()?;
    let projections = projection_dataset
        .projections
        .iter()
        .map(|player| NamedPlayerProjection {
            player_id: player.player_id.clone(),
            expected_points: player.expected_points,
        })
        .collect::<Vec<_>>();
    let result = optimize_squad(
        &players.players,
        &projections,
        options.budget,
        options.formation,
    )
    .map_err(|error| CliError::Usage(error.to_string()))?;
    if result.projection_coverage.missing > 0 && options.format == OutputFormat::Human {
        eprintln!(
            "Warning: {} players have no projection.",
            result.projection_coverage.missing
        );
    }
    match options.format {
        OutputFormat::Human => print_optimization_result(&result),
        OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&result)?),
    }
    Ok(())
}

fn print_optimization_result(result: &superlig_fantasy_optimizer::SquadOptimizationResult) {
    println!("BEST SQUAD\n");
    println!("Budget: {}", result.budget);
    println!("Cost: {}", result.total_cost);
    println!("Remaining: {}", result.remaining_budget);
    println!("Formation: {}\n", result.formation);
    println!("STARTING XI\n");
    for position in [
        Position::Goalkeeper,
        Position::Defender,
        Position::Midfielder,
        Position::Forward,
    ] {
        println!("{}", position_name(position).to_ascii_uppercase());
        for player in result
            .lineup
            .iter()
            .filter(|player| player.position == position)
        {
            println!(
                "  {:<32} {:>4} {:>6.1} pts",
                player.name, player.price, player.expected_points
            );
        }
        println!();
    }
    println!("BENCH\n");
    for (index, player) in result.bench.iter().enumerate() {
        println!("{}. {}", index + 1, player.name);
    }
    let captain_name = result
        .lineup
        .iter()
        .find(|player| player.player_id == result.captain)
        .map(|player| player.name.as_str())
        .unwrap_or(result.captain.as_str());
    let vice_captain_name = result
        .lineup
        .iter()
        .find(|player| player.player_id == result.vice_captain)
        .map(|player| player.name.as_str())
        .unwrap_or(result.vice_captain.as_str());
    println!("\nCaptain: {captain_name}");
    println!("Vice Captain: {vice_captain_name}");
    println!("Expected Points: {:.1}", result.expected_points);
    println!("Total Cost: {}", result.total_cost);
}

fn print_data_help() {
    println!(
        "Kullanım:\n  sf data validate [--path DİZİN]\n  sf data stats [--path DİZİN] [--format human|json]\n  sf data teams [--path DİZİN] [--format human|json]\n  sf data players [--path DİZİN] [--position POSITION] [--team TEAM_ID] [--format human|json]\n  sf data fixtures [--path DİZİN] [--status STATUS] [--team TEAM_ID] [--format human|json]\n  sf data matches [--path DİZİN] [--team TEAM_ID] [--format human|json]"
    );
}

fn formation_command(args: &[String]) -> Result<(), CliError> {
    match args.first().map(String::as_str) {
        Some("list") if args.len() == 1 => {
            for formation in Formation::ALL {
                println!("{formation}");
            }
            Ok(())
        }
        Some("show") if args.len() == 2 => {
            let formation = args[1]
                .parse::<Formation>()
                .map_err(|error| CliError::Usage(error.to_string()))?;
            println!("Formation: {formation}");
            println!("Goalkeeper: 1");
            println!("Defenders: {}", formation.defenders());
            println!("Midfielders: {}", formation.midfielders());
            println!("Forwards: {}", formation.forwards());
            println!("Total: {}", formation.total());
            Ok(())
        }
        _ => Err(CliError::Usage(
            "Kullanım: sf formation list | sf formation show FORMATION".to_owned(),
        )),
    }
}

fn parse_position(value: &str) -> Result<Position, CliError> {
    match value.to_ascii_lowercase().as_str() {
        "goalkeeper" => Ok(Position::Goalkeeper),
        "defender" => Ok(Position::Defender),
        "midfielder" => Ok(Position::Midfielder),
        "forward" => Ok(Position::Forward),
        _ => Err(CliError::Usage(format!("Bilinmeyen pozisyon: {value}"))),
    }
}

fn parse_match_status(value: &str) -> Result<MatchStatus, CliError> {
    match value.to_ascii_lowercase().as_str() {
        "scheduled" => Ok(MatchStatus::Scheduled),
        "live" => Ok(MatchStatus::Live),
        "finished" => Ok(MatchStatus::Finished),
        "postponed" => Ok(MatchStatus::Postponed),
        "cancelled" => Ok(MatchStatus::Cancelled),
        _ => Err(CliError::Usage(format!(
            "Bilinmeyen fikstür durumu: {value}"
        ))),
    }
}

fn parse_data_options(args: &[String]) -> Result<DataOptions, CliError> {
    let mut options = DataOptions {
        path: default_dataset_root().to_string_lossy().into_owned(),
        format: OutputFormat::Human,
        position: None,
        team: None,
        status: None,
    };
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "--path" => {
                index += 1;
                options.path = args.get(index).cloned().ok_or_else(|| {
                    CliError::Usage("--path bir dataset dizini gerektirir.".to_owned())
                })?;
            }
            "--format" => {
                index += 1;
                options.format = OutputFormat::parse(args.get(index).ok_or_else(|| {
                    CliError::Usage("--format bir değer gerektirir.".to_owned())
                })?)?;
            }
            "--position" => {
                index += 1;
                options.position = Some(parse_position(args.get(index).ok_or_else(|| {
                    CliError::Usage("--position bir değer gerektirir.".to_owned())
                })?)?);
            }
            "--team" => {
                index += 1;
                options.team = Some(args.get(index).cloned().ok_or_else(|| {
                    CliError::Usage("--team bir takım ID'si gerektirir.".to_owned())
                })?);
            }
            "--status" => {
                index += 1;
                options.status = Some(parse_match_status(args.get(index).ok_or_else(|| {
                    CliError::Usage("--status bir değer gerektirir.".to_owned())
                })?)?);
            }
            unknown => {
                return Err(CliError::Usage(format!(
                    "Bilinmeyen data seçeneği: {unknown}"
                )))
            }
        }
        index += 1;
    }
    Ok(options)
}

/// Varsayılan dataset yolunu çalışma ortamına göre çözer.
///
/// `--path` ile verilen açık yol her zaman önceliklidir. Varsayılan akışta
/// önce kullanıcı tarafından belirtilen `SF_DATA_DIR`, ardından çalışma
/// dizini ve executable/manifest yanındaki dataset aranır. Bu sayede release
/// binary proje kökünden çalıştırılmak zorunda kalmaz.
fn default_dataset_root() -> PathBuf {
    if let Ok(path) = env::var("SF_DATA_DIR") {
        let path = PathBuf::from(path);
        if path.exists() {
            return path;
        }
    }

    let candidates = [
        env::current_dir()
            .unwrap_or_else(|_| PathBuf::from("."))
            .join(DEFAULT_DATASET_PATH),
        env::current_exe()
            .ok()
            .and_then(|path| {
                path.parent()
                    .map(|parent| parent.join(DEFAULT_DATASET_PATH))
            })
            .unwrap_or_default(),
        PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(DEFAULT_DATASET_PATH),
    ];

    candidates
        .into_iter()
        .find(|path| path.is_dir())
        .unwrap_or_else(|| PathBuf::from(DEFAULT_DATASET_PATH))
}

fn load_data_context(options: &DataOptions) -> Result<DatasetContext, CliError> {
    DatasetContext::load(&options.path).map_err(CliError::from)
}

fn data_validate_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    if options.format != OutputFormat::Human
        || options.position.is_some()
        || options.team.is_some()
        || options.status.is_some()
    {
        return Err(CliError::Usage(
            "Kullanım: sf data validate [--path DİZİN]".to_owned(),
        ));
    }
    let context = load_data_context(&options)?;
    let stats = context.stats();
    println!("Dataset validation successful.\n");
    println!("Season: {}", stats.season);
    println!("Teams: {}", stats.teams.total);
    println!("Players: {}", stats.players.total);
    println!("Fixtures: {}", stats.fixtures.total);
    println!("Matches: {}", stats.matches.finished);
    Ok(())
}

fn data_stats_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    let context = load_data_context(&options)?;
    let stats = context.stats();
    match options.format {
        OutputFormat::Human => print_stats(&stats),
        OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&stats)?),
    }
    Ok(())
}

fn print_stats(stats: &superlig_fantasy_optimizer::data::DatasetStats) {
    println!("Season: {}\n", stats.season);
    println!("Teams:\n  Total: {}\n", stats.teams.total);
    println!(
        "Players:\n  Total: {}\n  Goalkeepers: {}\n  Defenders: {}\n  Midfielders: {}\n  Forwards: {}\n",
        stats.players.total,
        stats.players.goalkeepers,
        stats.players.defenders,
        stats.players.midfielders,
        stats.players.forwards
    );
    println!(
        "Fixtures:\n  Total: {}\n  Scheduled: {}\n  Live: {}\n  Finished: {}\n  Postponed: {}\n  Cancelled: {}\n",
        stats.fixtures.total,
        stats.fixtures.scheduled,
        stats.fixtures.live,
        stats.fixtures.finished,
        stats.fixtures.postponed,
        stats.fixtures.cancelled
    );
    println!("Matches:\n  Finished: {}\n", stats.matches.finished);
    println!("Dataset:\n  Schema version: {}", stats.schema_version);
}

fn data_teams_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    let context = load_data_context(&options)?;
    if options.format == OutputFormat::Json {
        println!("{}", serde_json::to_string_pretty(&context.teams.teams)?);
        return Ok(());
    }
    println!("{:<20} NAME", "ID");
    for team in &context.teams.teams {
        println!("{:<20} {}", team.id, team.name);
    }
    Ok(())
}

fn data_players_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    let context = load_data_context(&options)?;
    let names = team_names(&context);
    let players: Vec<_> = context
        .players
        .players
        .iter()
        .filter(|player| {
            options
                .position
                .is_none_or(|position| player.position == position)
        })
        .filter(|player| {
            options
                .team
                .as_deref()
                .is_none_or(|team| player.team_id == team)
        })
        .collect();
    if options.format == OutputFormat::Json {
        println!("{}", serde_json::to_string_pretty(&players)?);
        return Ok(());
    }
    println!(
        "{:<22} {:<22} {:<20} {:<14} PRICE",
        "ID", "NAME", "TEAM", "POSITION"
    );
    for player in players {
        println!(
            "{:<22} {:<22} {:<20} {:<14} {}",
            player.id,
            player.name,
            names
                .get(player.team_id.as_str())
                .copied()
                .unwrap_or("<unknown>"),
            position_name(player.position),
            format_price(player.price.0)
        );
    }
    Ok(())
}

fn data_fixtures_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    let context = load_data_context(&options)?;
    let names = team_names(&context);
    let fixtures: Vec<_> = context
        .fixtures
        .fixtures
        .iter()
        .filter(|fixture| options.status.is_none_or(|status| fixture.status == status))
        .filter(|fixture| {
            options
                .team
                .as_deref()
                .is_none_or(|team| fixture.home_team_id == team || fixture.away_team_id == team)
        })
        .collect();
    if options.format == OutputFormat::Json {
        println!("{}", serde_json::to_string_pretty(&fixtures)?);
        return Ok(());
    }
    println!(
        "{:<22} {:<25} {:<20} {:<20} STATUS",
        "ID", "DATE", "HOME", "AWAY"
    );
    for fixture in fixtures {
        println!(
            "{:<22} {:<25} {:<20} {:<20} {:?}",
            fixture.id,
            fixture.kickoff,
            names
                .get(fixture.home_team_id.as_str())
                .copied()
                .unwrap_or("<unknown>"),
            names
                .get(fixture.away_team_id.as_str())
                .copied()
                .unwrap_or("<unknown>"),
            fixture.status
        );
    }
    Ok(())
}

fn data_matches_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_data_options(args)?;
    let context = load_data_context(&options)?;
    let names = team_names(&context);
    let mut matches = Vec::new();
    for dataset in &context.matches {
        let fixture = context
            .fixtures
            .fixtures
            .iter()
            .find(|fixture| fixture.id == dataset.match_id);
        let Some(fixture) = fixture else { continue };
        if options
            .team
            .as_deref()
            .is_some_and(|team| fixture.home_team_id != team && fixture.away_team_id != team)
        {
            continue;
        }
        matches.push(MatchListItem {
            match_id: dataset.match_id.clone(),
            home_team_id: fixture.home_team_id.clone(),
            away_team_id: fixture.away_team_id.clone(),
            home_team: names
                .get(fixture.home_team_id.as_str())
                .copied()
                .unwrap_or("<unknown>")
                .to_owned(),
            away_team: names
                .get(fixture.away_team_id.as_str())
                .copied()
                .unwrap_or("<unknown>")
                .to_owned(),
            home_score: dataset.score.home,
            away_score: dataset.score.away,
            players: dataset.players.len(),
            status: dataset.status,
        });
    }
    if options.format == OutputFormat::Json {
        println!("{}", serde_json::to_string_pretty(&matches)?);
        return Ok(());
    }
    println!("MATCH ID\nHOME-AWAY\nSCORE\nPLAYERS");
    for item in matches {
        println!(
            "{}\n{} - {}\n{}-{}\nPlayers: {}\n",
            item.match_id,
            item.home_team,
            item.away_team,
            item.home_score,
            item.away_score,
            item.players
        );
    }
    Ok(())
}

fn position_name(position: Position) -> &'static str {
    match position {
        Position::Goalkeeper => "Goalkeeper",
        Position::Defender => "Defender",
        Position::Midfielder => "Midfielder",
        Position::Forward => "Forward",
    }
}

fn format_price(price: u32) -> String {
    format!("{}.{:02}M TL", price / 100, price % 100)
}

fn data_command(args: &[String]) -> Result<(), CliError> {
    match args.first().map(String::as_str) {
        None | Some("--help") | Some("-h") => {
            print_data_help();
            Ok(())
        }
        Some("validate") => data_validate_command(&args[1..]),
        Some("stats") => data_stats_command(&args[1..]),
        Some("teams") => data_teams_command(&args[1..]),
        Some("players") => data_players_command(&args[1..]),
        Some("fixtures") => data_fixtures_command(&args[1..]),
        Some("matches") => data_matches_command(&args[1..]),
        Some(command) => Err(CliError::Usage(format!(
            "Bilinmeyen data komutu: {command}"
        ))),
    }
}

fn read_input(path: Option<&str>) -> Result<String, CliError> {
    match path {
        Some(path) => Ok(fs::read_to_string(Path::new(path))?),
        None => {
            let mut contents = String::new();
            io::stdin().read_to_string(&mut contents)?;
            Ok(contents)
        }
    }
}

fn parse_score_options(args: &[String]) -> Result<ScoreOptions<'_>, CliError> {
    let mut input = None;
    let mut match_path = None;
    let mut format = OutputFormat::Human;
    let mut index = 0;
    while index < args.len() {
        match args[index].as_str() {
            "--input" => {
                index += 1;
                input = args.get(index).map(String::as_str);
                if input.is_none() {
                    return Err(CliError::Usage(
                        "--input bir dosya yolu gerektirir.".to_owned(),
                    ));
                }
            }
            "--match" => {
                index += 1;
                match_path = args.get(index).map(String::as_str);
                if match_path.is_none() {
                    return Err(CliError::Usage(
                        "--match bir dosya yolu gerektirir.".to_owned(),
                    ));
                }
            }
            "--format" => {
                index += 1;
                let value = args
                    .get(index)
                    .ok_or_else(|| CliError::Usage("--format bir değer gerektirir.".to_owned()))?;
                format = OutputFormat::parse(value)?;
            }
            unknown => {
                return Err(CliError::Usage(format!(
                    "Bilinmeyen score seçeneği: {unknown}"
                )));
            }
        }
        index += 1;
    }
    if input.is_some() && match_path.is_some() {
        return Err(CliError::Usage(
            "--input ve --match aynı anda kullanılamaz.".to_owned(),
        ));
    }
    Ok(ScoreOptions {
        input,
        match_path,
        format,
    })
}

fn parse_format_options(args: &[String]) -> Result<OutputFormat, CliError> {
    if args.is_empty() {
        return Ok(OutputFormat::Human);
    }
    if args.len() == 2 && args[0] == "--format" {
        return OutputFormat::parse(&args[1]);
    }
    Err(CliError::Usage("Kullanım: --format human|json".to_owned()))
}

fn score_command(args: &[String]) -> Result<(), CliError> {
    let options = parse_score_options(args)?;
    if let Some(path) = options.match_path {
        return score_match_command(path, options.format);
    }
    let raw = read_input(options.input)?;
    let performance: MatchPerformanceInput = serde_json::from_str(&raw)?;
    let performance = performance.into_domain();
    let score = calculate_player_match_score(&performance, &ScoringRules::default());

    match options.format {
        OutputFormat::Human => print_score(&performance, &score),
        OutputFormat::Json => println!("{}", serde_json::to_string_pretty(&score)?),
    }
    Ok(())
}

fn season_root_for(path: &Path) -> Result<PathBuf, CliError> {
    if path.is_dir() {
        return Ok(path.to_path_buf());
    }
    path.parent()
        .map(Path::to_path_buf)
        .ok_or_else(|| CliError::Usage("Veri dosyasının sezon dizini bulunamadı.".to_owned()))
}

fn load_match_context(
    path: &Path,
) -> Result<(MatchDataset, TeamDataset, PlayerDataset, FixtureDataset), CliError> {
    let season_root = path
        .parent()
        .and_then(Path::parent)
        .ok_or_else(|| CliError::Usage("Maç dosyasının sezon dizini bulunamadı.".to_owned()))?;
    let dataset = read_json(path)?;
    let teams = read_json(&season_root.join("teams.json"))?;
    let players = read_json(&season_root.join("players.json"))?;
    let fixtures = read_json(&season_root.join("fixtures.json"))?;
    Ok((dataset, teams, players, fixtures))
}

fn score_match_command(path: &str, format: OutputFormat) -> Result<(), CliError> {
    let path = Path::new(path);
    let (dataset, teams, players, fixtures) = load_match_context(path)?;
    validate_match(&dataset, &teams, &players, &fixtures)?;
    let rules = ScoringRules::default();
    let mut scores = Vec::new();
    for raw in &dataset.players {
        let player = players
            .players
            .iter()
            .find(|player| player.id == raw.player_id)
            .ok_or_else(|| DataValidationError::UnknownPlayer {
                player_id: raw.player_id.clone(),
            })?;
        let performance = to_domain_performance(player, raw);
        let score = calculate_player_match_score(&performance, &rules);
        if format == OutputFormat::Human {
            print_score(&performance, &score);
            println!();
        }
        scores.push(score);
    }
    if format == OutputFormat::Json {
        println!(
            "{}",
            serde_json::to_string_pretty(&MatchScoreOutput {
                match_id: dataset.match_id,
                players: scores,
            })?
        );
    }
    Ok(())
}

fn to_domain_performance(player: &PlayerRecord, raw: &MatchPlayerPerformance) -> MatchPerformance {
    MatchPerformance {
        player_id: 0,
        player_name: player.name.clone(),
        position: player.position,
        minutes: raw.minutes,
        goals: raw.goals,
        assists: raw.assists,
        saves: raw.saves,
        penalty_saves: raw.penalty_saves,
        penalty_misses: raw.penalty_misses,
        goals_conceded: raw.goals_conceded,
        yellow_cards: raw.yellow_cards,
        red_cards: raw.red_cards,
        own_goals: raw.own_goals,
        clean_sheet: raw.clean_sheet,
        bonus_rank: raw.bonus_rank,
    }
}

fn rules_command(args: &[String]) -> Result<(), CliError> {
    match parse_format_options(args)? {
        OutputFormat::Human => {
            let rules = ScoringRules::default();
            println!("Scoring rules");
            println!("60 minutes: +{}", rules.minutes_60_points);
            println!("Over 60 minutes: +{}", rules.minutes_over_60_points);
            println!("Goalkeeper goal: +{}", rules.goalkeeper_goal_points);
            println!("Defender goal: +{}", rules.defender_goal_points);
            println!("Midfielder goal: +{}", rules.midfielder_goal_points);
            println!("Forward goal: +{}", rules.forward_goal_points);
            println!("Assist: +{}", rules.assist_points);
            println!("Captain multiplier: {}x", rules.captain_multiplier);
        }
        OutputFormat::Json => println!(
            "{}",
            serde_json::to_string_pretty(&ScoringRules::default())?
        ),
    }
    Ok(())
}

fn validate_command(args: &[String]) -> Result<(), CliError> {
    let path = args
        .first()
        .ok_or_else(|| CliError::Usage("Kullanım: sf validate DOSYA".to_owned()))?;
    if args.len() != 1 {
        return Err(CliError::Usage("Kullanım: sf validate DOSYA".to_owned()));
    }
    let path = Path::new(path);
    if path.is_dir() {
        validate_season_directory(path)?;
        println!("Validation successful.");
        return Ok(());
    }

    let raw = fs::read_to_string(path)?;
    let value: Value = serde_json::from_str(&raw)?;
    if value.get("schema_version").is_some() {
        if value.get("match_id").is_some() {
            let path = path.to_path_buf();
            let (dataset, teams, players, fixtures) = load_match_context(&path)?;
            validate_match(&dataset, &teams, &players, &fixtures)?;
        } else if value.get("teams").is_some() {
            let dataset: TeamDataset = serde_json::from_value(value)?;
            validate_teams(&dataset)?;
        } else if value.get("players").is_some() {
            let dataset: PlayerDataset = serde_json::from_str(&raw)?;
            let root = season_root_for(path)?;
            let teams: TeamDataset = read_json(&root.join("teams.json"))?;
            validate_players(&dataset, &teams)?;
        } else if value.get("fixtures").is_some() {
            let dataset: FixtureDataset = serde_json::from_str(&raw)?;
            let root = season_root_for(path)?;
            let teams: TeamDataset = read_json(&root.join("teams.json"))?;
            validate_fixtures(&dataset, &teams)?;
        } else {
            return Err(CliError::Usage(
                "Tanınmayan veri kümesi JSON yapısı.".to_owned(),
            ));
        }
    } else if value.get("players").is_some() {
        let squad: Squad = serde_json::from_value(value)?;
        validate_squad(&squad, &SquadRules::default())
            .map_err(|error| CliError::Usage(error.to_string()))?;
    } else {
        let performance: MatchPerformanceInput = serde_json::from_str(&raw)?;
        if performance
            .bonus_rank
            .is_some_and(|rank| !(1..=3).contains(&rank))
        {
            return Err(CliError::Usage(
                "bonus_rank null veya 1, 2, 3 değerlerinden biri olmalıdır.".to_owned(),
            ));
        }
    }
    println!("Validation successful.");
    Ok(())
}

fn fixture_command(args: &[String]) -> Result<(), CliError> {
    let fixture = args.first().ok_or_else(|| {
        CliError::Usage(
            "Kullanım: sf fixture score-forward|score-defender|score-goalkeeper".to_owned(),
        )
    })?;
    if args.len() != 1 {
        return Err(CliError::Usage("Bir fixture adı belirtin.".to_owned()));
    }
    let position = match fixture.as_str() {
        "score-forward" => Position::Forward,
        "score-defender" => Position::Defender,
        "score-goalkeeper" => Position::Goalkeeper,
        _ => return Err(CliError::Usage(format!("Bilinmeyen fixture: {fixture}"))),
    };
    let performance = MatchPerformance {
        player_id: 0,
        player_name: format!("Fixture {}", fixture.replace("score-", "")),
        position,
        minutes: 90,
        goals: 1,
        assists: 1,
        saves: if position == Position::Goalkeeper {
            6
        } else {
            0
        },
        penalty_saves: 0,
        penalty_misses: 0,
        goals_conceded: 0,
        yellow_cards: 0,
        red_cards: 0,
        own_goals: 0,
        clean_sheet: true,
        bonus_rank: Some(1),
    };
    let score = calculate_player_match_score(&performance, &ScoringRules::default());
    print_score(&performance, &score);
    Ok(())
}

fn print_score(performance: &MatchPerformance, score: &PlayerMatchScore) {
    println!("{}", performance.player_name);
    println!("  Position: {:?}", performance.position);
    println!("  Minutes: {:+}", score.minutes_points);
    println!("  Goals: {:+}", score.goals_points);
    println!("  Assists: {:+}", score.assists_points);
    println!("  Clean Sheet: {:+}", score.clean_sheet_points);
    println!("  Saves: {:+}", score.saves_points);
    println!("  Penalties: {:+}", score.penalties_points);
    println!("  Goals Conceded: {:+}", score.goals_conceded_points);
    println!("  Cards: {:+}", score.cards_points);
    println!("  Own Goals: {:+}", score.own_goal_points);
    println!("  Bonus: {:+}", score.bonus_points);
    println!("  Total: {}", score.total);
}

fn run(args: &[String]) -> Result<(), CliError> {
    match args.first().map(String::as_str) {
        None | Some("--help") | Some("-h") => {
            print_help();
            Ok(())
        }
        Some("score") => score_command(&args[1..]),
        Some("optimize") => optimize_command(&args[1..]),
        Some("projection") => projection_command(&args[1..]),
        Some("rules") => rules_command(&args[1..]),
        Some("formation") => formation_command(&args[1..]),
        Some("validate") => validate_command(&args[1..]),
        Some("data") => data_command(&args[1..]),
        Some("fixture") => fixture_command(&args[1..]),
        Some("version") if args.len() == 1 => {
            println!("sf {VERSION}");
            Ok(())
        }
        Some(command) => Err(CliError::Usage(format!("Bilinmeyen komut: {command}"))),
    }
}

fn main() {
    let args: Vec<_> = env::args().skip(1).collect();
    if let Err(error) = run(&args) {
        eprintln!("Hata: {error}");
        std::process::exit(1);
    }
}
