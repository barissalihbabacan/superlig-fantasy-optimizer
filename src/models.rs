//! Puanlama ve kadro kuralları tarafından kullanılan domain modelleri.

/// Oyuncunun fantasy oyunundaki mevkii.
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "PascalCase")]
pub enum Position {
    Goalkeeper,
    Defender,
    Midfielder,
    Forward,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Team {
    pub id: u32,
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Player {
    pub id: u32,
    pub name: String,
    pub position: Position,
    pub team_id: u32,
    /// Milyon TL cinsinden tam sayı fiyat.
    pub price_m: u32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Match {
    pub id: u32,
    pub home_team_id: u32,
    pub away_team_id: u32,
}

/// Bir oyuncunun maçtan gelen ham performansı. Fantasy puanı içermez.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MatchPerformance {
    pub player_id: u32,
    pub player_name: String,
    pub position: Position,
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
    /// 1, 2 veya 3: maç bonusu sırası; diğer değerler bonus vermez.
    pub bonus_rank: Option<u8>,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct PlayerMatchScore {
    pub player_id: u32,
    pub player_name: String,
    pub minutes_points: i32,
    pub goals_points: i32,
    pub assists_points: i32,
    pub clean_sheet_points: i32,
    pub saves_points: i32,
    pub penalties_points: i32,
    pub goals_conceded_points: i32,
    pub cards_points: i32,
    pub own_goal_points: i32,
    pub bonus_points: i32,
    pub total: i32,
}

#[derive(Clone, Debug, Deserialize, Eq, PartialEq, Serialize)]
pub struct Squad {
    pub players: Vec<Player>,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Captain {
    pub player_id: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ViceCaptain {
    pub player_id: u32,
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Lineup {
    pub player_ids: Vec<u32>,
    pub captain: Captain,
    pub vice_captain: ViceCaptain,
}

/// İlk 11'de yer almayan, sıra bilgisi korunmuş dört oyuncu.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bench {
    pub player_ids: Vec<u32>,
}

/// Bir kadronun formasyona göre ilk 11 ve yedek ayrımı.
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SquadSelection {
    pub lineup: Lineup,
    pub bench: Bench,
}
