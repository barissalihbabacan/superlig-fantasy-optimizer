//! WASM bindings for the Süper Lig Fantasy Optimizer core library.
//!
//! Thin JSON-in/JSON-out wrappers over the pure (filesystem-free) parts of
//! `superlig_fantasy_optimizer`. Filesystem-bound APIs (`DatasetContext::load`,
//! `validate_season_directory`, `read_json`) are intentionally not exposed here
//! — the browser has no filesystem, so the frontend bundles the season JSON
//! files itself (via Vite) and passes their contents in as strings instead.

use std::str::FromStr;

use serde::Serialize;
use wasm_bindgen::prelude::*;

use superlig_fantasy_optimizer::{
    data::{
        compute_dataset_stats,
        fixtures::FixtureDataset,
        matches::MatchDataset,
        players::PlayerDataset,
        teams::TeamDataset,
        validation::{validate_fixtures, validate_match, validate_players, validate_teams},
    },
    optimizer::{optimize_squad_with_options, Formation, NamedPlayerProjection},
    projection_engine::project_all_players,
    scoring::calculate_player_match_score,
    validate_lineup_with_formation, validate_squad, Budget, Lineup, MatchPerformance, Squad,
    SquadRules,
};

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[derive(Serialize)]
struct JsError {
    kind: &'static str,
    message: String,
}

fn err_to_js<E: std::fmt::Display>(kind: &'static str, error: E) -> JsValue {
    serde_wasm_bindgen::to_value(&JsError {
        kind,
        message: error.to_string(),
    })
    .unwrap_or_else(|_| JsValue::from_str(kind))
}

fn to_js<T: Serialize>(value: &T) -> Result<JsValue, JsValue> {
    serde_wasm_bindgen::to_value(value).map_err(|error| err_to_js("EncodeError", error))
}

fn from_js<T: serde::de::DeserializeOwned>(value: JsValue) -> Result<T, JsValue> {
    serde_wasm_bindgen::from_value(value).map_err(|error| err_to_js("DecodeError", error))
}

/// `players_json`/`projections_json`: JSON arrays of `PlayerRecord`/`NamedPlayerProjection`.
/// `budget_units`: 0.01M TL cinsinden bütçe (ör. 10000 = 100.0M TL).
/// `formation`: "3-5-2" gibi bir string, ya da otomatik formasyon araması için `undefined`/`null`.
#[wasm_bindgen(js_name = optimizeSquad)]
pub fn optimize_squad_js(
    players_json: JsValue,
    projections_json: JsValue,
    budget_units: u32,
    formation: Option<String>,
    max_players_per_team: Option<usize>,
    captain_multiplier: i32,
) -> Result<JsValue, JsValue> {
    let players: Vec<superlig_fantasy_optimizer::data::players::PlayerRecord> =
        from_js(players_json)?;
    let projections: Vec<NamedPlayerProjection> = from_js(projections_json)?;
    let formation = match formation {
        Some(value) => Some(
            Formation::from_str(&value).map_err(|error| err_to_js("FormationParseError", error))?,
        ),
        None => None,
    };

    let result = optimize_squad_with_options(
        &players,
        &projections,
        Budget::new(budget_units),
        formation,
        max_players_per_team,
        captain_multiplier,
    )
    .map_err(|error| err_to_js("OptimizationError", error))?;

    to_js(&result)
}

/// `performance_json`: bir `MatchPerformance`. `rules_json`: `undefined`/`null` ise varsayılan kurallar kullanılır.
#[wasm_bindgen(js_name = calculatePlayerMatchScore)]
pub fn calculate_player_match_score_js(
    performance_json: JsValue,
    rules_json: JsValue,
) -> Result<JsValue, JsValue> {
    let performance: MatchPerformance = from_js(performance_json)?;
    let rules = if rules_json.is_undefined() || rules_json.is_null() {
        superlig_fantasy_optimizer::ScoringRules::default()
    } else {
        from_js(rules_json)?
    };
    let score = calculate_player_match_score(&performance, &rules);
    to_js(&score)
}

