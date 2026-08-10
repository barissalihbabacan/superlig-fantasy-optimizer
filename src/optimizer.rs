//! Deterministic ilk 11 ve kaptan önerisi.

use crate::{
    data::players::PlayerRecord, validate_lineup, validate_lineup_with_formation,
    validate_squad_selection, Bench, Captain, Lineup, Position, ScoringRules, Squad, SquadRules,
    SquadSelection, ValidationError, ViceCaptain,
};
use std::{fmt, str::FromStr};

/// TFF Fantasy Lig'de kullanılabilen ilk 11 formasyonları.
#[derive(Clone, Copy, Debug, Eq, Hash, Ord, PartialEq, PartialOrd, serde::Serialize)]
pub enum Formation {
    #[serde(rename = "3-5-2")]
    F352,
    #[serde(rename = "3-4-3")]
    F343,
    #[serde(rename = "4-3-3")]
    F433,
    #[serde(rename = "4-4-2")]
    F442,
    #[serde(rename = "4-5-1")]
    F451,
    #[serde(rename = "5-4-1")]
    F541,
    #[serde(rename = "5-3-2")]
    F532,
    #[serde(rename = "5-2-3")]
    F523,
}

impl Formation {
    pub const ALL: [Self; 8] = [
        Self::F352,
        Self::F343,
        Self::F433,
        Self::F442,
        Self::F451,
        Self::F541,
        Self::F532,
        Self::F523,
    ];

    pub const fn defenders(self) -> usize {
        match self {
            Self::F352 | Self::F343 => 3,
            Self::F433 | Self::F442 | Self::F451 => 4,
            Self::F541 | Self::F532 | Self::F523 => 5,
        }
    }

    pub const fn midfielders(self) -> usize {
        match self {
            Self::F352 | Self::F451 => 5,
            Self::F343 | Self::F442 | Self::F541 => 4,
            Self::F433 | Self::F532 => 3,
            Self::F523 => 2,
        }
    }

    pub const fn forwards(self) -> usize {
        match self {
            Self::F343 | Self::F433 | Self::F523 => 3,
            Self::F352 | Self::F442 | Self::F532 => 2,
            Self::F451 | Self::F541 => 1,
        }
    }

    pub const fn total(self) -> usize {
        1 + self.defenders() + self.midfielders() + self.forwards()
    }

    pub const fn as_str(self) -> &'static str {
        match self {
            Self::F352 => "3-5-2",
            Self::F343 => "3-4-3",
            Self::F433 => "4-3-3",
            Self::F442 => "4-4-2",
            Self::F451 => "4-5-1",
            Self::F541 => "5-4-1",
            Self::F532 => "5-3-2",
            Self::F523 => "5-2-3",
        }
    }
}

impl fmt::Display for Formation {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(self.as_str())
    }
}

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FormationParseError {
    pub value: String,
}

impl fmt::Display for FormationParseError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "Geçersiz formasyon: {}", self.value)
    }
}

impl std::error::Error for FormationParseError {}

impl FromStr for Formation {
    type Err = FormationParseError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        match value {
            "3-5-2" => Ok(Self::F352),
            "3-4-3" => Ok(Self::F343),
            "4-3-3" => Ok(Self::F433),
            "4-4-2" => Ok(Self::F442),
            "4-5-1" => Ok(Self::F451),
            "5-4-1" => Ok(Self::F541),
            "5-3-2" => Ok(Self::F532),
            "5-2-3" => Ok(Self::F523),
            _ => Err(FormationParseError {
                value: value.to_owned(),
            }),
        }
    }
}

/// Bir oyuncunun gelecek maç haftası için kullanıcı/veri katmanı tarafından
/// sağlanan beklenen fantasy puanı.
#[derive(Clone, Debug, PartialEq)]
pub struct PlayerProjection {
    pub player_id: u32,
    pub expected_points: f64,
}

/// Dataset oyuncu ID'siyle ilişkilendirilmiş beklenen puan.
#[derive(Clone, Debug, PartialEq)]
pub struct NamedPlayerProjection {
    pub player_id: String,
    pub expected_points: f64,
}

#[derive(Clone, Debug, Default, PartialEq, serde::Serialize)]
pub struct ProjectionCoverage {
    pub total: usize,
    pub projected: usize,
    pub missing: usize,
}

/// CLI ve veri katmanındaki 0.01M TL fiyat biriminde bütçe.
#[derive(Clone, Copy, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub struct Budget(u32);

impl Budget {
    pub const fn new(units: u32) -> Self {
        Self(units)
    }

