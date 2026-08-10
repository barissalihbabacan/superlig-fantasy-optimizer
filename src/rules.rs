//! Varsayılan fantasy ve kadro kuralları.

use crate::models::Position;
use serde::Serialize;

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct ScoringRules {
    pub minutes_60_points: i32,
    pub minutes_over_60_points: i32,
    pub goalkeeper_goal_points: i32,
    pub defender_goal_points: i32,
    pub midfielder_goal_points: i32,
    pub forward_goal_points: i32,
    pub assist_points: i32,
    pub goalkeeper_clean_sheet_points: i32,
    pub defender_clean_sheet_points: i32,
    pub midfielder_clean_sheet_points: i32,
    pub clean_sheet_minimum_minutes: u16,
    pub saves_per_point: u16,
    pub saves_points: i32,
    pub penalty_save_points: i32,
    pub penalty_miss_points: i32,
    pub goals_conceded_per_penalty: u16,
    pub goals_conceded_points: i32,
    pub yellow_card_points: i32,
    pub red_card_points: i32,
    pub own_goal_points: i32,
    pub bonus_first_points: i32,
    pub bonus_second_points: i32,
    pub bonus_third_points: i32,
    pub captain_multiplier: i32,
}

impl Default for ScoringRules {
    fn default() -> Self {
        Self {
            minutes_60_points: 1,
            minutes_over_60_points: 2,
            goalkeeper_goal_points: 10,
            defender_goal_points: 6,
            midfielder_goal_points: 5,
            forward_goal_points: 4,
            assist_points: 3,
            goalkeeper_clean_sheet_points: 4,
            defender_clean_sheet_points: 4,
            midfielder_clean_sheet_points: 1,
            clean_sheet_minimum_minutes: 60,
            saves_per_point: 3,
            saves_points: 1,
            penalty_save_points: 5,
            penalty_miss_points: -2,
            goals_conceded_per_penalty: 2,
            goals_conceded_points: -1,
            yellow_card_points: -1,
            red_card_points: -3,
            own_goal_points: -2,
            bonus_first_points: 3,
            bonus_second_points: 2,
            bonus_third_points: 1,
            captain_multiplier: 2,
        }
    }
}

#[derive(Clone, Copy, Debug, Eq, PartialEq, Serialize)]
pub struct PositionDistribution {
    pub goalkeepers: usize,
    pub defenders: usize,
    pub midfielders: usize,
    pub forwards: usize,
}

#[derive(Clone, Debug, Eq, PartialEq, Serialize)]
pub struct SquadRules {
    pub squad_size: usize,
    pub squad_positions: PositionDistribution,
    pub budget_m: u32,
    pub max_players_per_team: usize,
    pub lineup_size: usize,
    pub minimum_goalkeepers: usize,
    pub minimum_defenders: usize,
    pub minimum_forwards: usize,
}

impl Default for SquadRules {
    fn default() -> Self {
        Self {
            squad_size: 15,
            squad_positions: PositionDistribution {
                goalkeepers: 2,
                defenders: 5,
                midfielders: 5,
                forwards: 3,
            },
            budget_m: 100,
            max_players_per_team: 3,
            lineup_size: 11,
            minimum_goalkeepers: 1,
            minimum_defenders: 3,
            minimum_forwards: 1,
        }
    }
}

impl Position {
    pub(crate) fn goal_points(self, rules: &ScoringRules) -> i32 {
        match self {
            Self::Goalkeeper => rules.goalkeeper_goal_points,
            Self::Defender => rules.defender_goal_points,
            Self::Midfielder => rules.midfielder_goal_points,
            Self::Forward => rules.forward_goal_points,
        }
    }

    pub(crate) fn clean_sheet_points(self, rules: &ScoringRules) -> i32 {
        match self {
            Self::Goalkeeper => rules.goalkeeper_clean_sheet_points,
            Self::Defender => rules.defender_clean_sheet_points,
            Self::Midfielder => rules.midfielder_clean_sheet_points,
            Self::Forward => 0,
        }
    }

    pub(crate) fn is_goalkeeper_or_defender(self) -> bool {
        matches!(self, Self::Goalkeeper | Self::Defender)
    }
}
