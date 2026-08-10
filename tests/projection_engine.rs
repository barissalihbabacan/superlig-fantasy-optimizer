use std::path::Path;

use superlig_fantasy_optimizer::{
    calculate_projection, calculate_team_strengths,
    data::{
        fixtures::{FixtureRecord, MatchStatus},
        matches::{MatchDataset, MatchPlayerPerformance, MatchScore},
        players::{PlayerDataset, PlayerRecord, Price},
        SourceMetadata,
    },
    project_all_players, project_all_players_with_options, upcoming_fixtures_for_player,
    FixtureDifficulty, Position, ScoringRules,
};

fn source() -> SourceMetadata {
    SourceMetadata {
        name: "test".to_owned(),
        retrieved_at: "test".to_owned(),
        url: None,
    }
}

fn player(id: &str, position: Position) -> PlayerRecord {
    PlayerRecord {
        id: id.to_owned(),
        name: id.to_owned(),
        team_id: "team-a".to_owned(),
        position,
        price: Price(400),
    }
}

fn match_data(match_id: &str, player_id: &str, minutes: u16, goals: u16) -> MatchDataset {
    MatchDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        match_id: match_id.to_owned(),
        status: MatchStatus::Finished,
        score: MatchScore { home: 1, away: 0 },
        players: vec![MatchPlayerPerformance {
            player_id: player_id.to_owned(),
            team_id: "team-a".to_owned(),
            minutes,
            goals,
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
        }],
    }
}

fn fixture(id: &str, kickoff: &str) -> FixtureRecord {
    FixtureRecord {
        id: id.to_owned(),
        round: 0,
        home_team_id: "team-a".to_owned(),
        away_team_id: "team-b".to_owned(),
        kickoff: kickoff.to_owned(),
        status: MatchStatus::Finished,
    }
}

fn scheduled_fixture(
    id: &str,
    round: u16,
    home_team_id: &str,
    away_team_id: &str,
) -> FixtureRecord {
    FixtureRecord {
        id: id.to_owned(),
        round,
        home_team_id: home_team_id.to_owned(),
        away_team_id: away_team_id.to_owned(),
        kickoff: format!("2026-27-W{round:02}"),
        status: MatchStatus::Scheduled,
    }
}

#[test]
fn one_match_projection_uses_actual_scoring_result() {
    let summary = calculate_projection("player-a", &[6]);
    assert_eq!(summary.matches_considered, 1);
    assert_eq!(summary.total_points, 6);
    assert_eq!(summary.expected_points, 6.0);
}

#[test]
fn weighted_average_uses_newer_match_more_heavily() {
    let summary = calculate_projection("player-a", &[2, 4]);
    assert_eq!(summary.points, vec![2, 4]);
    assert_eq!(summary.average_points, 3.0);
    assert!((summary.weighted_average - (10.0 / 3.0)).abs() < f64::EPSILON);
}

#[test]
fn five_match_window_and_newest_weight_are_deterministic() {
    let summary = calculate_projection("player-a", &[1, 2, 3, 4, 5, 6]);
    assert_eq!(summary.points, vec![2, 3, 4, 5, 6]);
    assert!((summary.weighted_average - (70.0 / 15.0)).abs() < f64::EPSILON);
    assert!(summary.weighted_average > summary.average_points);
    assert_eq!(
        summary,
        calculate_projection("player-a", &[1, 2, 3, 4, 5, 6])
    );
}

#[test]
fn player_without_history_has_zero_projection() {
    let summary = calculate_projection("player-a", &[]);
    assert_eq!(summary.matches_considered, 0);
    assert_eq!(summary.expected_points, 0.0);
}

#[test]
fn project_all_players_scores_matches_and_ignores_zero_minutes() {
    let players = PlayerDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        players: vec![
            player("player-a", Position::Forward),
            player("player-b", Position::Forward),
        ],
    };
    let fixtures = vec![
        fixture("match-1", "2026-08-01T20:00:00+03:00"),
        fixture("match-2", "2026-08-08T20:00:00+03:00"),
    ];
    let matches = vec![
        match_data("match-2", "player-a", 90, 1),
        match_data("match-1", "player-a", 0, 2),
    ];
    let result = project_all_players(&players, &matches, &fixtures, &ScoringRules::default());
    let summary = &result.summaries[0];
    assert_eq!(summary.matches_considered, 1);
    assert_eq!(summary.points, vec![6]);
    assert_eq!(result.projections.projections.len(), 1);
    assert_eq!(result.projections.projections[0].player_id, "player-a");
    assert_eq!(result.summaries[1].expected_points, 0.0);
}

