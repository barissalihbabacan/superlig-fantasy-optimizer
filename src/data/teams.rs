use serde::{Deserialize, Serialize};

use super::SourceMetadata;

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct TeamDataset {
    pub schema_version: u32,
    pub season: String,
    pub source: SourceMetadata,
    pub teams: Vec<TeamRecord>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct TeamRecord {
    pub id: String,
    pub name: String,
}
