use std::{
    fs,
    process::Command,
    sync::atomic::{AtomicUsize, Ordering},
};

use serde_json::Value;

const PERFORMANCE: &str = r#"{
  "player": {"name": "Example Forward", "position": "Forward"},
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
}"#;

const TEAM_A: &str = "fenerbahce";
const TEAM_B: &str = "besiktas";
const TEAM_C: &str = "galatasaray";

fn write_fixture(contents: &str) -> std::path::PathBuf {
    static FIXTURE_ID: AtomicUsize = AtomicUsize::new(0);
    let id = FIXTURE_ID.fetch_add(1, Ordering::Relaxed);
    let path = std::env::temp_dir().join(format!("sf-cli-test-{}-{id}.json", std::process::id()));
    fs::write(&path, contents).expect("fixture yazılmalı");
    path
}

fn command() -> Command {
    Command::new(env!("CARGO_BIN_EXE_sf"))
}

#[test]
fn score_accepts_valid_json() {
    let path = write_fixture(PERFORMANCE);
    let output = command()
        .args(["score", "--input", path.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(output.status.success());
    assert!(String::from_utf8_lossy(&output.stdout).contains("Total: 10"));
}

#[test]
fn score_rejects_invalid_json() {
    let path = write_fixture("not json");
    let output = command()
        .args(["score", "--input", path.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("Geçersiz JSON"));
}

#[test]
fn score_json_format_is_valid_json() {
    let path = write_fixture(PERFORMANCE);
    let output = command()
        .args([
            "score",
            "--input",
            path.to_str().unwrap(),
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    assert!(output.status.success());
    let json: Value = serde_json::from_slice(&output.stdout).unwrap();
    assert_eq!(json["total"], 10);
}

#[test]
fn rules_commands_succeed_and_json_is_valid() {
    let human = command().arg("rules").output().unwrap();
    assert!(human.status.success());
    let json = command()
        .args(["rules", "--format", "json"])
        .output()
        .unwrap();
    assert!(json.status.success());
    let value: Value = serde_json::from_slice(&json.stdout).unwrap();
    assert_eq!(value["captain_multiplier"], 2);
}

#[test]
fn formation_commands_list_and_show_supported_formations() {
    let list = command().args(["formation", "list"]).output().unwrap();
    assert!(list.status.success());
    assert_eq!(
        String::from_utf8_lossy(&list.stdout)
            .lines()
            .collect::<Vec<_>>(),
        vec!["3-5-2", "3-4-3", "4-3-3", "4-4-2", "4-5-1", "5-4-1", "5-3-2", "5-2-3"]
    );

    let show = command()
        .args(["formation", "show", "3-5-2"])
        .output()
        .unwrap();
    assert!(show.status.success());
    let output = String::from_utf8_lossy(&show.stdout);
    assert!(output.contains("Formation: 3-5-2"));
    assert!(output.contains("Goalkeeper: 1"));
    assert!(output.contains("Defenders: 3"));
    assert!(output.contains("Midfielders: 5"));
    assert!(output.contains("Forwards: 2"));
    assert!(output.contains("Total: 11"));
}

#[test]
fn validate_accepts_performance_and_rejects_invalid_performance() {
    let valid = write_fixture(PERFORMANCE);
    let output = command()
        .args(["validate", valid.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(output.status.success());

    let invalid = write_fixture(&PERFORMANCE.replace("\"bonus_rank\": null", "\"bonus_rank\": 4"));
    let output = command()
        .args(["validate", invalid.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(!output.status.success());
}

#[test]
fn validate_accepts_valid_squad() {
    let squad = r#"{"players":[
      {"id":1,"name":"G1","position":"Goalkeeper","team_id":6,"price_m":5},
      {"id":2,"name":"G2","position":"Goalkeeper","team_id":7,"price_m":5},
      {"id":3,"name":"D1","position":"Defender","team_id":1,"price_m":5},
      {"id":4,"name":"D2","position":"Defender","team_id":2,"price_m":5},
      {"id":5,"name":"D3","position":"Defender","team_id":3,"price_m":5},
      {"id":6,"name":"D4","position":"Defender","team_id":4,"price_m":5},
      {"id":7,"name":"D5","position":"Defender","team_id":5,"price_m":5},
      {"id":8,"name":"M1","position":"Midfielder","team_id":1,"price_m":5},
      {"id":9,"name":"M2","position":"Midfielder","team_id":2,"price_m":5},
      {"id":10,"name":"M3","position":"Midfielder","team_id":3,"price_m":5},
      {"id":11,"name":"M4","position":"Midfielder","team_id":4,"price_m":5},
      {"id":12,"name":"M5","position":"Midfielder","team_id":5,"price_m":5},
      {"id":13,"name":"F1","position":"Forward","team_id":1,"price_m":5},
      {"id":14,"name":"F2","position":"Forward","team_id":2,"price_m":5},
      {"id":15,"name":"F3","position":"Forward","team_id":3,"price_m":5}
    ]}"#;
    let path = write_fixture(squad);
    let output = command()
        .args(["validate", path.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(output.status.success());
}

#[test]
fn fixtures_run_successfully() {
    for fixture in ["score-forward", "score-defender", "score-goalkeeper"] {
        assert!(command()
            .args(["fixture", fixture])
            .output()
            .unwrap()
            .status
            .success());
    }
}

#[test]
fn version_succeeds() {
    let output = command().arg("version").output().unwrap();
    assert!(output.status.success());
    assert_eq!(String::from_utf8_lossy(&output.stdout).trim(), "sf 0.1.0");
}

#[test]
fn validate_accepts_complete_season_dataset() {
    let dataset = copy_dataset();
    let output = command()
        .args(["validate", dataset.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(output.status.success());
    assert!(String::from_utf8_lossy(&output.stdout).contains("Validation successful."));
}

#[test]
fn score_accepts_match_dataset_in_human_and_json_formats() {
    let dataset = copy_dataset();
    let match_path = dataset.join("matches/example-match-001.json");
    let forward_name = player_from_dataset(&dataset, TEAM_A, "Forward", 0).1;
    let human = command()
        .args(["score", "--match", match_path.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(human.status.success());
    assert!(String::from_utf8_lossy(&human.stdout).contains(&forward_name));
    assert!(String::from_utf8_lossy(&human.stdout).contains("Total: 13"));

    let json = command()
        .args([
            "score",
            "--match",
            match_path.to_str().unwrap(),
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    assert!(json.status.success());
    let value: Value = serde_json::from_slice(&json.stdout).unwrap();
    assert_eq!(value["match_id"], "example-match-001");
    assert_eq!(value["players"][0]["total"], 13);
}

#[test]
fn optimize_supports_human_json_and_formation_options() {
    let human = command()
        .args(["optimize", "--budget", "10000", "--formation", "3-5-2"])
        .output()
        .unwrap();
    assert!(human.status.success());
    let human_text = String::from_utf8_lossy(&human.stdout);
    assert!(human_text.contains("STARTING XI"));
    assert!(human_text.contains("BENCH"));
    assert!(human_text.contains("Formation: 3-5-2"));

    let json = command()
        .args([
            "optimize",
            "--budget",
            "10000",
            "--formation",
            "4-3-3",
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    assert!(json.status.success());
    let value: Value = serde_json::from_slice(&json.stdout).unwrap();
    assert_eq!(value["formation"], "4-3-3");
    assert_eq!(value["lineup"].as_array().unwrap().len(), 11);
    assert_eq!(value["bench"].as_array().unwrap().len(), 4);
    assert!(value["total_cost"].as_u64().unwrap() <= 10_000);
    assert_ne!(value["captain"], value["vice_captain"]);
    assert_eq!(value["projection_coverage"]["total"], 443);
    let projected = value["projection_coverage"]["projected"].as_u64().unwrap();
    let missing = value["projection_coverage"]["missing"].as_u64().unwrap();
    assert_eq!(projected + missing, 443);
}

#[test]
fn optimize_rejects_invalid_budget_and_formation() {
    let negative_budget = command()
        .args(["optimize", "--budget", "-1"])
        .output()
        .unwrap();
    assert!(!negative_budget.status.success());
    assert!(String::from_utf8_lossy(&negative_budget.stderr).contains("negatif"));

    let invalid_formation = command()
        .args(["optimize", "--budget", "10000", "--formation", "4-2-4"])
        .output()
        .unwrap();
    assert!(!invalid_formation.status.success());
    assert!(String::from_utf8_lossy(&invalid_formation.stderr).contains("Geçersiz formasyon"));
}

#[test]
fn projection_stats_validate_and_show_commands_succeed() {
    let stats = command().args(["projection", "stats"]).output().unwrap();
    assert!(stats.status.success());
    let stats_text = String::from_utf8_lossy(&stats.stdout);
    assert!(stats_text.contains("Players: 443"));
    assert!(stats_text.contains("Projected:"));
    assert!(stats_text.contains("Missing:"));

    let validate = command().args(["projection", "validate"]).output().unwrap();
    assert!(validate.status.success());
    assert!(String::from_utf8_lossy(&validate.stdout).contains("Projection validation successful."));

    let show = command()
        .args(["projection", "show", "abdulsamed-damlu"])
        .output()
        .unwrap();
    assert!(show.status.success());
    assert!(String::from_utf8_lossy(&show.stdout).contains("Expected Points:"));
}

#[test]
fn projection_calculate_dry_run_supports_json_output() {
    let output = command()
        .args(["projection", "calculate", "--dry-run", "--format", "json"])
        .output()
        .unwrap();
    assert!(output.status.success());
    let value: Value = serde_json::from_slice(&output.stdout).unwrap();
    // Total player count is stable
    assert_eq!(value["players"], 443);
    // projected + missing must always equal total players
    let projected = value["projected"].as_u64().unwrap();
    let missing = value["missing"].as_u64().unwrap();
    assert_eq!(projected + missing, 443);
    // dry-run flag must always be set
    assert_eq!(value["dry_run"], true);
}

#[test]
fn data_stats_are_dynamic_and_json_is_stable() {
    let dataset = copy_dataset();
    let dataset_path = dataset.to_str().unwrap();
    let human = command()
        .args(["data", "stats", "--path", dataset_path])
        .output()
        .unwrap();
    assert!(human.status.success());
    let text = String::from_utf8_lossy(&human.stdout);
    assert!(text.contains("Total: 18"));
    let expected_goalkeepers = count_players(&dataset, None, Some("Goalkeeper"));
    assert!(text.contains(&format!("Goalkeepers: {expected_goalkeepers}")));
    assert!(text.contains("Finished: 2"));

    let json = command()
        .args(["data", "stats", "--path", dataset_path, "--format", "json"])
        .output()
        .unwrap();
    assert!(json.status.success());
    let value: Value = serde_json::from_slice(&json.stdout).unwrap();
    assert_eq!(value["season"], "2026-27");
    assert_eq!(value["teams"]["total"], 18);
    assert_eq!(value["players"]["total"], 443);
    assert_eq!(value["fixtures"]["finished"], 2);
    assert_eq!(value["matches"]["finished"], 2);
}

#[test]
fn data_teams_and_players_support_json_and_filters() {
    let dataset = copy_dataset();
    let dataset_path = dataset.to_str().unwrap();
    let teams = command()
        .args(["data", "teams", "--path", dataset_path, "--format", "json"])
        .output()
        .unwrap();
    let teams_json: Value = serde_json::from_slice(&teams.stdout).unwrap();
    assert_eq!(teams_json.as_array().unwrap().len(), 18);

    let forwards = command()
        .args([
            "data",
            "players",
            "--path",
            dataset_path,
            "--position",
            "forward",
        ])
        .output()
        .unwrap();
    let forward_text = String::from_utf8_lossy(&forwards.stdout);
    let forward_name = player_from_dataset(&dataset, TEAM_A, "Forward", 0).1;
    let other_forward_name = player_from_dataset(&dataset, TEAM_C, "Forward", 0).1;
    assert!(forward_text.contains(&forward_name));
    assert!(forward_text.contains(&other_forward_name));

    let team_forward = command()
        .args([
            "data",
            "players",
            "--path",
            dataset_path,
            "--team",
            TEAM_A,
            "--position",
            "forward",
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    let players_json: Value = serde_json::from_slice(&team_forward.stdout).unwrap();
    let expected_count = count_players(&dataset, Some(TEAM_A), Some("Forward"));
    assert_eq!(players_json.as_array().unwrap().len(), expected_count);
    assert!(players_json
        .as_array()
        .unwrap()
        .iter()
        .any(|player| player["id"] == player_from_dataset(&dataset, TEAM_A, "Forward", 0).0));
}

#[test]
fn data_fixtures_and_matches_support_filters_and_json() {
    let dataset = copy_dataset();
    let dataset_path = dataset.to_str().unwrap();
    let fixtures = command()
        .args([
            "data",
            "fixtures",
            "--path",
            dataset_path,
            "--status",
            "finished",
            "--team",
            TEAM_A,
        ])
        .output()
        .unwrap();
    let fixture_text = String::from_utf8_lossy(&fixtures.stdout);
    assert!(fixture_text.contains("example-match-001"));
    assert!(!fixture_text.contains("example-match-002"));

    let fixtures_json = command()
        .args([
            "data",
            "fixtures",
            "--path",
            dataset_path,
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    let fixtures_value: Value = serde_json::from_slice(&fixtures_json.stdout).unwrap();
    assert_eq!(fixtures_value.as_array().unwrap().len(), 2);

    let matches = command()
        .args([
            "data",
            "matches",
            "--path",
            dataset_path,
            "--team",
            TEAM_A,
            "--format",
            "json",
        ])
        .output()
        .unwrap();
    let matches_value: Value = serde_json::from_slice(&matches.stdout).unwrap();
    assert_eq!(matches_value.as_array().unwrap().len(), 1);
    assert_eq!(matches_value[0]["match_id"], "example-match-001");
}

fn copy_dataset() -> std::path::PathBuf {
    static DATASET_ID: AtomicUsize = AtomicUsize::new(0);
    let id = DATASET_ID.fetch_add(1, Ordering::Relaxed);
    let root = std::env::temp_dir().join(format!("sf-data-test-{}-{id}", std::process::id()));
    fs::create_dir_all(root.join("matches")).unwrap();
    for file in ["teams.json", "players.json"] {
        fs::copy(
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("data/2026-27")
                .join(file),
            root.join(file),
        )
        .unwrap();
    }
    write_test_matches(&root);

    for file in ["teams.json", "players.json"] {
        normalize_team_ids(&root.join(file));
    }
    write_test_fixtures(&root);
    for file in ["example-match-001.json", "example-match-002.json"] {
        normalize_match(&root, file);
    }
    root
}

fn write_test_matches(root: &std::path::Path) {
    let match1 = serde_json::json!({
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
    });
    let match2 = serde_json::json!({
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
    });
    fs::write(
        root.join("matches/example-match-001.json"),
        serde_json::to_string_pretty(&match1).unwrap(),
    )
    .unwrap();
    fs::write(
        root.join("matches/example-match-002.json"),
        serde_json::to_string_pretty(&match2).unwrap(),
    )
    .unwrap();
}

fn write_test_fixtures(root: &std::path::Path) {
    let fixtures = serde_json::json!({
        "schema_version": 1,
        "season": "2026-27",
        "source": {
            "name": "CLI test fixture",
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
    });
    fs::write(
        root.join("fixtures.json"),
        serde_json::to_string_pretty(&fixtures).unwrap(),
    )
    .unwrap();
}

fn normalize_team_ids(path: &std::path::Path) {
    let contents = fs::read_to_string(path).unwrap();
    let normalized = contents
        .replace("example-team-a", TEAM_A)
        .replace("example-team-b", TEAM_B)
        .replace("example-team-c", TEAM_C);
    fs::write(path, normalized).unwrap();
}

fn player_from_dataset(
    root: &std::path::Path,
    team_id: &str,
    position: &str,
    occurrence: usize,
) -> (String, String) {
    let value: Value =
        serde_json::from_str(&fs::read_to_string(root.join("players.json")).unwrap()).unwrap();
    value["players"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|player| player["team_id"] == team_id && player["position"] == position)
        .nth(occurrence)
        .map(|player| {
            (
                player["id"].as_str().unwrap().to_owned(),
                player["name"].as_str().unwrap().to_owned(),
            )
        })
        .unwrap()
}

fn count_players(root: &std::path::Path, team_id: Option<&str>, position: Option<&str>) -> usize {
    let value: Value =
        serde_json::from_str(&fs::read_to_string(root.join("players.json")).unwrap()).unwrap();
    value["players"]
        .as_array()
        .unwrap()
        .iter()
        .filter(|player| {
            team_id.is_none_or(|team| player["team_id"] == team)
                && position.is_none_or(|role| player["position"] == role)
        })
        .count()
}

fn normalize_match(root: &std::path::Path, file: &str) {
    let path = root.join("matches").join(file);
    let mut contents = fs::read_to_string(&path).unwrap();
    let forward_a = player_from_dataset(root, TEAM_A, "Forward", 0).0;
    let defender_a = player_from_dataset(root, TEAM_A, "Defender", 0).0;
    let goalkeeper_b = player_from_dataset(root, TEAM_B, "Goalkeeper", 0).0;
    let midfielder_b = player_from_dataset(root, TEAM_B, "Midfielder", 0).0;
    let forward_c = player_from_dataset(root, TEAM_C, "Forward", 0).0;
    contents = contents
        .replace("example-team-a", TEAM_A)
        .replace("example-team-b", TEAM_B)
        .replace("example-team-c", TEAM_C)
        .replace("example-forward-c", &forward_c)
        .replace("example-forward", &forward_a)
        .replace("example-defender", &defender_a)
        .replace("example-goalkeeper", &goalkeeper_b)
        .replace("example-midfielder", &midfielder_b);
    fs::write(path, contents).unwrap();
}

#[test]
fn data_validate_rejects_missing_corrupt_and_referentially_invalid_datasets() {
    let missing = copy_dataset();
    fs::remove_file(missing.join("players.json")).unwrap();
    let output = command()
        .args(["data", "validate", "--path", missing.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("players.json not found"));

    let corrupt = copy_dataset();
    fs::write(corrupt.join("players.json"), "not json").unwrap();
    let output = command()
        .args(["data", "validate", "--path", corrupt.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("Veri JSON'u geçersiz"));

    let invalid = copy_dataset();
    let players_path = invalid.join("players.json");
    let players = fs::read_to_string(&players_path).unwrap();
    fs::write(&players_path, players.replace(TEAM_A, "unknown-team")).unwrap();
    let output = command()
        .args(["data", "validate", "--path", invalid.to_str().unwrap()])
        .output()
        .unwrap();
    assert!(!output.status.success());
    assert!(String::from_utf8_lossy(&output.stderr).contains("bilinmeyen takıma"));
}
