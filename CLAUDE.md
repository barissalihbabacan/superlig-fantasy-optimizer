# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Süper Lig Fantasy Optimizer (`sf`) is a Rust CLI/library that validates Trendyol Süper Lig
Fantasy squads, calculates fantasy scores from match performance, projects expected points, and
produces deterministic squad recommendations under budget constraints. A React/TypeScript web app
(`web/`) reads the same JSON dataset directly (via `resolveJsonModule` imports) and calls the squad
optimizer's real Rust implementation (`src/optimizer.rs`) compiled to WebAssembly via
`crates/wasm-bindings` — there is no separate TypeScript reimplementation of that logic to keep in
sync. The web app is hosted on Firebase Hosting (see `firebase.json` / `web/src/services/firebase.ts`);
GitHub Pages now only serves a small static redirect page pointing at it (see below).

The project has no scraping/API-fetch system baked into the CLI or web app itself; dataset updates
come from the sync scripts in `scripts/` (see below) or manual edits. All data is manually curated —
do not invent player stats, prices, projections, or match results.

## Commands

### Rust (CLI + library, primary codebase)

```bash
cargo build                                   # build
cargo run --bin sf -- --help                  # run CLI in dev
cargo run --bin sf -- optimize --budget 10000 --formation 3-5-2
cargo test                                    # run all tests (unit + tests/*.rs integration tests)
cargo test --test cli                         # run one integration test file (cli.rs/data.rs/projections.rs/projection_engine.rs)
cargo test some_test_name                     # run a single test by name substring
cargo fmt --check                             # required by CI — must pass
cargo clippy --all-targets --all-features -- -D warnings   # required by CI — must pass
cargo build --release                         # release binary at target/release/sf
```

CI (`.github/workflows/ci.yml`) runs `cargo fmt --check`, `cargo test`, and `cargo clippy -D warnings`
on every push/PR — always run these three before considering Rust work done.

The CLI looks for the dataset at `data/2026-27` relative to the current directory, the executable's
directory, or the Cargo manifest directory (in that order), overridable via `SF_DATA_DIR`. `--path`
on `sf data ...` subcommands takes precedence over all of that.

### Web frontend (React + Vite + Tailwind, root `package.json`)

```bash
npm install
npm run dev             # vite dev server
npm run build           # tsc --noEmit && vite build -> outputs to dist/
npm run lint            # eslint over web/src, zero warnings allowed
npm run preview
```

Note: `package.json` lives at the repo root but all frontend source is under `web/src`; `vite.config.ts`
aliases `@` to `web/src` and reads `base` from `VITE_BASE_PATH` (defaults to `/`, matching Firebase
Hosting). `npm run build`/`npm run dev` first run `wasm-pack` on `crates/wasm-bindings` (needs the
`wasm32-unknown-unknown` rustup target and `wasm-pack` installed) before building the frontend.
Vitest (`npm test`) covers the wasm optimizer binding; everything else is `tsc --noEmit` + `eslint` +
manual/browser check.

## Architecture

### Rust library (`src/`)

- `models.rs` — core domain types: `Position`, `Player`, `Squad`, `MatchPerformance`, `PlayerMatchScore`.
- `rules.rs` — `ScoringRules` and `SquadRules` (squad size 15 = 2 GK/5 DEF/5 MID/3 FWD, budget cap,
  max 3 players per real-world team, 11-player lineup + 4-player bench).
- `scoring.rs` — turns a raw `MatchPerformance` into a `PlayerMatchScore` (minutes, position-weighted
  goals, assists, clean sheets, saves, penalties, cards, own goals, bonus); captain multiplier is 2x.
- `optimizer.rs` — `Formation` (8 supported formations, e.g. `3-5-2`), `optimize_squad` /
  `optimize_squad_with_options` (deterministic squad selection under budget + formation + team-limit
  constraints), lineup/bench/captain/vice-captain selection.
- `projection_engine.rs` — historical expected-points projection: weighted average of a player's last
  5 played matches (weights `[1,2,3,4,5]`, newest heaviest, 0-minute performances excluded), plus
  upcoming-fixture context (up to 3 fixtures, home/away, opponent). No synthetic xG/injury/home-advantage
  modeling — if there's no matching performance data, expected points is `0`, never fabricated.
