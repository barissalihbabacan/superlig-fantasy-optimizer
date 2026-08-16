use std::path::Path;

use serde_json::Value;
use superlig_fantasy_optimizer::{
    calculate_player_match_score,
    data::{
        fixtures::FixtureDataset,
        matches::MatchDataset,
        players::PlayerDataset,
        teams::TeamDataset,
        validation::{validate_fixtures, validate_match, validate_players, validate_teams},
    },
    models::{MatchPerformance, Position},
    ScoringRules,
};

const TEAM_A: &str = "fenerbahce";
const TEAM_B: &str = "besiktas";
const TEAM_C: &str = "galatasaray";

fn data_path(name: &str) -> std::path::PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("data/2026-27")
        .join(name)
}

fn dataset_contents(name: &str) -> String {
    std::fs::read_to_string(data_path(name))
        .unwrap()
        .replace("example-team-a", TEAM_A)
        .replace("example-team-b", TEAM_B)
        .replace("example-team-c", TEAM_C)
}

fn datasets() -> (TeamDataset, PlayerDataset, FixtureDataset) {
    let teams: TeamDataset = serde_json::from_str(&dataset_contents("teams.json")).unwrap();
    let players: PlayerDataset = serde_json::from_str(&dataset_contents("players.json")).unwrap();
    let fixtures: FixtureDataset = serde_json::from_value(serde_json::json!({
        "schema_version": 1,
        "season": "2026-27",
        "source": {
            "name": "data test fixture",
            "retrieved_at": "test"
        },
        "fixtures": [
            {
                "id": "example-match-001",
                "round": 0,
                "home_team_id": TEAM_A,
                "away_team_id": TEAM_B,
                "kickoff": "2026-27-W01",
                "status": "finished"
            },
            {
                "id": "example-match-002",
                "round": 0,
                "home_team_id": TEAM_B,
                "away_team_id": TEAM_C,
                "kickoff": "2026-27-W02",
                "status": "finished"
            }
        ]
    }))
    .unwrap();
    (teams, players, fixtures)
}

fn match_contents(name: &str) -> String {
    let forward_a = player_id_for(TEAM_A, Position::Forward);
    let defender_a = player_id_for(TEAM_A, Position::Defender);
    let goalkeeper_b = player_id_for(TEAM_B, Position::Goalkeeper);
    let midfielder_b = player_id_for(TEAM_B, Position::Midfielder);
    let forward_c = player_id_for(TEAM_C, Position::Forward);

    let raw = match name {
        "example-match-001.json" => serde_json::json!({
            "schema_version": 1,
            "season": "2026-27",
            "source": { "name": "Synthetic Fixture", "retrieved_at": "2026-08-10T21:00:00+03:00" },
            "match_id": "example-match-001",
            "status": "finished",
            "score": {"home": 3, "away": 2},
            "players": [
                {
                    "player_id": "example-forward",
                    "team_id": "example-team-a",
                    "minutes": 90,
                    "goals": 2,
                    "assists": 0,
                    "saves": 0,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 0,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": false,
                    "bonus_rank": 1
                },
                {
                    "player_id": "example-defender",
                    "team_id": "example-team-a",
                    "minutes": 90,
                    "goals": 1,
                    "assists": 0,
                    "saves": 0,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 2,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": false,
                    "bonus_rank": 2
                },
                {
                    "player_id": "example-goalkeeper",
                    "team_id": "example-team-b",
                    "minutes": 90,
                    "goals": 0,
                    "assists": 0,
                    "saves": 4,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 3,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": false,
                    "bonus_rank": 3
                },
                {
                    "player_id": "example-midfielder",
                    "team_id": "example-team-b",
                    "minutes": 90,
                    "goals": 2,
                    "assists": 0,
                    "saves": 0,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 0,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": false,
                    "bonus_rank": null
                }
            ]
        }),
        _ => serde_json::json!({
            "schema_version": 1,
            "season": "2026-27",
            "source": { "name": "Synthetic Fixture", "retrieved_at": "2026-08-10T21:00:00+03:00" },
            "match_id": "example-match-002",
            "status": "finished",
            "score": {"home": 1, "away": 0},
            "players": [
                {
                    "player_id": "example-goalkeeper",
                    "team_id": "example-team-b",
                    "minutes": 90,
                    "goals": 0,
                    "assists": 0,
                    "saves": 3,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 0,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": true,
                    "bonus_rank": 1
                },
                {
                    "player_id": "example-forward-c",
                    "team_id": "example-team-c",
                    "minutes": 90,
                    "goals": 0,
                    "assists": 0,
                    "saves": 0,
                    "penalty_saves": 0,
                    "penalty_misses": 0,
                    "goals_conceded": 1,
                    "yellow_cards": 0,
                    "red_cards": 0,
                    "own_goals": 0,
                    "clean_sheet": false,
                    "bonus_rank": 2
                }
            ]
        }),
    };

    serde_json::to_string(&raw)
        .unwrap()
        .replace("example-team-a", TEAM_A)
        .replace("example-team-b", TEAM_B)
        .replace("example-team-c", TEAM_C)
        .replace("example-forward-c", &forward_c)
        .replace("example-forward", &forward_a)
        .replace("example-defender", &defender_a)
        .replace("example-goalkeeper", &goalkeeper_b)
        .replace("example-midfielder", &midfielder_b)
}

