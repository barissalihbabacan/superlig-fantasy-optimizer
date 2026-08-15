import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import init, { optimizeSquad } from '../../wasm-pkg/sfo_wasm.js';
import { Player } from '../types';

// wasm-pack `--target web` output normally fetches its .wasm via `import.meta.url`.
// Under Vitest (Node), `fetch()` on a `file://` URL isn't reliable, so we init it
// directly from bytes read off disk instead — the standard workaround for testing
// `--target web` builds outside a browser.
beforeAll(async () => {
  const wasmUrl = new URL('../../wasm-pkg/sfo_wasm_bg.wasm', import.meta.url);
  const bytes = readFileSync(fileURLToPath(wasmUrl));
  await init(bytes);
});

interface FixturePlayer extends Player {
  points: number;
}

// Each player gets a distinct team_id so the "max 3 per team" constraint never
// interferes — this fixture is only about budget/score trade-offs.
const PLAYERS: FixturePlayer[] = [
  { id: 'gk1', name: 'GK1', team_id: 't1', position: 'Goalkeeper', price: 50, points: 4.0 },
  { id: 'gk2', name: 'GK2', team_id: 't2', position: 'Goalkeeper', price: 40, points: 5.0 },
  { id: 'gk3', name: 'GK3', team_id: 't3', position: 'Goalkeeper', price: 30, points: 1.0 },
  { id: 'def1', name: 'DEF1', team_id: 't4', position: 'Defender', price: 50, points: 6.0 },
  { id: 'def2', name: 'DEF2', team_id: 't5', position: 'Defender', price: 45, points: 5.5 },
  { id: 'def3', name: 'DEF3', team_id: 't6', position: 'Defender', price: 40, points: 5.0 },
  { id: 'def4', name: 'DEF4', team_id: 't7', position: 'Defender', price: 35, points: 4.5 },
  { id: 'def5', name: 'DEF5', team_id: 't8', position: 'Defender', price: 30, points: 4.0 },
  { id: 'def6', name: 'DEF6', team_id: 't9', position: 'Defender', price: 10, points: 0.5 },
  { id: 'mid1', name: 'MID1', team_id: 't10', position: 'Midfielder', price: 60, points: 7.0 },
  { id: 'mid2', name: 'MID2', team_id: 't11', position: 'Midfielder', price: 55, points: 6.5 },
  { id: 'mid3', name: 'MID3', team_id: 't12', position: 'Midfielder', price: 50, points: 6.0 },
  { id: 'mid4', name: 'MID4', team_id: 't13', position: 'Midfielder', price: 45, points: 5.5 },
  { id: 'mid5', name: 'MID5', team_id: 't14', position: 'Midfielder', price: 40, points: 5.0 },
  { id: 'mid6', name: 'MID6', team_id: 't15', position: 'Midfielder', price: 10, points: 0.5 },
  { id: 'fwd1', name: 'FWD1', team_id: 't16', position: 'Forward', price: 70, points: 8.0 },
  { id: 'fwd2', name: 'FWD2', team_id: 't17', position: 'Forward', price: 60, points: 7.0 },
  { id: 'fwd3', name: 'FWD3', team_id: 't18', position: 'Forward', price: 50, points: 6.0 },
  { id: 'fwd4', name: 'FWD4', team_id: 't19', position: 'Forward', price: 10, points: 0.5 },
];

const PROJECTIONS = PLAYERS.map((player) => ({
  player_id: player.id,
  expected_points: player.points,
}));

const PLAYER_INPUT = PLAYERS.map(({ id, name, team_id, position, price }) => ({
  id,
  name,
  team_id,
  position,
  price,
}));

interface WasmResult {
  total_cost: number;
  remaining_budget: number;
  expected_points: number;
  captain: string;
  vice_captain: string;
  lineup: { player_id: string }[];
  bench: { player_id: string }[];
}

function squadIds(result: WasmResult): string[] {
  return [...result.lineup, ...result.bench].map((p) => p.player_id).sort();
}

describe('optimizeSquad (wasm)', () => {
  it('minimizes squad cost for bench-only slots instead of picking the next-highest scorer', () => {
    // The naive "top scorer per position" squad costs 720 (keeping gk1 over
    // gk3, def5 over def6, mid4 over mid6 as bench). Since bench players'
    // scores never count toward expected_points, the true optimum instead
    // fills every bench-only slot with the cheapest available candidate,
    // landing at 645 — well under an unconstrained-ish 700 budget — with the
    // *same* lineup expected_points (66.5, captain_multiplier=1 keeps this a
    // plain sum, no captain bonus).
    const result = optimizeSquad(PLAYER_INPUT, PROJECTIONS, 700, '4-3-3', 3, 1) as WasmResult;

    expect(result.total_cost).toBe(645);
    expect(result.remaining_budget).toBe(55);
    expect(result.expected_points).toBeCloseTo(66.5, 5);
    expect(result.captain).toBe('fwd1');
    expect(result.vice_captain).toBe('fwd2'); // ties with mid1 at 7.0; price+id tiebreak picks fwd2
    expect(squadIds(result)).toEqual(
      ['def1', 'def2', 'def3', 'def4', 'def6', 'fwd1', 'fwd2', 'fwd3', 'gk2', 'gk3', 'mid1', 'mid2', 'mid3', 'mid5', 'mid6'].sort()
    );
  });

  it('trades lineup score for cost once the budget is actually below the natural optimum', () => {
    // Below the natural 645, the search must sacrifice score too: it drops
    // fwd3 for the much cheaper fwd4 and mid3 for mid4 to land exactly on
    // budget, rather than failing or (like the old client-side heuristic)
    // silently overspending.
    const result = optimizeSquad(PLAYER_INPUT, PROJECTIONS, 600, '4-3-3', 3, 1) as WasmResult;

    expect(result.total_cost).toBe(600);
    expect(result.remaining_budget).toBe(0);
    expect(result.expected_points).toBeCloseTo(60.5, 5);
    expect(squadIds(result)).toEqual(
      ['def1', 'def2', 'def3', 'def4', 'def6', 'fwd1', 'fwd2', 'fwd4', 'gk2', 'gk3', 'mid1', 'mid2', 'mid4', 'mid5', 'mid6'].sort()
    );
  });
});