- `data/` — JSON dataset models + validation, one submodule per entity:
  - `teams.rs`, `players.rs`, `fixtures.rs`, `matches.rs`, `projections.rs` — serde models for each
    `data/2026-27/*.json` file / `data/2026-27/matches/*.json` per-match file.
  - `validation.rs` — referential-integrity checks (`validate_teams`, `validate_players`,
    `validate_fixtures`, `validate_match`, `validate_season_directory`, `read_json`).
  - `mod.rs` — `DatasetContext::load(root)` loads + validates an entire season directory in one call
    (teams, players, fixtures, all match files) and exposes `stats()` for summary counts; this is the
    entry point most CLI `data` subcommands use.
- `error.rs` — `DataValidationError` / `ValidationError` used across data loading and squad validation.

`lib.rs` re-exports the public API and defines top-level squad/lineup validators
(`validate_squad`, `validate_lineup`, `validate_lineup_with_formation`, `validate_squad_selection`)
that check squad size, position distribution, budget, per-team limits, and lineup/bench disjointness
against a given `Formation`.

### CLI (`src/main.rs`)

Thin argument-parsing layer over the library — commands: `score`, `optimize`, `projection`
(`calculate|stats|validate|show`), `rules`, `formation` (`list|show`), `validate`, `data`
(`validate|stats|teams|players|fixtures|matches`), `fixture`, `version`. Most commands support
`--format human|json`. `sf validate` auto-detects the JSON shape (match/team/player/fixture dataset,
squad, or single match performance) from the file contents.

### Dataset (`data/2026-27/`)

- `teams.json`, `players.json`, `fixtures.json`, `projections.json` — season-wide records.
- `matches/*.json` — one file per finished/live match with raw player performances (schema:
  `schema_version`, `match_id`, referenced by `sf score --match`).
- `projections.json` is regenerated by `sf projection calculate` from match history + fixtures — it
  refuses to overwrite existing *manual* (`source.name == "manual"`) projection records; use
  `--dry-run` to preview without writing.
- Every dataset file carries a `source` metadata block (`name`, `retrieved_at`, optional `url`) for
  provenance; production projection coverage can legitimately be 0 early in a season before real
  performance data exists — this is expected, not a bug.

### Web app (`web/src/`)

- `services/dataset.ts` — imports the JSON dataset directly and exposes `loadSeasonDataset()`,
  team branding/colors, and Turkish-language formatting/translation helpers (position names, price
  formatting, date formatting).
- `services/optimizer.ts` — calls the wasm-compiled Rust optimizer (via `optimizer.worker.ts`, a Web
  Worker, since the search can be slow on real season data before it's rich with real match results)
  and adapts its result into the shape the `Optimizer` page renders.
- `services/matchPredictor.ts`, `services/highlightChecker.ts`, `services/nostradamusStorage.ts`,
  `services/rapidApiFootball.ts` — frontend-only prediction/display logic and a client for the same
  RapidAPI football data source the sync script uses.
- `pages/` — one component per route (Dashboard, Fixtures, MatchDetail, Nostradamus, Optimizer,
  Players, Rules, Teams); `components/` holds shared UI (Header, Footer, Pitch, MatchTicker, modals,
  Toast).

### Data sync (`scripts/`)

- `sync_fixtures_results.py` — pulls live/finished match results from the RapidAPI
  `free-api-live-football-data` endpoint (Süper Lig league id `71`) and merges them into
  `data/2026-27/fixtures.json`, matching teams via a Turkish-name-to-team-id map. Requires
  `RAPIDAPI_KEY`. Run by `.github/workflows/sync_match_data.yml` on a schedule around Süper Lig
  matchdays (Fri/Sat/Sun/Mon evenings), which validates the synced data (`sf data validate`) before
  rebuilding and redeploying the web app.

The canonical hosting is Firebase Hosting (deployed from the committed `dist/`, `firebase.json`'s
`public` dir). `.github/workflows/pages.yml` no longer builds/deploys the app itself — it only
publishes `gh-pages-redirect/index.html`, a static page pointing visitors at the Firebase URL, and
only runs when that page (or the workflow) changes. `sync_match_data.yml` still rebuilds and commits
`dist/` after a data sync so it stays in sync for Firebase deployment.

## Contribution norms (from CONTRIBUTING.md)

- Data contributions must use real, existing player/team IDs and preserve names as seen at the
  source — never invent players, prices, projections, or match performances.
  Include source/attribution for data changes and run the relevant `sf validate` command before
  submitting.