    pub fn try_from_i64(units: i64) -> Result<Self, OptimizationError> {
        if units < 0 {
            return Err(OptimizationError::NegativeBudget);
        }
        Ok(Self(units as u32))
    }

    pub const fn units(self) -> u32 {
        self.0
    }
}

/// Optimizer çıktısında gösterilebilen oyuncu bilgisi.
#[derive(Clone, Debug, PartialEq, serde::Serialize)]
pub struct OptimizedPlayer {
    pub player_id: String,
    pub name: String,
    pub team_id: String,
    pub position: Position,
    pub price: u32,
    pub expected_points: f64,
}

/// Bütçeli optimizer hataları.
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OptimizationError {
    NegativeBudget,
    InvalidPlayer(String),
    NoValidSquad { budget: u32 },
}

impl fmt::Display for OptimizationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NegativeBudget => formatter.write_str("Bütçe negatif olamaz."),
            Self::InvalidPlayer(id) => write!(formatter, "Geçersiz oyuncu kaydı: {id}"),
            Self::NoValidSquad { budget } => write!(
                formatter,
                "{} bütçesi içinde geçerli 15 kişilik kadro bulunamadı.",
                budget
            ),
        }
    }
}

impl std::error::Error for OptimizationError {}

/// Bütçe, takım limiti ve formasyonla üretilen tam kadro sonucu.
#[derive(Clone, Debug, PartialEq, serde::Serialize)]
pub struct SquadOptimizationResult {
    pub budget: u32,
    pub total_cost: u32,
    pub remaining_budget: u32,
    pub formation: Formation,
    pub expected_points: f64,
    pub projection_coverage: ProjectionCoverage,
    pub captain: String,
    pub vice_captain: String,
    pub lineup: Vec<OptimizedPlayer>,
    pub bench: Vec<OptimizedPlayer>,
}

/// Dataset oyuncuları üzerinde tam 15 kişilik bütçeli kadro optimizasyonu.
pub fn optimize_squad(
    players: &[PlayerRecord],
    projections: &[NamedPlayerProjection],
    budget: Budget,
    formation: Option<Formation>,
) -> Result<SquadOptimizationResult, OptimizationError> {
    optimize_squad_with_options(
        players,
        projections,
        budget,
        formation,
        Some(SquadRules::default().max_players_per_team),
        ScoringRules::default().captain_multiplier,
    )
}

/// Takım limiti ve kaptan çarpanı açıkça verilebilen optimizer API'si.
pub fn optimize_squad_with_options(
    players: &[PlayerRecord],
    projections: &[NamedPlayerProjection],
    budget: Budget,
    formation: Option<Formation>,
    max_players_per_team: Option<usize>,
    captain_multiplier: i32,
) -> Result<SquadOptimizationResult, OptimizationError> {
    if captain_multiplier < 1 {
        return Err(OptimizationError::InvalidPlayer(
            "Kaptan çarpanı en az 1 olmalıdır.".to_owned(),
        ));
    }
    let projection_map: std::collections::HashMap<_, _> = projections
        .iter()
        .map(|projection| (projection.player_id.as_str(), projection.expected_points))
        .collect();
    let projected = players
        .iter()
        .filter(|player| projection_map.contains_key(player.id.as_str()))
        .count();
    let coverage = ProjectionCoverage {
        total: players.len(),
        projected,
        missing: players.len().saturating_sub(projected),
    };
    let mut ids = std::collections::HashSet::new();
    let candidates: Vec<_> = players
        .iter()
        .map(|player| {
            if player.id.trim().is_empty()
                || player.name.trim().is_empty()
                || !ids.insert(player.id.as_str())
            {
                return Err(OptimizationError::InvalidPlayer(player.id.clone()));
            }
            let expected_points = projection_map
                .get(player.id.as_str())
                .copied()
                .unwrap_or(0.0);
            if !expected_points.is_finite() {
                return Err(OptimizationError::InvalidPlayer(player.id.clone()));
            }
            Ok(OptimizedPlayer {
                player_id: player.id.clone(),
                name: player.name.clone(),
                team_id: player.team_id.clone(),
                position: player.position,
                price: player.price.0,
                expected_points,
            })
        })
        .collect::<Result<Vec<_>, _>>()?;

    let formations: Vec<_> = formation.map_or_else(|| Formation::ALL.to_vec(), |item| vec![item]);
    let mut best = None;
    for formation in formations {
        let result = optimize_one_formation(
            &candidates,
            budget,
            formation,
            max_players_per_team,
            captain_multiplier,
        );
        if result.as_ref().is_some_and(|candidate| {
            best.as_ref()
                .is_none_or(|current| is_better_result(candidate, current))
        }) {
            best = result.map(|mut candidate| {
                candidate.projection_coverage = coverage.clone();
                candidate
            });
        }
    }
    best.ok_or(OptimizationError::NoValidSquad {
        budget: budget.units(),
    })
}