/// `players_json`: `PlayerDataset`. `matches_json`: `MatchDataset` dizisi.
/// `fixtures_json`: `FixtureRecord` dizisi. `rules_json`: `undefined`/`null` ise varsayılan kurallar kullanılır.
#[wasm_bindgen(js_name = projectAllPlayers)]
pub fn project_all_players_js(
    players_json: JsValue,
    matches_json: JsValue,
    fixtures_json: JsValue,
    rules_json: JsValue,
) -> Result<JsValue, JsValue> {
    let players: PlayerDataset = from_js(players_json)?;
    let matches: Vec<MatchDataset> = from_js(matches_json)?;
    let fixtures: Vec<superlig_fantasy_optimizer::data::fixtures::FixtureRecord> =
        from_js(fixtures_json)?;
    let rules = if rules_json.is_undefined() || rules_json.is_null() {
        superlig_fantasy_optimizer::ScoringRules::default()
    } else {
        from_js(rules_json)?
    };
    let calculation = project_all_players(&players, &matches, &fixtures, &rules);
    to_js(&calculation)
}

/// `squad_json`: bir `Squad`. `rules_json`: `undefined`/`null` ise varsayılan kurallar kullanılır.
#[wasm_bindgen(js_name = validateSquad)]
pub fn validate_squad_js(squad_json: JsValue, rules_json: JsValue) -> Result<(), JsValue> {
    let squad: Squad = from_js(squad_json)?;
    let rules = if rules_json.is_undefined() || rules_json.is_null() {
        SquadRules::default()
    } else {
        from_js(rules_json)?
    };
    validate_squad(&squad, &rules).map_err(|error| err_to_js("ValidationError", error))
}

/// `squad_json`: bir `Squad`. `lineup_json`: bir `Lineup`. `formation`: "3-5-2" gibi bir string.
#[wasm_bindgen(js_name = validateLineupWithFormation)]
pub fn validate_lineup_with_formation_js(
    squad_json: JsValue,
    lineup_json: JsValue,
    formation: String,
) -> Result<(), JsValue> {
    let squad: Squad = from_js(squad_json)?;
    let lineup: Lineup = from_js(lineup_json)?;
    let formation =
        Formation::from_str(&formation).map_err(|error| err_to_js("FormationParseError", error))?;
    validate_lineup_with_formation(&squad, &lineup, formation)
        .map_err(|error| err_to_js("ValidationError", error))
}

#[wasm_bindgen(js_name = defaultScoringRules)]
pub fn default_scoring_rules_js() -> Result<JsValue, JsValue> {
    to_js(&superlig_fantasy_optimizer::ScoringRules::default())
}

#[wasm_bindgen(js_name = defaultSquadRules)]
pub fn default_squad_rules_js() -> Result<JsValue, JsValue> {
    to_js(&SquadRules::default())
}

/// `DatasetContext::load`'un dosya sistemi gerektiren kısmının bellek-içi karşılığı:
/// zaten stringe çevrilmiş dataset dosyalarını doğrular ve özet istatistik döner.
/// `matches_json`: her biri bir `MatchDataset` JSON string'i olan dizi (sırasız).
#[wasm_bindgen(js_name = validateAndSummarizeDataset)]
pub fn validate_and_summarize_dataset_js(
    teams_json: &str,
    players_json: &str,
    fixtures_json: &str,
    matches_json: Vec<String>,
) -> Result<JsValue, JsValue> {
    let teams: TeamDataset =
        serde_json::from_str(teams_json).map_err(|error| err_to_js("Json", error))?;
    let players: PlayerDataset =
        serde_json::from_str(players_json).map_err(|error| err_to_js("Json", error))?;
    let fixtures: FixtureDataset =
        serde_json::from_str(fixtures_json).map_err(|error| err_to_js("Json", error))?;

    validate_teams(&teams).map_err(|error| err_to_js("DataValidationError", error))?;
    validate_players(&players, &teams).map_err(|error| err_to_js("DataValidationError", error))?;
    validate_fixtures(&fixtures, &teams)
        .map_err(|error| err_to_js("DataValidationError", error))?;

    let mut matches = Vec::with_capacity(matches_json.len());
    for raw in &matches_json {
        let dataset: MatchDataset =
            serde_json::from_str(raw).map_err(|error| err_to_js("Json", error))?;
        validate_match(&dataset, &teams, &players, &fixtures)
            .map_err(|error| err_to_js("DataValidationError", error))?;
        matches.push(dataset);
    }

    let stats = compute_dataset_stats(&teams, &players, &fixtures, &matches);
    to_js(&stats)
}
