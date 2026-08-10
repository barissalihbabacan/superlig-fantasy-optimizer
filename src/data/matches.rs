use serde::{Deserialize, Serialize};

use super::{fixtures::MatchStatus, SourceMetadata};

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MatchDataset {
    pub schema_version: u32,
    pub season: String,
    pub source: SourceMetadata,
    pub match_id: String,
    pub status: MatchStatus,
    pub score: MatchScore,
    pub players: Vec<MatchPlayerPerformance>,
}

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MatchScore {
    pub home: u16,
    pub away: u16,
}

/// Maçtan gelen ham aggregate performans; türetilmiş fantasy puanı içermez.
#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct MatchPlayerPerformance {
    pub player_id: String,
    pub team_id: String,
    pub minutes: u16,
    pub goals: u16,
    pub assists: u16,
    pub saves: u16,
    pub penalty_saves: u16,
    pub penalty_misses: u16,
    pub goals_conceded: u16,
    pub yellow_cards: u16,
    pub red_cards: u16,
    pub own_goals: u16,
    pub clean_sheet: bool,
    pub bonus_rank: Option<u8>,
}