fn position_index(position: Position) -> usize {
    match position {
        Position::Goalkeeper => 0,
        Position::Defender => 1,
        Position::Midfielder => 2,
        Position::Forward => 3,
    }
}

fn optimize_one_formation(
    players: &[OptimizedPlayer],
    budget: Budget,
    formation: Formation,
    max_players_per_team: Option<usize>,
    captain_multiplier: i32,
) -> Option<SquadOptimizationResult> {
    let required = [2, 5, 5, 3];
    let lineup_required = [
        1,
        formation.defenders(),
        formation.midfielders(),
        formation.forwards(),
    ];
    let mut by_position = [Vec::new(), Vec::new(), Vec::new(), Vec::new()];
    for (index, player) in players.iter().enumerate() {
        by_position[position_index(player.position)].push(index);
    }
    for (position, indices) in by_position.iter_mut().enumerate() {
        indices.sort_by(|&left, &right| candidate_order(&players[left], &players[right]));
        if indices.len() < required[position] {
            return None;
        }
    }

    let mut search = SquadSearch {
        players,
        by_position: &by_position,
        required,
        lineup_required,
        budget: budget.units(),
        max_players_per_team,
        captain_multiplier,
        best: None,
    };
    let mut selected = Vec::with_capacity(15);
    let mut team_counts = std::collections::HashMap::new();
    search.search_position(0, 0, &mut selected, &mut team_counts);
    search.best.map(|mut result| {
        result.formation = formation;
        result
    })
}

fn candidate_order(left: &OptimizedPlayer, right: &OptimizedPlayer) -> std::cmp::Ordering {
    right
        .expected_points
        .total_cmp(&left.expected_points)
        .then_with(|| left.price.cmp(&right.price))
        .then_with(|| left.player_id.cmp(&right.player_id))
}

struct SquadSearch<'a> {
    players: &'a [OptimizedPlayer],
    by_position: &'a [Vec<usize>; 4],
    required: [usize; 4],
    lineup_required: [usize; 4],
    budget: u32,
    max_players_per_team: Option<usize>,
    captain_multiplier: i32,
    best: Option<SquadOptimizationResult>,
}

impl<'a> SquadSearch<'a> {
    fn search_position(
        &mut self,
        position: usize,
        start: usize,
        selected: &mut Vec<usize>,
        team_counts: &mut std::collections::HashMap<&'a str, usize>,
    ) {
        if position == self.required.len() {
            if let Some(result) = self.build_result(selected) {
                if self
                    .best
                    .as_ref()
                    .is_none_or(|current| is_better_result(&result, current))
                {
                    self.best = Some(result);
                }
            }
            return;
        }
        if position > 0 && start != 0 {
            return;
        }
        let indices = &self.by_position[position];
        let needed = self.required[position];
        self.choose_position(position, 0, needed, indices, selected, team_counts);
    }

    fn choose_position(
        &mut self,
        position: usize,
        start: usize,
        remaining: usize,
        indices: &[usize],
        selected: &mut Vec<usize>,
        team_counts: &mut std::collections::HashMap<&'a str, usize>,
    ) {
        if remaining == 0 {
            self.search_position(position + 1, 0, selected, team_counts);
            return;
        }
        if indices.len().saturating_sub(start) < remaining {
            return;
        }
        for offset in start..indices.len() {
            if indices.len() - offset < remaining {
                break;
            }
            let index = indices[offset];
            let player = &self.players[index];
            let team_id = player_team(player);
            let count = team_counts.get(team_id).copied().unwrap_or(0);
            if self
                .max_players_per_team
                .is_some_and(|limit| count >= limit)
            {
                continue;
            }
            if selected_cost(self.players, selected) + player.price > self.budget {
                continue;
            }
            *team_counts.entry(team_id).or_default() += 1;
            selected.push(index);
            if self.can_still_fit(position, offset + 1, remaining - 1, indices, selected) {
                self.choose_position(
                    position,
                    offset + 1,
                    remaining - 1,
                    indices,
                    selected,
                    team_counts,
                );
            }
            selected.pop();
            *team_counts.get_mut(team_id).expect("takım sayacı mevcut") -= 1;
        }
    }

