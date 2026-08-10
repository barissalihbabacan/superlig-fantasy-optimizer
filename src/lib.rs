//! Süper Lig Fantasy için kurallar, domain modelleri ve puanlama çekirdeği.

pub mod data;
pub mod error;
pub mod models;
pub mod optimizer;
pub mod projection_engine;
pub mod rules;
pub mod scoring;

pub use error::ValidationError;
pub use models::*;
pub use optimizer::{
    best_formation, evaluate_formations, optimize_squad, optimize_squad_with_options,
    recommend_lineup, recommend_lineup_for_formation, Budget, Formation, FormationEvaluation,
    FormationParseError, LineupRecommendation, NamedPlayerProjection, OptimizationError,
    OptimizedPlayer, PlayerProjection, ProjectionCoverage, SquadOptimizationResult,
};
pub use projection_engine::{
    calculate_projection, calculate_team_strengths, project_all_players,
    project_all_players_with_options, upcoming_fixtures_for_player, FixtureDifficulty,
    PlayerProjectionSummary, ProjectionCalculation, TeamStrength, UpcomingFixture,
    DEFAULT_FIXTURE_HORIZON, DEFAULT_WINDOW_SIZE,
};
pub use rules::{PositionDistribution, ScoringRules, SquadRules};
pub use scoring::{apply_captain_multiplier, calculate_player_match_score};

/// Bir kadronun tüm kadro kurallarına uyup uymadığını doğrular.
pub fn validate_squad(squad: &Squad, rules: &SquadRules) -> Result<(), ValidationError> {
    if squad.players.len() != rules.squad_size {
        return Err(ValidationError::InvalidSquadSize {
            expected: rules.squad_size,
            actual: squad.players.len(),
        });
    }

    let mut goalkeepers = 0;
    let mut defenders = 0;
    let mut midfielders = 0;
    let mut forwards = 0;
    let mut budget = 0;
    let mut team_counts = std::collections::HashMap::new();

    for player in &squad.players {
        budget += player.price_m;
        *team_counts.entry(player.team_id).or_insert(0_usize) += 1;

        match player.position {
            Position::Goalkeeper => goalkeepers += 1,
            Position::Defender => defenders += 1,
            Position::Midfielder => midfielders += 1,
            Position::Forward => forwards += 1,
        }
    }

    if budget > rules.budget_m {
        return Err(ValidationError::BudgetExceeded {
            budget_m: rules.budget_m,
            actual_m: budget,
        });
    }

    if let Some((team_id, count)) = team_counts
        .into_iter()
        .find(|(_, count)| *count > rules.max_players_per_team)
    {
        return Err(ValidationError::TooManyPlayersFromTeam {
            team_id,
            maximum: rules.max_players_per_team,
            actual: count,
        });
    }

    let actual_positions = PositionDistribution {
        goalkeepers,
        defenders,
        midfielders,
        forwards,
    };
    if actual_positions != rules.squad_positions {
        return Err(ValidationError::InvalidPositionDistribution {
            expected: rules.squad_positions,
            actual: actual_positions,
        });
    }

    Ok(())
}

/// İlk 11'in temel pozisyon ve oyuncu sayısı kurallarına uyup uymadığını doğrular.
pub fn validate_lineup(
    squad: &Squad,
    lineup: &Lineup,
    rules: &SquadRules,
) -> Result<(), ValidationError> {
    if lineup.player_ids.len() != rules.lineup_size {
        return Err(ValidationError::InvalidLineup {
            reason: format!(
                "İlk 11 tam olarak {} oyuncudan oluşmalıdır.",
                rules.lineup_size
            ),
        });
    }

    let squad_ids: std::collections::HashSet<_> = squad.players.iter().map(|p| p.id).collect();
    let unique_ids: std::collections::HashSet<_> = lineup.player_ids.iter().copied().collect();
    if unique_ids.len() != lineup.player_ids.len() || !unique_ids.is_subset(&squad_ids) {
        return Err(ValidationError::InvalidLineup {
            reason: "İlk 11, kadroda bulunan benzersiz oyunculardan oluşmalıdır.".to_owned(),
        });
    }

    let players: Vec<_> = squad
        .players
        .iter()
        .filter(|player| unique_ids.contains(&player.id))
        .collect();
    let goalkeepers = players
        .iter()
        .filter(|player| player.position == Position::Goalkeeper)
        .count();
    let defenders = players
        .iter()
        .filter(|player| player.position == Position::Defender)
        .count();
    let forwards = players
        .iter()
        .filter(|player| player.position == Position::Forward)
        .count();

    if goalkeepers < rules.minimum_goalkeepers
        || defenders < rules.minimum_defenders
        || forwards < rules.minimum_forwards
    {
        return Err(ValidationError::InvalidLineup {
            reason: format!(
                "İlk 11 en az {} kaleci, {} defans ve {} forvet içermelidir.",
                rules.minimum_goalkeepers, rules.minimum_defenders, rules.minimum_forwards
            ),
        });
    }

    Ok(())
}

