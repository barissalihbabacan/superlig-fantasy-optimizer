//! JSON persistence modelleri ve veri kümesi doğrulaması.

pub mod fixtures;
pub mod matches;
pub mod players;
pub mod projections;
pub mod teams;
pub mod validation;

use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

use crate::{error::DataValidationError, Position};

use self::{
    fixtures::{FixtureDataset, MatchStatus},
    matches::MatchDataset,
    players::PlayerDataset,
    teams::TeamDataset,
    validation::{read_json, validate_fixtures, validate_match, validate_players, validate_teams},
};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct SourceMetadata {
    pub name: String,
    pub retrieved_at: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

pub const CURRENT_SCHEMA_VERSION: u32 = 1;

/// Bir sezon dataset'inin doğrulanmış, ortak okuma bağlamı.
#[derive(Clone, Debug)]
pub struct DatasetContext {
    pub root: PathBuf,
    pub teams: TeamDataset,
    pub players: PlayerDataset,
    pub fixtures: FixtureDataset,
    pub matches: Vec<MatchDataset>,
}

impl DatasetContext {
    /// Zorunlu dosyaları yükler, referential integrity'yi doğrular ve maçları okur.
    pub fn load(root: impl AsRef<Path>) -> Result<Self, DataValidationError> {
        let root = root.as_ref().to_path_buf();
        let teams: TeamDataset = read_json(&root.join("teams.json"))?;
        let players: PlayerDataset = read_json(&root.join("players.json"))?;
        let fixtures: FixtureDataset = read_json(&root.join("fixtures.json"))?;
        validate_teams(&teams)?;
        validate_players(&players, &teams)?;
        validate_fixtures(&fixtures, &teams)?;
        check_season(&teams.season, &players.season, "Oyuncu")?;
        check_season(&teams.season, &fixtures.season, "Fikstür")?;

        let mut matches = Vec::new();
        let matches_dir = root.join("matches");
        if matches_dir.exists() {
            let mut paths = fs::read_dir(&matches_dir)
                .map_err(|error| DataValidationError::Io(error.to_string()))?
                .map(|entry| entry.map(|entry| entry.path()))
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| DataValidationError::Io(error.to_string()))?;
            paths.sort();
            for path in paths {
                if path
                    .extension()
                    .is_some_and(|extension| extension == "json")
                {
                    let dataset: MatchDataset = read_json(&path)?;
                    validate_match(&dataset, &teams, &players, &fixtures)?;
                    check_season(&teams.season, &dataset.season, "Maç")?;
                    matches.push(dataset);
                }
            }
        }

        Ok(Self {
            root,
            teams,
            players,
            fixtures,
            matches,
        })
    }

    /// Dataset'in terminal ve JSON özetlerinde kullanılan dinamik istatistikleri üretir.
    pub fn stats(&self) -> DatasetStats {
        compute_dataset_stats(&self.teams, &self.players, &self.fixtures, &self.matches)
    }
}

/// `DatasetContext::stats()` ile aynı hesaplamayı, dosya sistemine dokunmadan,
/// zaten bellekte doğrulanmış parçalardan üretir (ör. wasm sınırında kullanılır).
pub fn compute_dataset_stats(
    teams: &TeamDataset,
    players: &PlayerDataset,
    fixtures: &FixtureDataset,
    matches: &[MatchDataset],
) -> DatasetStats {
    let mut player_stats = PlayerStats::default();
    for player in &players.players {
        player_stats.total += 1;
        match player.position {
            Position::Goalkeeper => player_stats.goalkeepers += 1,
            Position::Defender => player_stats.defenders += 1,
            Position::Midfielder => player_stats.midfielders += 1,
            Position::Forward => player_stats.forwards += 1,
        }
    }
    let mut fixture_stats = FixtureStats::default();
    for fixture in &fixtures.fixtures {
        fixture_stats.total += 1;
        match fixture.status {
            MatchStatus::Scheduled => fixture_stats.scheduled += 1,
            MatchStatus::Live => fixture_stats.live += 1,
            MatchStatus::Finished => fixture_stats.finished += 1,
            MatchStatus::Postponed => fixture_stats.postponed += 1,
            MatchStatus::Cancelled => fixture_stats.cancelled += 1,
        }
    }
    let finished_fixture_ids: std::collections::HashSet<&str> = fixtures
        .fixtures
        .iter()
        .filter(|fixture| fixture.status == MatchStatus::Finished)
        .map(|fixture| fixture.id.as_str())
        .collect();
    let match_ids: std::collections::HashSet<&str> =
        matches.iter().map(|item| item.match_id.as_str()).collect();
    let finished_fixtures_with_player_data = finished_fixture_ids
        .iter()
        .filter(|id| match_ids.contains(*id))
        .count();

    DatasetStats {
        season: teams.season.clone(),
        schema_version: CURRENT_SCHEMA_VERSION,
        teams: TeamStats {
            total: teams.teams.len(),
        },
        players: player_stats,
        fixtures: fixture_stats,
        matches: MatchStats {
            finished: matches
                .iter()
                .filter(|item| item.status == MatchStatus::Finished)
                .count(),
            finished_fixtures: finished_fixture_ids.len(),
            finished_fixtures_with_player_data,
        },
    }
}

fn check_season(
    expected: &str,
    actual: &str,
    entity: &'static str,
) -> Result<(), DataValidationError> {
    if expected != actual {
        return Err(DataValidationError::SeasonMismatch {
            entity,
            expected: expected.to_owned(),
            actual: actual.to_owned(),
        });
    }
    Ok(())
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct PlayerStats {
    pub total: usize,
    pub goalkeepers: usize,
    pub defenders: usize,
    pub midfielders: usize,
    pub forwards: usize,
}

#[derive(Clone, Debug, Default, Serialize)]
pub struct FixtureStats {
    pub total: usize,
    pub scheduled: usize,
    pub live: usize,
    pub finished: usize,
    pub postponed: usize,
    pub cancelled: usize,
}

#[derive(Clone, Debug, Serialize)]
pub struct TeamStats {
    pub total: usize,
}

#[derive(Clone, Debug, Serialize)]
pub struct MatchStats {
    pub finished: usize,
    /// `fixtures.json` içinde `status == "finished"` olan fikstür sayısı.
    pub finished_fixtures: usize,
    /// Bitmiş fikstürlerden `matches/<fixture_id>.json` dosyası yüklenmiş olanların sayısı.
    /// Sezon başında bu sayının `finished_fixtures`'dan düşük olması beklenen bir durumdur
    /// (bkz. CLAUDE.md); bir hata değildir.
    pub finished_fixtures_with_player_data: usize,
}

#[derive(Clone, Debug, Serialize)]
pub struct DatasetStats {
    pub season: String,
    pub schema_version: u32,
    pub teams: TeamStats,
    pub players: PlayerStats,
    pub fixtures: FixtureStats,
    pub matches: MatchStats,
}

/// Liste çıktıları için takım adlarını ve ID ilişkilerini hazırlar.
pub fn team_names(context: &DatasetContext) -> HashMap<&str, &str> {
    context
        .teams
        .teams
        .iter()
        .map(|team| (team.id.as_str(), team.name.as_str()))
        .collect()
}