    fn can_still_fit(
        &self,
        position: usize,
        start: usize,
        remaining: usize,
        indices: &[usize],
        selected: &[usize],
    ) -> bool {
        if indices.len().saturating_sub(start) < remaining {
            return false;
        }
        let mut current_prices: Vec<_> = indices
            .iter()
            .skip(start)
            .map(|&index| self.players[index].price)
            .collect();
        current_prices.sort_unstable();
        let mut minimum = current_prices.into_iter().take(remaining).sum::<u32>();
        for next_position in position + 1..self.required.len() {
            let need = self.required[next_position];
            let mut prices: Vec<_> = self.by_position[next_position]
                .iter()
                .map(|&index| self.players[index].price)
                .collect();
            prices.sort_unstable();
            if prices.len() < need {
                return false;
            }
            minimum += prices.into_iter().take(need).sum::<u32>();
        }
        let total_cost = selected_cost(self.players, selected);
        if total_cost + minimum > self.budget {
            return false;
        }
        let Some(best) = self.best.as_ref() else {
            return true;
        };
        let upper_bound = self.optimistic_expected_points(selected);
        upper_bound > best.expected_points
            || (upper_bound.total_cmp(&best.expected_points).is_eq()
                && total_cost + minimum < best.total_cost)
    }

    fn optimistic_expected_points(&self, selected: &[usize]) -> f64 {
        let mut score = 0.0;
        let mut captain = f64::NEG_INFINITY;
        for (position, indices) in self.by_position.iter().enumerate() {
            let mut points: Vec<_> = selected
                .iter()
                .filter(|&&index| position_index(self.players[index].position) == position)
                .map(|&index| self.players[index].expected_points)
                .collect();
            points.extend(
                indices
                    .iter()
                    .map(|&index| self.players[index].expected_points),
            );
            points.sort_by(f64::total_cmp);
            let take = self.lineup_required[position];
            score += points.iter().rev().take(take).sum::<f64>();
            if let Some(value) = points.iter().rev().take(take).next() {
                captain = captain.max(*value);
            }
        }
        score + captain * f64::from(self.captain_multiplier - 1)
    }

    fn build_result(&self, selected: &[usize]) -> Option<SquadOptimizationResult> {
        if selected.len() != 15 || selected_cost(self.players, selected) > self.budget {
            return None;
        }
        let mut position_players: [Vec<OptimizedPlayer>; 4] =
            [Vec::new(), Vec::new(), Vec::new(), Vec::new()];
        for &index in selected {
            position_players[position_index(self.players[index].position)]
                .push(self.players[index].clone());
        }
        for players in &mut position_players {
            players.sort_by(candidate_order);
        }
        let mut lineup = Vec::new();
        let mut bench = Vec::new();
        for (position, players) in position_players.into_iter().enumerate() {
            lineup.extend(players.iter().take(self.lineup_required[position]).cloned());
            bench.extend(players.into_iter().skip(self.lineup_required[position]));
        }
        bench.sort_by(candidate_order);
        if lineup.len() != 11 || bench.len() != 4 {
            return None;
        }
        let captain = lineup
            .iter()
            .max_by(|left, right| candidate_order(left, right).reverse())?;
        let vice_captain = lineup
            .iter()
            .filter(|player| player.player_id != captain.player_id)
            .max_by(|left, right| candidate_order(left, right).reverse())?;
        let base_points: f64 = lineup.iter().map(|player| player.expected_points).sum();
        let expected_points =
            base_points + captain.expected_points * f64::from(self.captain_multiplier - 1);
        Some(SquadOptimizationResult {
            budget: self.budget,
            total_cost: selected_cost(self.players, selected),
            remaining_budget: self.budget - selected_cost(self.players, selected),
            formation: Formation::F352,
            expected_points,
            projection_coverage: ProjectionCoverage::default(),
            captain: captain.player_id.clone(),
            vice_captain: vice_captain.player_id.clone(),
            lineup,
            bench,
        })
    }
}

fn player_team(player: &OptimizedPlayer) -> &str {
    player.team_id.as_str()
}

fn selected_cost(players: &[OptimizedPlayer], selected: &[usize]) -> u32 {
    selected.iter().map(|&index| players[index].price).sum()
}

fn is_better_result(
    candidate: &SquadOptimizationResult,
    current: &SquadOptimizationResult,
) -> bool {
    candidate
        .expected_points
        .total_cmp(&current.expected_points)
        .is_gt()
        || (candidate
            .expected_points
            .total_cmp(&current.expected_points)
            .is_eq()
            && (candidate.total_cost < current.total_cost
                || (candidate.total_cost == current.total_cost
                    && result_ids(candidate) < result_ids(current))))
}

