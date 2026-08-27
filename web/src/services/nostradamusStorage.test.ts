// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadAllPredictions,
  saveWeeklyPredictions,
  loadMatchResultsOverrides,
  saveMatchResultsOverride,
  DEFAULT_W1_PREDICTIONS,
} from './nostradamusStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('loadAllPredictions', () => {
  it('does not inject any predictions for a brand-new user (BULGU 2)', () => {
    const all = loadAllPredictions();
    expect(all[1]).toBeUndefined();
  });

  it('reads back predictions that were previously saved', () => {
    saveWeeklyPredictions(2, { 'fixture-a': 'X' });
    const all = loadAllPredictions();
    expect(all[2]).toEqual({ 'fixture-a': 'X' });
  });

  it('migrates away a round-1 prediction set that exactly matches the old auto-injected default', () => {
    localStorage.setItem(
      'superlig_nostradamus_predictions_v3',
      JSON.stringify({ 1: DEFAULT_W1_PREDICTIONS })
    );
    const all = loadAllPredictions();
    expect(all[1]).toBeUndefined();
  });

  it('preserves a real user\'s own round-1 picks even when they only differ from the old default on one fixture', () => {
    const ownPicks = { ...DEFAULT_W1_PREDICTIONS, '2026-27-w01-01': '2' as const };
    localStorage.setItem('superlig_nostradamus_predictions_v3', JSON.stringify({ 1: ownPicks }));
    const all = loadAllPredictions();
    expect(all[1]).toEqual(ownPicks);
  });

  it('preserves a real user\'s own, smaller round-1 coupon untouched', () => {
    const ownPicks = { '2026-27-w01-03': 'X' as const };
    localStorage.setItem('superlig_nostradamus_predictions_v3', JSON.stringify({ 1: ownPicks }));
    const all = loadAllPredictions();
    expect(all[1]).toEqual(ownPicks);
  });
});

describe('saveWeeklyPredictions', () => {
  it('overwrites only the targeted round', () => {
    saveWeeklyPredictions(1, { 'fixture-b': '2' });
    const all = loadAllPredictions();
    expect(all[1]).toEqual({ 'fixture-b': '2' });
  });
});

describe('loadMatchResultsOverrides', () => {
  it('returns the built-in defaults when storage is empty', () => {
    const results = loadMatchResultsOverrides();
    expect(results['2026-27-w01-01']).toEqual({ status: 'finished', score: { home: 2, away: 2 } });
  });

  it('merges a saved override on top of the defaults rather than replacing them', () => {
    saveMatchResultsOverride('2026-27-w01-09', { status: 'finished', score: { home: 3, away: 0 } });
    const results = loadMatchResultsOverrides();
    expect(results['2026-27-w01-09']).toEqual({ status: 'finished', score: { home: 3, away: 0 } });
    // an unrelated default entry must still be present.
    expect(results['2026-27-w01-01']).toEqual({ status: 'finished', score: { home: 2, away: 2 } });
  });
});
