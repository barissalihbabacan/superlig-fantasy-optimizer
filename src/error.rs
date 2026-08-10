//! Domain doğrulama hataları.

use crate::rules::PositionDistribution;
use std::fmt;

#[derive(Debug, Eq, PartialEq)]
pub enum ValidationError {
    InvalidSquadSize {
        expected: usize,
        actual: usize,
    },
    InvalidPositionDistribution {
        expected: PositionDistribution,
        actual: PositionDistribution,
    },
    BudgetExceeded {
        budget_m: u32,
        actual_m: u32,
    },
    TooManyPlayersFromTeam {
        team_id: u32,
        maximum: usize,
        actual: usize,
    },
    InvalidLineup {
        reason: String,
    },
}

impl fmt::Display for ValidationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidSquadSize { expected, actual } => {
                write!(
                    formatter,
                    "Kadro {} oyuncu içermelidir; mevcut: {}.",
                    expected, actual
                )
            }
            Self::InvalidPositionDistribution { expected, actual } => write!(
                formatter,
                "Geçersiz pozisyon dağılımı: beklenen {:?}, mevcut {:?}.",
                expected, actual
            ),
            Self::BudgetExceeded { budget_m, actual_m } => write!(
                formatter,
                "Bütçe aşıldı: sınır {}M TL, mevcut {}M TL.",
                budget_m, actual_m
            ),
            Self::TooManyPlayersFromTeam {
                team_id,
                maximum,
                actual,
            } => write!(
                formatter,
                "Takım {} için oyuncu sınırı aşıldı: en fazla {}, mevcut {}.",
                team_id, maximum, actual
            ),
            Self::InvalidLineup { reason } => write!(formatter, "Geçersiz ilk 11: {}", reason),
        }
    }
}

impl std::error::Error for ValidationError {}

#[derive(Debug, Eq, PartialEq)]
pub enum DataValidationError {
    Io(String),
    Json(String),
    UnsupportedSchemaVersion(u32),
    EmptyId {
        entity: &'static str,
    },
    EmptyName {
        entity: &'static str,
    },
    DuplicateId {
        entity: &'static str,
        id: String,
    },
    UnknownTeam {
        player_id: String,
        team_id: String,
    },
    UnknownMatch {
        match_id: String,
    },
    UnknownPlayer {
        player_id: String,
    },
    DuplicateProjectionId {
        player_id: String,
    },
    UnknownProjectionPlayer {
        player_id: String,
    },
    InvalidProjection {
        player_id: String,
    },
    NegativeProjection {
        player_id: String,
    },
    ProjectionSeasonMismatch {
        expected: String,
        actual: String,
    },
    InvalidFixtureSchedule {
        reason: String,
    },
    UnknownFixture {
        match_id: String,
    },
    SameFixtureTeams {
        fixture_id: String,
    },
    PlayerNotInMatchTeams {
        player_id: String,
        team_id: String,
    },
    DuplicateMatchPlayer {
        player_id: String,
    },
    InvalidMinutes {
        player_id: String,
        minutes: u16,
    },
    InvalidMatchStatus {
        match_id: String,
    },
    InvalidNegativeValue {
        field: &'static str,
        player_id: String,
    },
    SeasonMismatch {
        entity: &'static str,
        expected: String,
        actual: String,
    },
}

impl fmt::Display for DataValidationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Io(message) => write!(formatter, "Veri dosyası okunamadı: {message}"),
            Self::Json(message) => write!(formatter, "Veri JSON'u geçersiz: {message}"),
            Self::UnsupportedSchemaVersion(version) => {
                write!(formatter, "Desteklenmeyen schema_version: {version}")
            }
            Self::EmptyId { entity } => write!(formatter, "{entity} ID boş olamaz."),
            Self::EmptyName { entity } => write!(formatter, "{entity} adı boş olamaz."),
            Self::DuplicateId { entity, id } => {
                write!(formatter, "Tekrarlanan {entity} ID'si: {id}")
            }
            Self::UnknownTeam { player_id, team_id } => write!(
                formatter,
                "Oyuncu {player_id} bilinmeyen takıma bağlı: {team_id}"
            ),
            Self::UnknownMatch { match_id } => write!(formatter, "Bilinmeyen maç: {match_id}"),
            Self::UnknownPlayer { player_id } => {
                write!(formatter, "Bilinmeyen oyuncu: {player_id}")
            }
            Self::DuplicateProjectionId { player_id } => {
                write!(formatter, "Tekrarlanan projection oyuncusu: {player_id}")
            }
            Self::UnknownProjectionPlayer { player_id } => {
                write!(formatter, "Projection bilinmeyen oyuncuya ait: {player_id}")
            }
            Self::InvalidProjection { player_id } => {
                write!(formatter, "Geçersiz projection değeri: {player_id}")
            }
            Self::NegativeProjection { player_id } => {
                write!(formatter, "Projection negatif olamaz: {player_id}")
            }
            Self::ProjectionSeasonMismatch { expected, actual } => write!(
                formatter,
                "Projection sezonu uyuşmuyor: beklenen {expected}, mevcut {actual}"
            ),
            Self::InvalidFixtureSchedule { reason } => {
                write!(formatter, "Geçersiz fikstür programı: {reason}")
            }
            Self::UnknownFixture { match_id } => {
                write!(formatter, "Bilinmeyen fikstür maçı: {match_id}")
            }
            Self::SameFixtureTeams { fixture_id } => {
                write!(
                    formatter,
                    "Fikstürde ev sahibi ve deplasman aynı: {fixture_id}"
                )
            }
            Self::PlayerNotInMatchTeams { player_id, team_id } => write!(
                formatter,
                "Oyuncu {player_id}, maçta bulunmayan takımda: {team_id}"
            ),
            Self::DuplicateMatchPlayer { player_id } => {
                write!(
                    formatter,
                    "Oyuncu maçta birden fazla kez bulunuyor: {player_id}"
                )
            }
            Self::InvalidMinutes { player_id, minutes } => write!(
                formatter,
                "Oyuncu {player_id} için dakika makul değil: {minutes}"
            ),
            Self::InvalidMatchStatus { match_id } => {
                write!(formatter, "Maç bitmiş durumda değil: {match_id}")
            }
            Self::InvalidNegativeValue { field, player_id } => {
                write!(formatter, "{field} negatif olamaz: {player_id}")
            }
            Self::SeasonMismatch {
                entity,
                expected,
                actual,
            } => write!(
                formatter,
                "{entity} sezonu uyuşmuyor: beklenen {expected}, mevcut {actual}"
            ),
        }
    }
}

impl std::error::Error for DataValidationError {}
