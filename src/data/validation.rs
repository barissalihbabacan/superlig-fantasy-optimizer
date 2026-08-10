use std::{
    collections::{HashMap, HashSet},
    fs,
    path::Path,
};

use crate::error::DataValidationError;

use super::{
    fixtures::{FixtureDataset, FixtureRecord, MatchStatus},
    matches::MatchDataset,
    players::PlayerDataset,
    teams::TeamDataset,
    CURRENT_SCHEMA_VERSION,
};

fn check_schema(version: u32) -> Result<(), DataValidationError> {
    if version != CURRENT_SCHEMA_VERSION {
        return Err(DataValidationError::UnsupportedSchemaVersion(version));
    }
    Ok(())
}

pub fn validate_teams(dataset: &TeamDataset) -> Result<(), DataValidationError> {
    check_schema(dataset.schema_version)?;
    let mut ids = HashSet::new();
    for team in &dataset.teams {
        if team.id.trim().is_empty() {
            return Err(DataValidationError::EmptyId { entity: "Takım" });
        }
        if team.name.trim().is_empty() {
            return Err(DataValidationError::EmptyName { entity: "Takım" });
        }
        if !ids.insert(&team.id) {
            return Err(DataValidationError::DuplicateId {
                entity: "takım",
                id: team.id.clone(),
            });
        }
    }
    Ok(())
}

pub fn validate_players(
    dataset: &PlayerDataset,
    teams: &TeamDataset,
) -> Result<(), DataValidationError> {
    check_schema(dataset.schema_version)?;
    validate_teams(teams)?;
    let team_ids: HashSet<_> = teams.teams.iter().map(|team| team.id.as_str()).collect();
    let mut player_ids = HashSet::new();
    for player in &dataset.players {
        if player.id.trim().is_empty() {
            return Err(DataValidationError::EmptyId { entity: "Oyuncu" });
        }
        if player.name.trim().is_empty() {
            return Err(DataValidationError::EmptyName { entity: "Oyuncu" });
        }
        if !player_ids.insert(&player.id) {
            return Err(DataValidationError::DuplicateId {
                entity: "oyuncu",
                id: player.id.clone(),
            });
        }
        if !team_ids.contains(player.team_id.as_str()) {
            return Err(DataValidationError::UnknownTeam {
                player_id: player.id.clone(),
                team_id: player.team_id.clone(),
            });
        }
    }
    Ok(())
}

pub fn validate_fixtures(
    dataset: &FixtureDataset,
    teams: &TeamDataset,
) -> Result<(), DataValidationError> {
    check_schema(dataset.schema_version)?;
    validate_teams(teams)?;
    if dataset.season != teams.season {
        return Err(DataValidationError::SeasonMismatch {
            entity: "Fikstür",
            expected: teams.season.clone(),
            actual: dataset.season.clone(),
        });
    }
    let team_ids: HashSet<_> = teams.teams.iter().map(|team| team.id.as_str()).collect();
    let mut fixture_ids = HashSet::new();
    for fixture in &dataset.fixtures {
        validate_fixture(fixture, &team_ids, &mut fixture_ids)?;
    }
    if dataset.fixtures.iter().any(|fixture| fixture.round != 0) {
        validate_full_schedule(dataset, &team_ids)?;
    }
    Ok(())
}

pub fn validate_full_schedule(
    dataset: &FixtureDataset,
    team_ids: &HashSet<&str>,
) -> Result<(), DataValidationError> {
    if dataset.fixtures.len() != 306 {
        return Err(DataValidationError::InvalidFixtureSchedule {
            reason: format!(
                "toplam fixture sayısı 306 olmalı: {}",
                dataset.fixtures.len()
            ),
        });
    }
    let mut rounds: HashMap<u16, Vec<&FixtureRecord>> = HashMap::new();
    for fixture in &dataset.fixtures {
        rounds.entry(fixture.round).or_default().push(fixture);
    }
    if rounds.len() != 34 || (1..=34).any(|round| !rounds.contains_key(&round)) {
        return Err(DataValidationError::InvalidFixtureSchedule {
            reason: "1-34 arası tüm haftalar bulunmalı.".to_owned(),
        });
    }
    let mut pair_counts: HashMap<(&str, &str), usize> = HashMap::new();
    let mut appearances: HashMap<&str, usize> =
        team_ids.iter().copied().map(|id| (id, 0)).collect();
    for round in 1..=34 {
        let fixtures = &rounds[&round];
        if fixtures.len() != 9 {
            return Err(DataValidationError::InvalidFixtureSchedule {
                reason: format!("{round}. haftada 9 fixture olmalı: {}", fixtures.len()),
            });
        }
        let mut weekly_teams = HashSet::new();
        for fixture in fixtures {
            if !weekly_teams.insert(fixture.home_team_id.as_str())
                || !weekly_teams.insert(fixture.away_team_id.as_str())
            {
                return Err(DataValidationError::InvalidFixtureSchedule {
                    reason: format!("{round}. haftada bir takım birden fazla oynuyor."),
                });
            }
            *appearances
                .entry(fixture.home_team_id.as_str())
                .or_default() += 1;
            *appearances
                .entry(fixture.away_team_id.as_str())
                .or_default() += 1;
            *pair_counts
                .entry((fixture.home_team_id.as_str(), fixture.away_team_id.as_str()))
                .or_default() += 1;
        }
        if weekly_teams.len() != 18 {
            return Err(DataValidationError::InvalidFixtureSchedule {
                reason: format!("{round}. haftada 18 farklı takım olmalı."),
            });
        }
    }
    if appearances.values().any(|count| *count != 34) {
        return Err(DataValidationError::InvalidFixtureSchedule {
            reason: "her takım toplam 34 maç oynamalı.".to_owned(),
        });
    }
    for home in team_ids {
        for away in team_ids {
            if home == away {
                continue;
            }
            let home_count = pair_counts.get(&(*home, *away)).copied().unwrap_or(0);
            let away_count = pair_counts.get(&(*away, *home)).copied().unwrap_or(0);
            if home_count != 1 || away_count != 1 {
                return Err(DataValidationError::InvalidFixtureSchedule {
                    reason: format!("{home} - {away} eşleşmesi home/away olarak birer kez olmalı."),
                });
            }
        }
    }
    Ok(())
}