fn result_ids(result: &SquadOptimizationResult) -> Vec<&str> {
    let mut ids: Vec<_> = result
        .lineup
        .iter()
        .chain(result.bench.iter())
        .map(|player| player.player_id.as_str())
        .collect();
    ids.sort_unstable();
    ids
}

#[derive(Clone, Debug, PartialEq)]
pub struct LineupRecommendation {
    pub lineup: Lineup,
    pub bench: Bench,
    pub expected_points: f64,
}

#[derive(Clone, Debug, PartialEq)]
pub struct FormationEvaluation {
    pub formation: Formation,
    pub recommendation: LineupRecommendation,
}

/// Kadro içindeki geçerli ilk 11'i beklenen puanı en yüksek olacak şekilde seçer.
///
/// Kadro boyutu standart olarak 15 olduğundan tüm kombinasyonları denemek hem
/// deterministiktir hem de arama uzayını güvenli biçimde küçük tutar. Eşitlikte
/// kadro sırasını koruyan kombinasyon tercih edilir.
pub fn recommend_lineup(
    squad: &Squad,
    projections: &[PlayerProjection],
    rules: &SquadRules,
) -> Result<LineupRecommendation, ValidationError> {
    if squad.players.len() < rules.lineup_size {
        return Err(ValidationError::InvalidLineup {
            reason: format!("Kadro en az {} oyuncu içermelidir.", rules.lineup_size),
        });
    }

    let values: Vec<f64> = squad
        .players
        .iter()
        .map(|player| {
            projections
                .iter()
                .find(|projection| projection.player_id == player.id)
                .map_or(0.0, |projection| projection.expected_points)
        })
        .collect();

    let mut best: Option<(Vec<usize>, f64)> = None;
    let mut selected = Vec::with_capacity(rules.lineup_size);
    search_lineups(squad, rules, &values, 0, &mut selected, 0.0, &mut best);

    let (indices, total) = best.ok_or_else(|| ValidationError::InvalidLineup {
        reason: "Kadro kurallarına uygun bir ilk 11 bulunamadı.".to_owned(),
    })?;
    let player_ids: Vec<u32> = indices
        .iter()
        .map(|&index| squad.players[index].id)
        .collect();
    let captain_id = indices
        .iter()
        .max_by(|&&left, &&right| values[left].total_cmp(&values[right]))
        .map(|&index| squad.players[index].id)
        .expect("geçerli ilk 11 boş olamaz");
    let vice_captain_id = indices
        .iter()
        .filter(|&&index| squad.players[index].id != captain_id)
        .max_by(|&&left, &&right| values[left].total_cmp(&values[right]))
        .map(|&index| squad.players[index].id)
        .expect("geçerli ilk 11 en az iki oyuncu içerir");

    let lineup = Lineup {
        player_ids,
        captain: Captain {
            player_id: captain_id,
        },
        vice_captain: ViceCaptain {
            player_id: vice_captain_id,
        },
    };
    let bench = make_bench(squad, &lineup);
    validate_lineup(squad, &lineup, rules)?;
    Ok(LineupRecommendation {
        lineup,
        bench,
        expected_points: total,
    })
}

/// Kadro içindeki verilen formasyona uygun en yüksek puanlı ilk 11'i seçer.
pub fn recommend_lineup_for_formation(
    squad: &Squad,
    projections: &[PlayerProjection],
    formation: Formation,
) -> Result<LineupRecommendation, ValidationError> {
    let values: Vec<f64> = squad
        .players
        .iter()
        .map(|player| {
            projections
                .iter()
                .find(|projection| projection.player_id == player.id)
                .map_or(0.0, |projection| projection.expected_points)
        })
        .collect();
    let mut best: Option<(Vec<usize>, f64)> = None;
    let mut selected = Vec::with_capacity(formation.total());
    search_formation(squad, &values, formation, 0, &mut selected, 0.0, &mut best);

    let (indices, total) = best.ok_or_else(|| ValidationError::InvalidLineup {
        reason: format!("{} formasyonuna uygun bir ilk 11 bulunamadı.", formation),
    })?;
    let lineup = make_lineup(squad, &indices, &values);
    let bench = make_bench(squad, &lineup);
    validate_squad_selection(
        squad,
        &SquadSelection {
            lineup: lineup.clone(),
            bench: bench.clone(),
        },
        formation,
    )?;
    Ok(LineupRecommendation {
        lineup,
        bench,
        expected_points: total,
    })
}

