use superlig_fantasy_optimizer::data::{
    players::{PlayerDataset, PlayerRecord, Price},
    projections::{validate_projections, ProjectionDataset, ProjectionRecord},
    teams::{TeamDataset, TeamRecord},
    SourceMetadata,
};
use superlig_fantasy_optimizer::Position;

fn source() -> SourceMetadata {
    SourceMetadata {
        name: "manual".to_owned(),
        retrieved_at: "test".to_owned(),
        url: None,
    }
}

fn teams() -> TeamDataset {
    TeamDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        teams: vec![
            TeamRecord {
                id: "team-a".to_owned(),
                name: "Team A".to_owned(),
            },
            TeamRecord {
                id: "team-b".to_owned(),
                name: "Team B".to_owned(),
            },
        ],
    }
}

fn players() -> PlayerDataset {
    PlayerDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        players: vec![
            PlayerRecord {
                id: "player-a".to_owned(),
                name: "Player A".to_owned(),
                team_id: "team-a".to_owned(),
                position: Position::Forward,
                price: Price(500),
            },
            PlayerRecord {
                id: "player-b".to_owned(),
                name: "Player B".to_owned(),
                team_id: "team-b".to_owned(),
                position: Position::Midfielder,
                price: Price(500),
            },
            PlayerRecord {
                id: "player-c".to_owned(),
                name: "Player C".to_owned(),
                team_id: "team-a".to_owned(),
                position: Position::Defender,
                price: Price(500),
            },
        ],
    }
}

fn dataset(records: Vec<ProjectionRecord>) -> ProjectionDataset {
    ProjectionDataset {
        schema_version: 1,
        season: "2026-27".to_owned(),
        source: source(),
        projections: records,
    }
}

#[test]
fn projection_json_deserializes_and_serializes() {
    let raw = r#"{
      "schema_version": 1,
      "season": "2026-27",
      "source": {"name": "manual", "retrieved_at": "test", "url": null},
      "projections": [{"player_id": "player-a", "expected_points": 7.4}]
    }"#;
    let parsed: ProjectionDataset = serde_json::from_str(raw).unwrap();
    let round_trip: ProjectionDataset =
        serde_json::from_str(&serde_json::to_string(&parsed).unwrap()).unwrap();
    assert_eq!(parsed, round_trip);
}

#[test]
fn duplicate_projection_player_id_is_rejected() {
    let projections = dataset(vec![
        ProjectionRecord {
            player_id: "player-a".to_owned(),
            expected_points: 7.4,
        },
        ProjectionRecord {
            player_id: "player-a".to_owned(),
            expected_points: 6.2,
        },
    ]);
    assert!(validate_projections(&projections, &players(), &teams()).is_err());
}

#[test]
fn negative_projection_is_rejected() {
    let projections = dataset(vec![ProjectionRecord {
        player_id: "player-a".to_owned(),
        expected_points: -0.1,
    }]);
    assert!(validate_projections(&projections, &players(), &teams()).is_err());
}

#[test]
fn non_finite_projection_is_rejected() {
    let projections = dataset(vec![ProjectionRecord {
        player_id: "player-a".to_owned(),
        expected_points: f64::NAN,
    }]);
    assert!(validate_projections(&projections, &players(), &teams()).is_err());
}

#[test]
fn unknown_projection_player_is_rejected() {
    let projections = dataset(vec![ProjectionRecord {
        player_id: "missing-player".to_owned(),
        expected_points: 5.0,
    }]);
    assert!(validate_projections(&projections, &players(), &teams()).is_err());
}

#[test]
fn projection_season_mismatch_is_rejected() {
    let mut projections = dataset(vec![]);
    projections.season = "2025-26".to_owned();
    assert!(validate_projections(&projections, &players(), &teams()).is_err());
}

#[test]
fn projection_stats_report_coverage_and_range() {
    let projections = dataset(vec![
        ProjectionRecord {
            player_id: "player-a".to_owned(),
            expected_points: 7.4,
        },
        ProjectionRecord {
            player_id: "player-b".to_owned(),
            expected_points: 4.6,
        },
    ]);
    validate_projections(&projections, &players(), &teams()).unwrap();
    let stats = projections.stats(&players());
    assert_eq!(stats.players, 3);
    assert_eq!(stats.projected, 2);
    assert_eq!(stats.missing, 1);
    assert_eq!(stats.minimum, Some(4.6));
    assert_eq!(stats.maximum, Some(7.4));
    assert_eq!(stats.average, Some(6.0));
}

#[test]
fn empty_projection_stats_have_no_range() {
    let projections = dataset(vec![]);
    validate_projections(&projections, &players(), &teams()).unwrap();
    let stats = projections.stats(&players());
    assert_eq!(stats.projected, 0);
    assert_eq!(stats.missing, 3);
    assert_eq!(stats.minimum, None);
    assert_eq!(stats.maximum, None);
    assert_eq!(stats.average, None);
}
