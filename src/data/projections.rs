use std::collections::{HashMap, HashSet};

use serde::{Deserialize, Serialize};

use crate::error::DataValidationError;

use super::{
    players::PlayerDataset,
    validation::{validate_players, validate_teams},
    SourceMetadata, CURRENT_SCHEMA_VERSION,
};

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ProjectionDataset {
    pub schema_version: u32,
    pub season: String,
    pub source: SourceMetadata,
    pub projections: Vec<ProjectionRecord>,
}

#[derive(Clone, Debug, Deserialize, PartialEq, Serialize)]
pub struct ProjectionRecord {
    pub player_id: String,
    pub expected_points: f64,
}

#[derive(Clone, Debug, Default, PartialEq, Serialize)]
pub struct ProjectionStats {
    pub players: usize,
    pub projected: usize,
    pub missing: usize,
    pub minimum: Option<f64>,
    pub maximum: Option<f64>,
    pub average: Option<f64>,
}

impl ProjectionDataset {
    pub fn stats(&self, players: &PlayerDataset) -> ProjectionStats {
        let player_ids: HashSet<_> = players
            .players
            .iter()
            .map(|player| player.id.as_str())
            .collect();
        let values: Vec<_> = self
            .projections
            .iter()
            .filter(|projection| player_ids.contains(projection.player_id.as_str()))
            .map(|projection| projection.expected_points)
            .collect();
        let projected = values.len();
        let sum: f64 = values.iter().sum();
        ProjectionStats {
            players: players.players.len(),
            projected,
            missing: players.players.len().saturating_sub(projected),
            minimum: values.iter().copied().reduce(f64::min),
            maximum: values.iter().copied().reduce(f64::max),
            average: (projected > 0).then_some(sum / projected as f64),
        }
    }

    pub fn by_player_id(&self) -> HashMap<&str, f64> {
        self.projections
            .iter()
            .map(|projection| (projection.player_id.as_str(), projection.expected_points))
            .collect()
    }
}

pub fn validate_projections(
    dataset: &ProjectionDataset,
    players: &PlayerDataset,
    teams: &super::teams::TeamDataset,
) -> Result<(), DataValidationError> {
    if dataset.schema_version != CURRENT_SCHEMA_VERSION {
        return Err(DataValidationError::UnsupportedSchemaVersion(
            dataset.schema_version,
        ));
    }
    validate_teams(teams)?;
    validate_players(players, teams)?;
    if dataset.season != players.season {
        return Err(DataValidationError::ProjectionSeasonMismatch {
            expected: players.season.clone(),
            actual: dataset.season.clone(),
        });
    }

    let player_ids: HashSet<_> = players
        .players
        .iter()
        .map(|player| player.id.as_str())
        .collect();
    let mut projection_ids = HashSet::new();
    for projection in &dataset.projections {
        if projection.player_id.trim().is_empty() {
            return Err(DataValidationError::EmptyId {
                entity: "Projection oyuncusu",
            });
        }
        if !projection_ids.insert(projection.player_id.as_str()) {
            return Err(DataValidationError::DuplicateProjectionId {
                player_id: projection.player_id.clone(),
            });
        }
        if !player_ids.contains(projection.player_id.as_str()) {
            return Err(DataValidationError::UnknownProjectionPlayer {
                player_id: projection.player_id.clone(),
            });
        }
        if !projection.expected_points.is_finite() {
            return Err(DataValidationError::InvalidProjection {
                player_id: projection.player_id.clone(),
            });
        }
        if projection.expected_points < 0.0 {
            return Err(DataValidationError::NegativeProjection {
                player_id: projection.player_id.clone(),
            });
        }
    }
    Ok(())
}
