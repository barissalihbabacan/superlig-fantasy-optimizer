import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import init, { calculatePlayerMatchScore } from '../../wasm-pkg/sfo_wasm.js';
import {
  computeRealizedStats,
  computeMatchPlayerEvents,
  getMatchDataCoverage,
  MatchDataset,
  ScoreFn,
} from './realizedPoints';
import rawPlayers from '../../../data/2026-27/players.json';
import rawFixtures from '../../../data/2026-27/fixtures.json';
import rawMatch from '../../../data/2026-27/matches/2026-27-w01-01.json';
import { Player, Fixture } from '../types';

// Aynı `--target web` init workaround'u optimizerWasm.test.ts'de kullanılıyor:
// Vitest (Node) altında dosyadan byte okuyup doğrudan init ediyoruz.
beforeAll(async () => {
  const wasmUrl = new URL('../../wasm-pkg/sfo_wasm_bg.wasm', import.meta.url);
  const bytes = readFileSync(fileURLToPath(wasmUrl));
  await init(bytes);
});

const players = rawPlayers.players as unknown as Player[];
const fixtures = rawFixtures.fixtures as unknown as Fixture[];
const matches = [rawMatch as unknown as MatchDataset];
const scoreFn = calculatePlayerMatchScore as unknown as ScoreFn;

describe('realizedPoints (real dataset, real WASM scoring engine — no reimplemented rules)', () => {
  it('matches the Rust CLI-verified score for a 2-goal, bonus_rank=1 forward (13 pts)', () => {
    const stats = computeRealizedStats(players, fixtures, matches, scoreFn);
    const osimhen = stats.get('victor-james-osimhen');
    expect(osimhen?.matchesWithData).toBe(1);
    expect(osimhen?.totalPoints).toBe(13);
  });

  it('matches the Rust CLI-verified score for a 90-minute, single-yellow-card midfielder (1 pt)', () => {
    const stats = computeRealizedStats(players, fixtures, matches, scoreFn);
    const yunus = stats.get('yunus-akgun');
    expect(yunus?.matchesWithData).toBe(1);
    expect(yunus?.totalPoints).toBe(1);
  });

  it('never fabricates points for a player whose match has no player-level data file', () => {
    const stats = computeRealizedStats(players, fixtures, matches, scoreFn);
    // Fenerbahçe's round-2 fixture is "finished" in fixtures.json but has no
    // matches/2026-27-w02-*.json file in this fixture set — a Forward there
    // must show zero *data*, not a fabricated team-goal-based estimate.
    const fbForward = players.find((p) => p.team_id === 'fenerbahce' && p.position === 'Forward');
    expect(fbForward).toBeDefined();
    const stat = stats.get(fbForward!.id);
    expect(stat?.matchesWithData ?? 0).toBe(0);
    expect(stat?.totalPoints ?? 0).toBe(0);
  });

  it('ignores a same-id player fielded by the wrong team (data-integrity guard)', () => {
    const corrupted: MatchDataset = {
      ...matches[0],
      players: [{ ...matches[0].players[0], player_id: 'victor-james-osimhen', team_id: 'corum-fk' }],
    };
    const stats = computeRealizedStats(players, fixtures, [corrupted], scoreFn);
    expect(stats.get('victor-james-osimhen')?.matchesWithData ?? 0).toBe(0);
  });

  it('exposes the real coverage gap instead of hiding it: most finished fixtures lack player data', () => {
    const coverage = getMatchDataCoverage(fixtures, matches);
    expect(coverage.finishedFixtures).toBeGreaterThan(1);
    expect(coverage.fixturesWithPlayerData).toBe(1);
    expect(coverage.missingFixtureIds).not.toContain('2026-27-w01-01');
    expect(coverage.missingFixtureIds.length).toBe(coverage.finishedFixtures - 1);
  });
});

describe('computeMatchPlayerEvents (single-match real events for MatchDetail — no fabrication)', () => {
  it('returns real per-player events for the one match that has a data file, with WASM-scored points', () => {
    const events = computeMatchPlayerEvents('2026-27-w01-01', players, matches, scoreFn);
    expect(events).not.toBeNull();

    const osimhen = events!.find((event) => event.playerId === 'victor-james-osimhen');
    expect(osimhen).toBeDefined();
    expect(osimhen!.goals).toBe(2);
    expect(osimhen!.points).toBe(13);

    const sane = events!.find((event) => event.playerId === 'leroy-aziz-sane');
    expect(sane!.assists).toBe(1);

    // Real data has no "Gabriel Sara assisted" event and no Kyziridis entry at
    // all — asserting their absence guards against reintroducing the
    // hand-authored fabricated goalscorer timeline that used to claim both.
    const gabrielSara = events!.find((event) => event.playerId === 'gabriel-davi-gomes-sara');
    expect(gabrielSara!.assists).toBe(0);
    expect(events!.find((event) => event.playerId === 'alexandros-kyziridis')).toBeUndefined();
  });

  it('returns null (not a fabricated fallback) for a finished fixture with no player-level data file', () => {
    // Round 1's Konyaspor vs Rizespor fixture is "finished" in fixtures.json
    // but has no matches/2026-27-w01-02.json file in this fixture set.
    const events = computeMatchPlayerEvents('2026-27-w01-02', players, matches, scoreFn);
    expect(events).toBeNull();
  });

  it('returns null for a fixture that has not been played yet, even if a stray dataset existed for it', () => {
    const unplayed: MatchDataset = { ...matches[0], match_id: 'not-yet-played', status: 'scheduled' };
    const events = computeMatchPlayerEvents('not-yet-played', players, [unplayed], scoreFn);
    expect(events).toBeNull();
  });

  it('ignores a same-id player fielded by the wrong team (data-integrity guard)', () => {
    const corrupted: MatchDataset = {
      ...matches[0],
      players: [{ ...matches[0].players[0], player_id: 'victor-james-osimhen', team_id: 'corum-fk' }],
    };
    const events = computeMatchPlayerEvents('2026-27-w01-01', players, [corrupted], scoreFn);
    expect(events).not.toBeNull();
    expect(events!.find((event) => event.playerId === 'victor-james-osimhen')).toBeUndefined();
  });
});