fn player_id_for(team_id: &str, position: Position) -> String {
    let players: PlayerDataset = serde_json::from_str(&dataset_contents("players.json")).unwrap();
    players
        .players
        .iter()
        .find(|player| player.team_id == team_id && player.position == position)
        .map(|player| player.id.clone())
        .unwrap()
}

#[test]
fn all_dataset_json_files_round_trip() {
    let (teams, players, fixtures) = datasets();
    validate_teams(&teams).unwrap();
    validate_players(&players, &teams).unwrap();
    validate_fixtures(&fixtures, &teams).unwrap();

    let match_data: MatchDataset =
        serde_json::from_str(&match_contents("example-match-001.json")).unwrap();
    validate_match(&match_data, &teams, &players, &fixtures).unwrap();

    for value in [
        serde_json::to_value(teams).unwrap(),
        serde_json::to_value(players).unwrap(),
        serde_json::to_value(fixtures).unwrap(),
        serde_json::to_value(match_data).unwrap(),
    ] {
        assert!(value.get("schema_version").is_some());
        assert!(value.get("fantasy_points").is_none());
        assert!(value.get("expected_points").is_none());
    }
}

#[test]
fn duplicate_team_id_is_rejected() {
    let (mut teams, _, _) = datasets();
    teams.teams[1].id = teams.teams[0].id.clone();
    assert!(validate_teams(&teams).is_err());
}

#[test]
fn unknown_player_team_is_rejected() {
    let (teams, mut players, _) = datasets();
    players.players[0].team_id = "unknown-team".into();
    assert!(validate_players(&players, &teams).is_err());
}

#[test]
fn duplicate_match_player_is_rejected() {
    let (teams, players, fixtures) = datasets();
    let mut match_data: MatchDataset =
        serde_json::from_str(&match_contents("example-match-001.json")).unwrap();
    let duplicate = match_data.players[0].clone();
    match_data.players.push(duplicate);
    assert!(validate_match(&match_data, &teams, &players, &fixtures).is_err());
}

#[test]
fn unrelated_player_team_is_rejected() {
    let (teams, players, fixtures) = datasets();
    let mut match_data: MatchDataset =
        serde_json::from_str(&match_contents("example-match-001.json")).unwrap();
    match_data.players[0].team_id = TEAM_C.into();
    assert!(validate_match(&match_data, &teams, &players, &fixtures).is_err());
}

#[test]
fn invalid_position_and_negative_statistics_are_rejected_by_json_deserialization() {
    let players = dataset_contents("players.json");
    let invalid_position = players.replace("\"Forward\"", "\"UnknownPosition\"");
    assert!(serde_json::from_str::<PlayerDataset>(&invalid_position).is_err());

    let invalid_json = match_contents("example-match-001.json")
        .replace("\"minutes\":90", "\"minutes\":-1")
        .replace("\"minutes\": 90", "\"minutes\": -1");
    assert!(serde_json::from_str::<MatchDataset>(&invalid_json).is_err());
}

#[test]
fn match_raw_data_flows_into_existing_scoring_engine() {
    let match_data: MatchDataset =
        serde_json::from_str(&match_contents("example-match-001.json")).unwrap();
    let raw = &match_data.players[0];
    let performance = MatchPerformance {
        player_id: 0,
        player_name: "Test Forward".into(),
        position: Position::Forward,
        minutes: raw.minutes,
        goals: raw.goals,
        assists: raw.assists,
        saves: raw.saves,
        penalty_saves: raw.penalty_saves,
        penalty_misses: raw.penalty_misses,
        goals_conceded: raw.goals_conceded,
        yellow_cards: raw.yellow_cards,
        red_cards: raw.red_cards,
        own_goals: raw.own_goals,
        clean_sheet: raw.clean_sheet,
        bonus_rank: raw.bonus_rank,
    };
    let score = calculate_player_match_score(&performance, &ScoringRules::default());
    assert_eq!(score.total, 13);
}

#[test]
fn match_data_contains_no_derived_fantasy_values() {
    let raw = match_contents("example-match-002.json");
    let json: Value = serde_json::from_str(&raw).unwrap();
    assert!(json.get("fantasy_points").is_none());
    assert!(json.get("total_points").is_none());
    assert!(json.get("captain_points").is_none());
    assert!(json.get("expected_points").is_none());
}
