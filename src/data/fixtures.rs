use serde::{Deserialize, Serialize};

use super::SourceMetadata;

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MatchStatus {
    Scheduled,
    Live,
    Finished,
    Postponed,
    Cancelled,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct FixtureDataset {
    pub schema_version: u32,
    pub season: String,
    pub source: SourceMetadata,
    pub fixtures: Vec<FixtureRecord>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct FixtureRecord {
    pub id: String,
    #[serde(default)]
    pub round: u16,
    pub home_team_id: String,
    pub away_team_id: String,
    pub kickoff: String,
    pub status: MatchStatus,
}
