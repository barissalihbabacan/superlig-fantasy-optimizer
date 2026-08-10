//! Geçmiş ham maç performanslarından deterministic oyuncu projection'ı üretir.

use std::collections::HashMap;

use crate::{
    calculate_player_match_score,
    data::{
        fixtures::{FixtureRecord, MatchStatus},
        matches::{MatchDataset, MatchPlayerPerformance},
        players::{PlayerDataset, PlayerRecord},
        projections::{ProjectionDataset, ProjectionRecord},
        SourceMetadata,
    },
    models::MatchPerformance,
    rules::ScoringRules,
};

pub const DEFAULT_WINDOW_SIZE: usize = 5;
pub const DEFAULT_FIXTURE_HORIZON: usize = 3;

#[derive(Clone, Copy, Debug, Eq, PartialEq, serde::Serialize)]
pub enum FixtureDifficulty {
    Unknown,
}

#[derive(Clone, Debug, Eq, PartialEq, serde::Serialize)]
pub struct UpcomingFixture {
    pub round: u16,
    pub opponent_team_id: String,
    pub is_home: bool,
    pub difficulty: FixtureDifficulty,
}

/// Gerçekleşmiş maç sonuçlarından türetilen, kalibre edilmemiş takım özeti.
///
/// Bu ilk sürümde bu değerler fixture difficulty katsayısına dönüştürülmez;
/// yeterli ve proje içinde tanımlı bir rating kalibrasyonu bulunmadığı için
/// fixture difficulty bilinmiyor olarak kalır.
#[derive(Clone, Debug, PartialEq)]
pub struct TeamStrength {
    pub team_id: String,
    pub matches: usize,
    pub points_per_match: f64,
    pub goals_for_per_match: f64,
    pub goals_against_per_match: f64,
    pub goal_difference_per_match: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct PlayerProjectionSummary {
    pub player_id: String,
    pub matches_considered: usize,
    pub points: Vec<i32>,
    pub total_points: i32,
    pub average_points: f64,
    pub weighted_average: f64,
    pub expected_points: f64,
    pub upcoming_fixtures: Vec<UpcomingFixture>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ProjectionCalculation {
    pub summaries: Vec<PlayerProjectionSummary>,
    pub projections: ProjectionDataset,
}

/// Chronological historical scores to weighted expected points.
pub fn calculate_projection(player_id: &str, history: &[i32]) -> PlayerProjectionSummary {
    calculate_projection_with_fixtures(player_id, history, Vec::new())
}

fn calculate_projection_with_fixtures(
    player_id: &str,
    history: &[i32],
    upcoming_fixtures: Vec<UpcomingFixture>,
) -> PlayerProjectionSummary {
    let start = history.len().saturating_sub(DEFAULT_WINDOW_SIZE);
    let points = history[start..].to_vec();
    let matches_considered = points.len();
    let total_points = points.iter().sum();
    let average_points = if matches_considered == 0 {
        0.0
    } else {
        f64::from(total_points) / matches_considered as f64
    };
    let weight_total: i32 = (1..=matches_considered as i32).sum();
    let weighted_sum: i32 = points
        .iter()
        .zip(1..=matches_considered as i32)
        .map(|(points, weight)| points * weight)
        .sum();
    let weighted_average = if weight_total == 0 {
        0.0
    } else {
        f64::from(weighted_sum) / f64::from(weight_total)
    };
    let expected_points = weighted_average.max(0.0);
    PlayerProjectionSummary {
        player_id: player_id.to_owned(),
        matches_considered,
        points,
        total_points,
        average_points,
        weighted_average,
        expected_points,
        upcoming_fixtures,
    }
}

/// Tüm oyuncular için önce actual score, sonra historical summary üretir.
///
/// Match dataset'te bulunmayan oyuncular ve minutes == 0 kayıtları,
/// mevcut şemada kadroda olup oynamama ayrımı güvenilir olmadığı için
/// projection geçmişine eklenmez.
pub fn project_all_players(
    players: &PlayerDataset,
    matches: &[MatchDataset],
    fixtures: &[FixtureRecord],
    rules: &ScoringRules,
) -> ProjectionCalculation {
    project_all_players_with_options(
        players,
        matches,
        fixtures,
        rules,
        None,
        DEFAULT_FIXTURE_HORIZON,
    )
}

/// Tüm oyuncular için historical projection ve gelecek fixture metadata'sı üretir.
///
/// `current_round` verilmezse, fixture ID'siyle eşleşen tamamlanmış maçların
/// en yüksek haftası kullanılır. Eşleşen gerçek maç yoksa sezon başlangıcı (0)
/// kabul edilir. Bu, legacy maç kayıtlarını yeni oyunculara aktarmadan güvenli
/// biçimde tüm gerçek fikstürü gelecekte olarak bırakır.
pub fn project_all_players_with_options(
    players: &PlayerDataset,
    matches: &[MatchDataset],
    fixtures: &[FixtureRecord],
    rules: &ScoringRules,
    current_round: Option<u16>,
    fixture_horizon: usize,
) -> ProjectionCalculation {
    let player_map: HashMap<_, _> = players
        .players
        .iter()
        .map(|player| (player.id.as_str(), player))
        .collect();
    let mut ordered_matches: Vec<_> = matches.iter().collect();
    ordered_matches.sort_by(|left, right| {
        fixture_sort_key(left, fixtures).cmp(&fixture_sort_key(right, fixtures))
    });

    let mut histories: HashMap<String, Vec<i32>> = HashMap::new();
    for dataset in ordered_matches {
        if dataset.status != MatchStatus::Finished {
            continue;
        }
        for raw in &dataset.players {
            let Some(player) = player_map.get(raw.player_id.as_str()) else {
                continue;
            };
            if raw.minutes == 0 || raw.team_id != player.team_id {
                continue;
            }
            let performance = to_match_performance(player, raw);
            let score = calculate_player_match_score(&performance, rules);
            histories
                .entry(raw.player_id.clone())
                .or_default()
                .push(score.total);
        }
    }

    let current_round = current_round.unwrap_or_else(|| infer_current_round(matches, fixtures));
    let fixture_index = fixtures_by_team(fixtures);

    let summaries: Vec<_> = players
        .players
        .iter()
        .map(|player| {
            let upcoming_fixtures = upcoming_fixtures_for_team(
                &player.team_id,
                &fixture_index,
                current_round,
                fixture_horizon,
            );
            calculate_projection_with_fixtures(
                &player.id,
                histories.get(player.id.as_str()).map_or(&[], Vec::as_slice),
                upcoming_fixtures,
            )
        })
        .collect();
    let projections = ProjectionDataset {
        schema_version: 1,
        season: players.season.clone(),
        source: SourceMetadata {
            name: "derived".to_owned(),
            retrieved_at: "not-provided".to_owned(),
            url: None,
        },
        projections: summaries
            .iter()
            .filter(|summary| summary.matches_considered > 0)
            .map(|summary| ProjectionRecord {
                player_id: summary.player_id.clone(),
                expected_points: summary.expected_points,
            })
            .collect(),
    };
    ProjectionCalculation {
        summaries,
        projections,
    }
}

/// Oyuncunun takımına göre, mevcut haftadan sonraki en fazla `horizon` fixture'ı çözer.
pub fn upcoming_fixtures_for_player(
    player: &PlayerRecord,
    fixtures: &[FixtureRecord],
    current_round: u16,
    horizon: usize,
) -> Vec<UpcomingFixture> {
    let index = fixtures_by_team(fixtures);
    upcoming_fixtures_for_team(&player.team_id, &index, current_round, horizon)
}

/// Tamamlanmış ve fixture ile eşleşen gerçek maç sonuçlarından takım özetleri çıkarır.
pub fn calculate_team_strengths(
    matches: &[MatchDataset],
    fixtures: &[FixtureRecord],
) -> Vec<TeamStrength> {
    let fixture_map: HashMap<_, _> = fixtures
        .iter()
        .map(|fixture| (fixture.id.as_str(), fixture))
        .collect();
    let mut totals: HashMap<String, (usize, u32, u32, u32)> = HashMap::new();
    for dataset in matches
        .iter()
        .filter(|dataset| dataset.status == MatchStatus::Finished)
    {
        let Some(fixture) = fixture_map.get(dataset.match_id.as_str()) else {
            continue;
        };
        let (home_points, away_points) = match dataset.score.home.cmp(&dataset.score.away) {
            std::cmp::Ordering::Greater => (3, 0),
            std::cmp::Ordering::Less => (0, 3),
            std::cmp::Ordering::Equal => (1, 1),
        };
        let home = totals.entry(fixture.home_team_id.clone()).or_default();
        home.0 += 1;
        home.1 += home_points;
        home.2 += u32::from(dataset.score.home);
        home.3 += u32::from(dataset.score.away);
        let away = totals.entry(fixture.away_team_id.clone()).or_default();
        away.0 += 1;
        away.1 += away_points;
        away.2 += u32::from(dataset.score.away);
        away.3 += u32::from(dataset.score.home);
    }
    let mut strengths: Vec<_> = totals
        .into_iter()
        .filter_map(|(team_id, (matches, points, goals_for, goals_against))| {
            (matches > 0).then(|| TeamStrength {
                team_id,
                matches,
                points_per_match: points as f64 / matches as f64,
                goals_for_per_match: goals_for as f64 / matches as f64,
                goals_against_per_match: goals_against as f64 / matches as f64,
                goal_difference_per_match: (goals_for as f64 - goals_against as f64)
                    / matches as f64,
            })
        })
        .collect();
    strengths.sort_by(|left, right| left.team_id.cmp(&right.team_id));
    strengths
}

fn fixtures_by_team(fixtures: &[FixtureRecord]) -> HashMap<&str, Vec<&FixtureRecord>> {
    let mut index: HashMap<&str, Vec<&FixtureRecord>> = HashMap::new();
    for fixture in fixtures {
        index
            .entry(fixture.home_team_id.as_str())
            .or_default()
            .push(fixture);
        index
            .entry(fixture.away_team_id.as_str())
            .or_default()
            .push(fixture);
    }
    for team_fixtures in index.values_mut() {
        team_fixtures
            .sort_by_key(|fixture| (fixture.round, fixture.kickoff.as_str(), fixture.id.as_str()));
    }
    index
}

fn upcoming_fixtures_for_team(
    team_id: &str,
    index: &HashMap<&str, Vec<&FixtureRecord>>,
    current_round: u16,
    horizon: usize,
) -> Vec<UpcomingFixture> {
    index
        .get(team_id)
        .into_iter()
        .flat_map(|items| items.iter())
        .filter(|fixture| {
            fixture.round > current_round
                && matches!(
                    fixture.status,
                    MatchStatus::Scheduled | MatchStatus::Postponed
                )
        })
        .take(horizon)
        .map(|fixture| UpcomingFixture {
            round: fixture.round,
            opponent_team_id: if fixture.home_team_id == team_id {
                fixture.away_team_id.clone()
            } else {
                fixture.home_team_id.clone()
            },
            is_home: fixture.home_team_id == team_id,
            difficulty: FixtureDifficulty::Unknown,
        })
        .collect()
}

fn infer_current_round(matches: &[MatchDataset], fixtures: &[FixtureRecord]) -> u16 {
    matches
        .iter()
        .filter(|dataset| dataset.status == MatchStatus::Finished)
        .filter_map(|dataset| {
            fixtures
                .iter()
                .find(|fixture| fixture.id == dataset.match_id)
        })
        .map(|fixture| fixture.round)
        .max()
        .unwrap_or(0)
}

fn fixture_sort_key(dataset: &MatchDataset, fixtures: &[FixtureRecord]) -> (String, String) {
    let fixture = fixtures
        .iter()
        .find(|fixture| fixture.id == dataset.match_id)
        .map(|fixture| (fixture.round, fixture.kickoff.clone()))
        .unwrap_or((0, String::new()));
    (
        format!("{:05}:{}", fixture.0, fixture.1),
        dataset.match_id.clone(),
    )
}

fn to_match_performance(player: &PlayerRecord, raw: &MatchPlayerPerformance) -> MatchPerformance {
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
