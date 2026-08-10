//! Saf ve deterministik fantasy puanlama fonksiyonları.

use crate::models::{MatchPerformance, PlayerMatchScore};
use crate::rules::ScoringRules;

/// Ham maç performansını açıklanabilir bir fantasy puanına dönüştürür.
pub fn calculate_player_match_score(
    performance: &MatchPerformance,
    rules: &ScoringRules,
) -> PlayerMatchScore {
    let minutes_points = match performance.minutes {
        0..=59 => 0,
        60 => rules.minutes_60_points,
        _ => rules.minutes_over_60_points,
    };
    let goals_points = i32::from(performance.goals) * performance.position.goal_points(rules);
    let assists_points = i32::from(performance.assists) * rules.assist_points;
    let clean_sheet_points =
        if performance.clean_sheet && performance.minutes >= rules.clean_sheet_minimum_minutes {
            performance.position.clean_sheet_points(rules)
        } else {
            0
        };
    let saves_points = if performance.position == crate::models::Position::Goalkeeper {
        i32::from(performance.saves / rules.saves_per_point) * rules.saves_points
    } else {
        0
    };
    let penalties_points = i32::from(performance.penalty_saves) * rules.penalty_save_points
        + i32::from(performance.penalty_misses) * rules.penalty_miss_points;
    let goals_conceded_points = if performance.position.is_goalkeeper_or_defender() {
        i32::from(performance.goals_conceded / rules.goals_conceded_per_penalty)
            * rules.goals_conceded_points
    } else {
        0
    };
    let cards_points = i32::from(performance.yellow_cards) * rules.yellow_card_points
        + i32::from(performance.red_cards) * rules.red_card_points;
    let own_goal_points = i32::from(performance.own_goals) * rules.own_goal_points;
    let bonus_points = match performance.bonus_rank {
        Some(1) => rules.bonus_first_points,
        Some(2) => rules.bonus_second_points,
        Some(3) => rules.bonus_third_points,
        _ => 0,
    };

    let total = minutes_points
        + goals_points
        + assists_points
        + clean_sheet_points
        + saves_points
        + penalties_points
        + goals_conceded_points
        + cards_points
        + own_goal_points
        + bonus_points;

    PlayerMatchScore {
        player_id: performance.player_id,
        player_name: performance.player_name.clone(),
        minutes_points,
        goals_points,
        assists_points,
        clean_sheet_points,
        saves_points,
        penalties_points,
        goals_conceded_points,
        cards_points,
        own_goal_points,
        bonus_points,
        total,
    }
}