#[test]
fn real_dataset_projection_run_has_all_players_and_no_fake_matches() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("data/2026-27");
    let players: PlayerDataset =
        serde_json::from_str(&std::fs::read_to_string(root.join("players.json")).unwrap()).unwrap();
    let fixtures: superlig_fantasy_optimizer::data::fixtures::FixtureDataset =
        serde_json::from_str(&std::fs::read_to_string(root.join("fixtures.json")).unwrap())
            .unwrap();
    let matches = ["example-match-001.json", "example-match-002.json"]
        .into_iter()
        .map(|file| {
            serde_json::from_str::<MatchDataset>(
                &std::fs::read_to_string(root.join("matches").join(file)).unwrap(),
            )
            .unwrap()
        })
        .collect::<Vec<_>>();
    let result = project_all_players(
        &players,
        &matches,
        &fixtures.fixtures,
        &ScoringRules::default(),
    );
    assert_eq!(result.summaries.len(), 443);
    assert!(result
        .summaries
        .iter()
        .all(|summary| summary.expected_points == 0.0));
    assert!(result.projections.projections.is_empty());
}

#[test]
fn upcoming_fixtures_resolve_home_away_and_horizon_in_round_order() {
    let player = player("player-a", Position::Forward);
    let fixtures = vec![
        scheduled_fixture("r12", 12, "team-b", "team-a"),
        scheduled_fixture("r11", 11, "team-a", "team-c"),
        scheduled_fixture("r10", 10, "team-b", "team-a"),
        scheduled_fixture("r13", 13, "team-a", "team-d"),
        scheduled_fixture("r14", 14, "team-e", "team-a"),
    ];
    let upcoming = upcoming_fixtures_for_player(&player, &fixtures, 10, 3);
    assert_eq!(upcoming.len(), 3);
    assert_eq!(
        upcoming.iter().map(|item| item.round).collect::<Vec<_>>(),
        vec![11, 12, 13]
    );
    assert_eq!(upcoming[0].opponent_team_id, "team-c");
    assert!(upcoming[0].is_home);
    assert_eq!(upcoming[1].opponent_team_id, "team-b");
    assert!(!upcoming[1].is_home);
    assert!(upcoming
        .iter()
        .all(|item| item.difficulty == FixtureDifficulty::Unknown));
}

#[test]
fn historical_projection_is_unchanged_when_fixture_difficulty_is_unknown() {
    let players = PlayerDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        players: vec![player("player-a", Position::Forward)],
    };
    let fixtures = vec![scheduled_fixture("future", 11, "team-a", "team-b")];
    let matches = vec![match_data("historical", "player-a", 90, 1)];
    let result = project_all_players_with_options(
        &players,
        &matches,
        &fixtures,
        &ScoringRules::default(),
        Some(10),
        3,
    );
    let summary = &result.summaries[0];
    assert_eq!(summary.expected_points, 6.0);
    assert_eq!(summary.upcoming_fixtures.len(), 1);
}

#[test]
fn team_strength_uses_only_finished_matches_with_known_fixtures() {
    let fixtures = vec![FixtureRecord {
        id: "match-1".to_owned(),
        round: 1,
        home_team_id: "team-a".to_owned(),
        away_team_id: "team-b".to_owned(),
        kickoff: "2026-27-W01".to_owned(),
        status: MatchStatus::Finished,
    }];
    let matches = vec![MatchDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        match_id: "match-1".to_owned(),
        status: MatchStatus::Finished,
        score: MatchScore { home: 2, away: 1 },
        players: Vec::new(),
    }];
    let strengths = calculate_team_strengths(&matches, &fixtures);
    assert_eq!(strengths.len(), 2);
    assert_eq!(strengths[0].team_id, "team-a");
    assert_eq!(strengths[0].points_per_match, 3.0);
    assert_eq!(strengths[0].goal_difference_per_match, 1.0);
    assert_eq!(strengths[1].team_id, "team-b");
    assert_eq!(strengths[1].points_per_match, 0.0);
}