fn validate_fixture(
    fixture: &FixtureRecord,
    team_ids: &HashSet<&str>,
    fixture_ids: &mut HashSet<String>,
) -> Result<(), DataValidationError> {
    if fixture.id.trim().is_empty() {
        return Err(DataValidationError::EmptyId { entity: "Fikstür" });
    }
    if !fixture_ids.insert(fixture.id.clone()) {
        return Err(DataValidationError::DuplicateId {
            entity: "fikstür",
            id: fixture.id.clone(),
        });
    }
    if !team_ids.contains(fixture.home_team_id.as_str()) {
        return Err(DataValidationError::UnknownTeam {
            player_id: fixture.id.clone(),
            team_id: fixture.home_team_id.clone(),
        });
    }
    if !team_ids.contains(fixture.away_team_id.as_str()) {
        return Err(DataValidationError::UnknownTeam {
            player_id: fixture.id.clone(),
            team_id: fixture.away_team_id.clone(),
        });
    }
    if fixture.home_team_id == fixture.away_team_id {
        return Err(DataValidationError::SameFixtureTeams {
            fixture_id: fixture.id.clone(),
        });
    }
    Ok(())
}

pub fn validate_match(
    dataset: &MatchDataset,
    teams: &TeamDataset,
    players: &PlayerDataset,
    fixtures: &FixtureDataset,
) -> Result<(), DataValidationError> {
    check_schema(dataset.schema_version)?;
    validate_players(players, teams)?;
    validate_fixtures(fixtures, teams)?;
    if dataset.status != MatchStatus::Finished {
        return Err(DataValidationError::InvalidMatchStatus {
            match_id: dataset.match_id.clone(),
        });
    }
    let fixture = fixtures
        .fixtures
        .iter()
        .find(|fixture| fixture.id == dataset.match_id)
        .ok_or_else(|| DataValidationError::UnknownFixture {
            match_id: dataset.match_id.clone(),
        })?;
    let player_map: std::collections::HashMap<_, _> = players
        .players
        .iter()
        .map(|player| (&player.id, player))
        .collect();
    let mut seen = HashSet::new();
    for performance in &dataset.players {
        if !seen.insert(&performance.player_id) {
            return Err(DataValidationError::DuplicateMatchPlayer {
                player_id: performance.player_id.clone(),
            });
        }
        let player = player_map.get(&performance.player_id).ok_or_else(|| {
            DataValidationError::UnknownPlayer {
                player_id: performance.player_id.clone(),
            }
        })?;
        if performance.team_id != fixture.home_team_id
            && performance.team_id != fixture.away_team_id
        {
            return Err(DataValidationError::PlayerNotInMatchTeams {
                player_id: performance.player_id.clone(),
                team_id: performance.team_id.clone(),
            });
        }
        if performance.team_id != player.team_id {
            return Err(DataValidationError::PlayerNotInMatchTeams {
                player_id: performance.player_id.clone(),
                team_id: performance.team_id.clone(),
            });
        }
        if performance.minutes > 120 {
            return Err(DataValidationError::InvalidMinutes {
                player_id: performance.player_id.clone(),
                minutes: performance.minutes,
            });
        }
        if performance
            .bonus_rank
            .is_some_and(|rank| !(1..=3).contains(&rank))
        {
            return Err(DataValidationError::InvalidNegativeValue {
                field: "bonus_rank",
                player_id: performance.player_id.clone(),
            });
        }
    }
    Ok(())
}

pub fn validate_season_directory(path: &Path) -> Result<(), DataValidationError> {
    super::DatasetContext::load(path).map(|_| ())
}

pub fn read_json<T: serde::de::DeserializeOwned>(path: &Path) -> Result<T, DataValidationError> {
    if !path.exists() {
        return Err(DataValidationError::Io(format!(
            "{} not found",
            path.display()
        )));
    }
    let raw =
        fs::read_to_string(path).map_err(|error| DataValidationError::Io(error.to_string()))?;
    serde_json::from_str(&raw).map_err(|error| DataValidationError::Json(error.to_string()))
}