/// Tüm desteklenen formasyonlar için ayrı ilk 11 önerisi üretir.
pub fn evaluate_formations(
    squad: &Squad,
    projections: &[PlayerProjection],
) -> Vec<FormationEvaluation> {
    Formation::ALL
        .into_iter()
        .filter_map(|formation| {
            recommend_lineup_for_formation(squad, projections, formation)
                .ok()
                .map(|recommendation| FormationEvaluation {
                    formation,
                    recommendation,
                })
        })
        .collect()
}

/// Uygun formasyonlar arasından beklenen puanı en yüksek olanı döndürür.
pub fn best_formation(
    squad: &Squad,
    projections: &[PlayerProjection],
) -> Option<FormationEvaluation> {
    evaluate_formations(squad, projections)
        .into_iter()
        .max_by(|left, right| {
            left.recommendation
                .expected_points
                .total_cmp(&right.recommendation.expected_points)
        })
}

fn make_lineup(squad: &Squad, indices: &[usize], values: &[f64]) -> Lineup {
    let player_ids = indices
        .iter()
        .map(|&index| squad.players[index].id)
        .collect();
    let captain_id = indices
        .iter()
        .max_by(|&&left, &&right| values[left].total_cmp(&values[right]))
        .map(|&index| squad.players[index].id)
        .expect("geçerli ilk 11 boş olamaz");
    let vice_captain_id = indices
        .iter()
        .filter(|&&index| squad.players[index].id != captain_id)
        .max_by(|&&left, &&right| values[left].total_cmp(&values[right]))
        .map(|&index| squad.players[index].id)
        .expect("geçerli ilk 11 en az iki oyuncu içerir");
    Lineup {
        player_ids,
        captain: Captain {
            player_id: captain_id,
        },
        vice_captain: ViceCaptain {
            player_id: vice_captain_id,
        },
    }
}

fn make_bench(squad: &Squad, lineup: &Lineup) -> Bench {
    let lineup_ids: std::collections::HashSet<_> = lineup.player_ids.iter().copied().collect();
    Bench {
        player_ids: squad
            .players
            .iter()
            .filter(|player| !lineup_ids.contains(&player.id))
            .map(|player| player.id)
            .collect(),
    }
}

fn search_formation(
    squad: &Squad,
    values: &[f64],
    formation: Formation,
    next: usize,
    selected: &mut Vec<usize>,
    total: f64,
    best: &mut Option<(Vec<usize>, f64)>,
) {
    if selected.len() == formation.total() {
        let lineup = make_lineup(squad, selected, values);
        if validate_lineup_with_formation(squad, &lineup, formation).is_ok()
            && best.as_ref().is_none_or(|(_, score)| total > *score)
        {
            *best = Some((selected.clone(), total));
        }
        return;
    }
    let remaining = formation.total() - selected.len();
    if squad.players.len().saturating_sub(next) < remaining {
        return;
    }
    for index in next..squad.players.len() {
        selected.push(index);
        search_formation(
            squad,
            values,
            formation,
            index + 1,
            selected,
            total + values[index],
            best,
        );
        selected.pop();
    }
}