/// İlk 11'in verilen resmi formasyona tam olarak uyup uymadığını doğrular.
pub fn validate_lineup_with_formation(
    squad: &Squad,
    lineup: &Lineup,
    formation: Formation,
) -> Result<(), ValidationError> {
    if lineup.player_ids.len() != formation.total() {
        return Err(ValidationError::InvalidLineup {
            reason: format!("{} formasyonu 11 oyuncu içermelidir.", formation),
        });
    }

    let squad_ids: std::collections::HashSet<_> = squad.players.iter().map(|p| p.id).collect();
    let unique_ids: std::collections::HashSet<_> = lineup.player_ids.iter().copied().collect();
    if unique_ids.len() != lineup.player_ids.len() || !unique_ids.is_subset(&squad_ids) {
        return Err(ValidationError::InvalidLineup {
            reason: "İlk 11, kadroda bulunan benzersiz oyunculardan oluşmalıdır.".to_owned(),
        });
    }

    let players = squad
        .players
        .iter()
        .filter(|player| unique_ids.contains(&player.id));
    let mut counts = PositionDistribution {
        goalkeepers: 0,
        defenders: 0,
        midfielders: 0,
        forwards: 0,
    };
    for player in players {
        match player.position {
            Position::Goalkeeper => counts.goalkeepers += 1,
            Position::Defender => counts.defenders += 1,
            Position::Midfielder => counts.midfielders += 1,
            Position::Forward => counts.forwards += 1,
        }
    }

    let expected = PositionDistribution {
        goalkeepers: 1,
        defenders: formation.defenders(),
        midfielders: formation.midfielders(),
        forwards: formation.forwards(),
    };
    if counts != expected {
        return Err(ValidationError::InvalidLineup {
            reason: format!(
                "{} için beklenen pozisyon dağılımı {:?}, mevcut {:?}.",
                formation, expected, counts
            ),
        });
    }
    Ok(())
}

