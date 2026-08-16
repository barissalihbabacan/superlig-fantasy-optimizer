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
  it('seeds round 1 with the permanent default predictions when storage is empty', () => {
    const all = loadAllPredictions();
    expect(all[1]).toEqual(DEFAULT_W1_PREDICTIONS);
  });

  it('reads back predictions that were previously saved', () => {
    saveWeeklyPredictions(2, { 'fixture-a': 'X' });
    const all = loadAllPredictions();
    expect(all[2]).toEqual({ 'fixture-a': 'X' });
    // round 1 defaults must survive alongside a newly saved round.
    expect(all[1]).toEqual(DEFAULT_W1_PREDICTIONS);
  });

  it('never returns an empty round 1, even if storage held an empty object for it', () => {
    localStorage.setItem('superlig_nostradamus_predictions_v3', JSON.stringify({ 1: {} }));
    const all = loadAllPredictions();
    expect(all[1]).toEqual(DEFAULT_W1_PREDICTIONS);
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