fn search_lineups(
    squad: &Squad,
    rules: &SquadRules,
    values: &[f64],
    next: usize,
    selected: &mut Vec<usize>,
    total: f64,
    best: &mut Option<(Vec<usize>, f64)>,
) {
    if selected.len() == rules.lineup_size {
        let candidate = Lineup {
            player_ids: selected
                .iter()
                .map(|&index| squad.players[index].id)
                .collect(),
            captain: Captain {
                player_id: squad.players[selected[0]].id,
            },
            vice_captain: ViceCaptain {
                player_id: squad.players[selected[1]].id,
            },
        };
        if validate_lineup(squad, &candidate, rules).is_ok()
            && best.as_ref().is_none_or(|(_, score)| total > *score)
        {
            *best = Some((selected.clone(), total));
        }
        return;
    }

    let remaining = rules.lineup_size - selected.len();
    if squad.players.len().saturating_sub(next) < remaining {
        return;
    }
    for index in next..squad.players.len() {
        selected.push(index);
        search_lineups(
            squad,
            rules,
            values,
            index + 1,
            selected,
            total + values[index],
            best,
        );
        selected.pop();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::data::players::{PlayerRecord, Price};
    use crate::{Player, Position};

    fn squad() -> Squad {
        let mut players = Vec::new();
        for id in 1..=2 {
            players.push(player(id, Position::Goalkeeper));
        }
        for id in 3..=7 {
            players.push(player(id, Position::Defender));
        }
        for id in 8..=12 {
            players.push(player(id, Position::Midfielder));
        }
        for id in 13..=15 {
            players.push(player(id, Position::Forward));
        }
        Squad { players }
    }

    fn player(id: u32, position: Position) -> Player {
        Player {
            id,
            name: id.to_string(),
            position,
            team_id: id,
            price_m: 5,
        }
    }

    #[test]
    fn selects_highest_scoring_valid_lineup_and_captain() {
        let projections = (1..=15)
            .map(|id| PlayerProjection {
                player_id: id,
                expected_points: id as f64,
            })
            .collect::<Vec<_>>();
        let result = recommend_lineup(&squad(), &projections, &SquadRules::default()).unwrap();

        assert_eq!(
            result.lineup.player_ids,
            vec![2, 5, 6, 7, 9, 10, 11, 12, 13, 14, 15]
        );
        assert_eq!(result.lineup.captain.player_id, 15);
        assert_eq!(result.lineup.vice_captain.player_id, 14);
        assert_eq!(result.expected_points, 104.0);
    }

    #[test]
    fn missing_projection_is_treated_as_zero() {
        let result = recommend_lineup(&squad(), &[], &SquadRules::default()).unwrap();
        assert_eq!(result.lineup.player_ids.len(), 11);
        assert!(result.expected_points.abs() < f64::EPSILON);
    }

    #[test]
    fn all_supported_formations_parse_and_have_eleven_players() {
        let names = [
            "3-5-2", "3-4-3", "4-3-3", "4-4-2", "4-5-1", "5-4-1", "5-3-2", "5-2-3",
        ];
        for (formation, name) in Formation::ALL.into_iter().zip(names) {
            assert_eq!(name.parse::<Formation>().unwrap(), formation);
            assert_eq!(
                formation.defenders() + formation.midfielders() + formation.forwards(),
                10
            );
            assert_eq!(formation.total(), 11);
        }
        assert!("4-2-4".parse::<Formation>().is_err());
    }

    #[test]
    fn formation_recommendations_have_exact_position_counts() {
        let projections = (1..=15)
            .map(|id| PlayerProjection {
                player_id: id,
                expected_points: id as f64,
            })
            .collect::<Vec<_>>();
        for formation in Formation::ALL {
            let recommendation =
                recommend_lineup_for_formation(&squad(), &projections, formation).unwrap();
            assert_eq!(recommendation.lineup.player_ids.len(), 11);
            assert_eq!(recommendation.bench.player_ids.len(), 4);
            assert_eq!(
                recommendation.lineup.player_ids.len() + recommendation.bench.player_ids.len(),
                15
            );
            crate::validate_lineup_with_formation(&squad(), &recommendation.lineup, formation)
                .unwrap();
            let lineup_ids: std::collections::HashSet<_> =
                recommendation.lineup.player_ids.iter().copied().collect();
            let bench_ids: std::collections::HashSet<_> =
                recommendation.bench.player_ids.iter().copied().collect();
            assert!(lineup_ids.is_disjoint(&bench_ids));
        }
    }

    #[test]
    fn lineup_and_bench_cannot_contain_the_same_player() {
        let projections = (1..=15)
            .map(|id| PlayerProjection {
                player_id: id,
                expected_points: id as f64,
            })
            .collect::<Vec<_>>();
        let recommendation =
            recommend_lineup_for_formation(&squad(), &projections, Formation::F352).unwrap();
        let mut invalid = SquadSelection {
            lineup: recommendation.lineup,
            bench: recommendation.bench,
        };
        invalid.bench.player_ids[0] = invalid.lineup.player_ids[0];
        assert!(crate::validate_squad_selection(&squad(), &invalid, Formation::F352).is_err());
    }

    #[test]
    fn formation_comparison_selects_highest_expected_points() {
        let mut projections = Vec::new();
        for id in 1..=15 {
            let expected_points = match id {
                3..=7 => (id - 2) as f64,
                8..=12 => (18 - id) as f64,
                13..=15 => (33 - id) as f64,
                _ => id as f64,
            };
            projections.push(PlayerProjection {
                player_id: id,
                expected_points,
            });
        }
        let evaluations = evaluate_formations(&squad(), &projections);
        assert_eq!(evaluations.len(), 8);
        let best = best_formation(&squad(), &projections).unwrap();
        assert_eq!(best.formation, Formation::F343);
        assert_eq!(best.recommendation.expected_points, 105.0);
    }

    fn dataset_players() -> Vec<PlayerRecord> {
        let mut players = Vec::new();
        let mut id = 1;
        for (position, count) in [
            (Position::Goalkeeper, 3),
            (Position::Defender, 7),
            (Position::Midfielder, 7),
            (Position::Forward, 5),
        ] {
            for _ in 0..count {
                players.push(PlayerRecord {
                    id: format!("player-{id}"),
                    name: format!("Player {id}"),
                    team_id: format!("team-{}", id % 6),
                    position,
                    price: Price(400),
                });
                id += 1;
            }
        }
        players
    }

    fn projections(players: &[PlayerRecord]) -> Vec<NamedPlayerProjection> {
        players
            .iter()
            .map(|player| NamedPlayerProjection {
                player_id: player.id.clone(),
                expected_points: player.id[7..].parse::<f64>().unwrap(),
            })
            .collect()
    }

    #[test]
    fn budget_optimizer_returns_valid_fifteen_player_squad() {
        let players = dataset_players();
        let result = optimize_squad(
            &players,
            &projections(&players),
            Budget::new(8_000),
            Some(Formation::F352),
        )
        .unwrap();
        assert_eq!(result.lineup.len(), 11);
        assert_eq!(result.bench.len(), 4);
        assert!(result.total_cost <= 8_000);
        assert_eq!(result.formation, Formation::F352);
        assert_ne!(result.captain, result.vice_captain);
        assert!(result
            .lineup
            .iter()
            .any(|player| player.player_id == result.captain));
        assert!(result
            .lineup
            .iter()
            .any(|player| player.player_id == result.vice_captain));
    }

    #[test]
    fn budget_optimizer_respects_formation_and_bench_counts() {
        let players = dataset_players();
        for formation in [Formation::F352, Formation::F433, Formation::F523] {
            let result =
                optimize_squad(&players, &[], Budget::new(8_000), Some(formation)).unwrap();
            assert_eq!(result.lineup.len(), 11);
            assert_eq!(result.bench.len(), 4);
            assert_eq!(
                result
                    .lineup
                    .iter()
                    .filter(|player| player.position == Position::Goalkeeper)
                    .count(),
                1
            );
            assert_eq!(
                result
                    .lineup
                    .iter()
                    .filter(|player| player.position == Position::Defender)
                    .count(),
                formation.defenders()
            );
            assert_eq!(
                result
                    .lineup
                    .iter()
                    .filter(|player| player.position == Position::Midfielder)
                    .count(),
                formation.midfielders()
            );
            assert_eq!(
                result
                    .lineup
                    .iter()
                    .filter(|player| player.position == Position::Forward)
                    .count(),
                formation.forwards()
            );
            let lineup_ids: std::collections::HashSet<_> = result
                .lineup
                .iter()
                .map(|player| &player.player_id)
                .collect();
            assert!(result
                .bench
                .iter()
                .all(|player| !lineup_ids.contains(&player.player_id)));
        }
    }

    #[test]
    fn budget_optimizer_maximizes_projection_without_exceeding_budget() {
        let mut players = dataset_players();
        players[0].price = Price(2_000);
        let projections = players
            .iter()
            .map(|player| NamedPlayerProjection {
                player_id: player.id.clone(),
                expected_points: if player.id == "player-1" { 100.0 } else { 1.0 },
            })
            .collect::<Vec<_>>();
        let result = optimize_squad(
            &players,
            &projections,
            Budget::new(7_500),
            Some(Formation::F352),
        )
        .unwrap();
        assert!(result.total_cost <= 7_500);
        assert!(!result
            .lineup
            .iter()
            .chain(result.bench.iter())
            .any(|player| player.player_id == "player-1"));
        assert!(result.expected_points > 0.0);
    }

    #[test]
    fn budget_optimizer_returns_error_when_no_squad_fits() {
        let players = dataset_players();
        let error = optimize_squad(&players, &[], Budget::new(5_999), None).unwrap_err();
        assert!(matches!(
            error,
            OptimizationError::NoValidSquad { budget: 5_999 }
        ));
        assert!(matches!(
            Budget::try_from_i64(-1),
            Err(OptimizationError::NegativeBudget)
        ));
    }

    #[test]
    fn budget_optimizer_is_deterministic_on_repeated_and_tied_inputs() {
        let players = dataset_players();
        let first = optimize_squad(&players, &[], Budget::new(8_000), None).unwrap();
        let second = optimize_squad(&players, &[], Budget::new(8_000), None).unwrap();
        assert_eq!(first, second);
    }
}