/// Squad, ilk 11 ve sıralı dört yedeğin birbirini eksiksiz bölüştürdüğünü doğrular.
pub fn validate_squad_selection(
    squad: &Squad,
    selection: &SquadSelection,
    formation: Formation,
) -> Result<(), ValidationError> {
    validate_squad(squad, &SquadRules::default())?;
    validate_lineup_with_formation(squad, &selection.lineup, formation)?;

    if selection.bench.player_ids.len() != 4 {
        return Err(ValidationError::InvalidLineup {
            reason: "Yedekler tam olarak 4 oyuncudan oluşmalıdır.".to_owned(),
        });
    }

    let squad_ids: std::collections::HashSet<_> =
        squad.players.iter().map(|player| player.id).collect();
    let lineup_ids: std::collections::HashSet<_> =
        selection.lineup.player_ids.iter().copied().collect();
    let bench_ids: std::collections::HashSet<_> =
        selection.bench.player_ids.iter().copied().collect();
    if bench_ids.len() != selection.bench.player_ids.len()
        || !bench_ids.is_subset(&squad_ids)
        || !lineup_ids.is_disjoint(&bench_ids)
        || lineup_ids.union(&bench_ids).count() != squad_ids.len()
    {
        return Err(ValidationError::InvalidLineup {
            reason: "İlk 11 ve yedekler kadrodaki oyuncuları birer kez kapsamalıdır.".to_owned(),
        });
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn valid_squad() -> Squad {
        let mut players = Vec::new();
        for id in 1..=2 {
            players.push(Player {
                id,
                name: format!("Kaleci {id}"),
                position: Position::Goalkeeper,
                team_id: id + 5,
                price_m: 5,
            });
        }
        for id in 3..=7 {
            players.push(Player {
                id,
                name: format!("Defans {id}"),
                position: Position::Defender,
                team_id: ((id - 3) % 5) + 1,
                price_m: 5,
            });
        }
        for id in 8..=12 {
            players.push(Player {
                id,
                name: format!("Orta saha {id}"),
                position: Position::Midfielder,
                team_id: ((id - 8) % 5) + 1,
                price_m: 5,
            });
        }
        for id in 13..=15 {
            players.push(Player {
                id,
                name: format!("Forvet {id}"),
                position: Position::Forward,
                team_id: id - 12,
                price_m: 5,
            });
        }
        Squad { players }
    }

    #[test]
    fn valid_fifteen_player_squad_is_accepted() {
        assert!(validate_squad(&valid_squad(), &SquadRules::default()).is_ok());
    }

    #[test]
    fn sixteen_players_are_rejected() {
        let mut squad = valid_squad();
        squad.players.push(squad.players[0].clone());
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidSquadSize { .. })
        ));
    }

    #[test]
    fn fourteen_players_are_rejected() {
        let mut squad = valid_squad();
        squad.players.pop();
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidSquadSize { .. })
        ));
    }

    #[test]
    fn budget_over_100_is_rejected() {
        let mut squad = valid_squad();
        squad.players[0].price_m = 101;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::BudgetExceeded { .. })
        ));
    }

    #[test]
    fn four_players_from_one_team_are_rejected() {
        let mut squad = valid_squad();
        squad.players[3].team_id = 1;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::TooManyPlayersFromTeam { .. })
        ));
    }

    #[test]
    fn invalid_position_distribution_is_rejected() {
        let mut squad = valid_squad();
        squad.players[7].position = Position::Forward;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn one_goalkeeper_is_rejected() {
        let mut squad = valid_squad();
        squad.players[1].position = Position::Defender;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn three_goalkeepers_are_rejected() {
        let mut squad = valid_squad();
        squad.players[2].position = Position::Goalkeeper;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn four_defenders_are_rejected() {
        let mut squad = valid_squad();
        squad.players[6].position = Position::Midfielder;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn six_defenders_are_rejected() {
        let mut squad = valid_squad();
        squad.players[7].position = Position::Defender;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn four_midfielders_are_rejected() {
        let mut squad = valid_squad();
        squad.players[11].position = Position::Forward;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn six_midfielders_are_rejected() {
        let mut squad = valid_squad();
        squad.players[12].position = Position::Midfielder;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn two_forwards_are_rejected() {
        let mut squad = valid_squad();
        squad.players[14].position = Position::Midfielder;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    #[test]
    fn four_forwards_are_rejected() {
        let mut squad = valid_squad();
        squad.players[11].position = Position::Forward;
        assert!(matches!(
            validate_squad(&squad, &SquadRules::default()),
            Err(ValidationError::InvalidPositionDistribution { .. })
        ));
    }

    fn valid_lineup() -> Lineup {
        Lineup {
            player_ids: vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13],
            captain: Captain { player_id: 13 },
            vice_captain: ViceCaptain { player_id: 10 },
        }
    }

    #[test]
    fn valid_lineup_is_accepted() {
        assert!(validate_lineup(&valid_squad(), &valid_lineup(), &SquadRules::default()).is_ok());
    }

    #[test]
    fn lineups_with_wrong_player_count_are_rejected() {
        let squad = valid_squad();
        let mut lineup = valid_lineup();
        lineup.player_ids.pop();
        assert!(matches!(
            validate_lineup(&squad, &lineup, &SquadRules::default()),
            Err(ValidationError::InvalidLineup { .. })
        ));
        lineup.player_ids.push(12);
        lineup.player_ids.push(13);
        assert!(matches!(
            validate_lineup(&squad, &lineup, &SquadRules::default()),
            Err(ValidationError::InvalidLineup { .. })
        ));
    }

    #[test]
    fn lineup_with_fewer_than_three_defenders_is_rejected() {
        let squad = valid_squad();
        let lineup = Lineup {
            player_ids: vec![1, 2, 3, 8, 9, 10, 11, 12, 13, 14, 15],
            captain: Captain { player_id: 13 },
            vice_captain: ViceCaptain { player_id: 14 },
        };
        assert!(matches!(
            validate_lineup(&squad, &lineup, &SquadRules::default()),
            Err(ValidationError::InvalidLineup { .. })
        ));
    }

    #[test]
    fn lineup_without_forward_is_rejected() {
        let squad = valid_squad();
        let lineup = Lineup {
            player_ids: (1..=11).collect(),
            captain: Captain { player_id: 8 },
            vice_captain: ViceCaptain { player_id: 9 },
        };
        assert!(matches!(
            validate_lineup(&squad, &lineup, &SquadRules::default()),
            Err(ValidationError::InvalidLineup { .. })
        ));
    }
}