/// Normal oyuncu puanını kaptan çarpanı ile ayrı bir adımda uygular.
pub fn apply_captain_multiplier(score: &PlayerMatchScore, rules: &ScoringRules) -> i32 {
    score.total * rules.captain_multiplier
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::Position;

    fn performance(position: Position) -> MatchPerformance {
        MatchPerformance {
            player_id: 1,
            player_name: "Test Oyuncusu".to_owned(),
            position,
            minutes: 0,
            goals: 0,
            assists: 0,
            saves: 0,
            penalty_saves: 0,
            penalty_misses: 0,
            goals_conceded: 0,
            yellow_cards: 0,
            red_cards: 0,
            own_goals: 0,
            clean_sheet: false,
            bonus_rank: None,
        }
    }

    #[test]
    fn minutes_below_60_gets_no_points() {
        let mut value = performance(Position::Forward);
        value.minutes = 59;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).minutes_points,
            0
        );
    }

    #[test]
    fn exactly_60_minutes_gets_one_point() {
        let mut value = performance(Position::Forward);
        value.minutes = 60;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).minutes_points,
            1
        );
    }

    #[test]
    fn over_60_minutes_gets_two_points() {
        let mut value = performance(Position::Forward);
        value.minutes = 90;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).minutes_points,
            2
        );
    }

    #[test]
    fn goals_use_position_values() {
        for (position, expected) in [
            (Position::Forward, 4),
            (Position::Midfielder, 5),
            (Position::Defender, 6),
            (Position::Goalkeeper, 10),
        ] {
            let mut value = performance(position);
            value.goals = 1;
            assert_eq!(
                calculate_player_match_score(&value, &ScoringRules::default()).goals_points,
                expected
            );
        }
    }

    #[test]
    fn assist_is_three_points() {
        let mut value = performance(Position::Forward);
        value.assists = 1;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).assists_points,
            3
        );
    }

    #[test]
    fn defender_clean_sheet_with_90_minutes_is_six_total() {
        let mut value = performance(Position::Defender);
        value.minutes = 90;
        value.clean_sheet = true;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).total,
            6
        );
    }

    #[test]
    fn midfielder_clean_sheet_with_90_minutes_is_three_total() {
        let mut value = performance(Position::Midfielder);
        value.minutes = 90;
        value.clean_sheet = true;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).total,
            3
        );
    }

    #[test]
    fn goalkeeper_saves_are_grouped_by_three() {
        let mut six = performance(Position::Goalkeeper);
        six.saves = 6;
        assert_eq!(
            calculate_player_match_score(&six, &ScoringRules::default()).saves_points,
            2
        );
        let mut five = performance(Position::Goalkeeper);
        five.saves = 5;
        assert_eq!(
            calculate_player_match_score(&five, &ScoringRules::default()).saves_points,
            1
        );
    }

    #[test]
    fn penalties_are_scored() {
        let mut value = performance(Position::Goalkeeper);
        value.penalty_saves = 1;
        value.penalty_misses = 1;
        assert_eq!(
            calculate_player_match_score(&value, &ScoringRules::default()).penalties_points,
            3
        );
    }

    #[test]
    fn conceded_goals_are_scored_for_goalkeeper_and_defender() {
        for position in [Position::Goalkeeper, Position::Defender] {
            let mut value = performance(position);
            value.goals_conceded = 4;
            assert_eq!(
                calculate_player_match_score(&value, &ScoringRules::default())
                    .goals_conceded_points,
                -2
            );
        }
    }

    #[test]
    fn cards_and_own_goals_are_scored() {
        let mut value = performance(Position::Forward);
        value.yellow_cards = 1;
        value.red_cards = 1;
        value.own_goals = 1;
        let score = calculate_player_match_score(&value, &ScoringRules::default());
        assert_eq!(score.cards_points, -4);
        assert_eq!(score.own_goal_points, -2);
    }

    #[test]
    fn bonus_ranks_are_three_two_one() {
        for (rank, expected) in [(1, 3), (2, 2), (3, 1)] {
            let mut value = performance(Position::Forward);
            value.bonus_rank = Some(rank);
            assert_eq!(
                calculate_player_match_score(&value, &ScoringRules::default()).bonus_points,
                expected
            );
        }
    }

    #[test]
    fn captain_is_applied_after_normal_score() {
        let mut value = performance(Position::Forward);
        value.minutes = 90;
        value.goals = 1;
        let rules = ScoringRules::default();
        let score = calculate_player_match_score(&value, &rules);
        assert_eq!(score.total, 6);
        assert_eq!(apply_captain_multiplier(&score, &rules), 12);
    }

    #[test]
    fn clean_sheet_requires_60_minutes_and_not_forward() {
        let mut defender = performance(Position::Defender);
        defender.minutes = 59;
        defender.clean_sheet = true;
        assert_eq!(
            calculate_player_match_score(&defender, &ScoringRules::default()).clean_sheet_points,
            0
        );

        let mut forward = performance(Position::Forward);
        forward.minutes = 90;
        forward.clean_sheet = true;
        assert_eq!(
            calculate_player_match_score(&forward, &ScoringRules::default()).clean_sheet_points,
            0
        );
    }
}
