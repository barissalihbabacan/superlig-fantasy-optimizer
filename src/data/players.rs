use serde::{Deserialize, Serialize};

use crate::Position;

use super::SourceMetadata;

/// 0.01 milyon TL biriminde fiyat. Örneğin 10.50M TL = 1050.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(transparent)]
pub struct Price(pub u32);

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PlayerDataset {
    pub schema_version: u32,
    pub season: String,
    pub source: SourceMetadata,
    pub players: Vec<PlayerRecord>,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct PlayerRecord {
    pub id: String,
    pub name: String,
    pub team_id: String,
    pub position: Position,
    pub price: Price,
}
