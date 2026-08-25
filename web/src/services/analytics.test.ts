import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  trackEvent,
  trackTabChange,
  trackMatchDetailViewed,
  trackOptimizerRun,
  trackOptimizerReset,
  trackPredictionSaved,
  trackPredictionReset,
  trackThemeToggle,
} from './analytics';
import * as firebaseServices from './firebase';

describe('Analytics service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('runs trackEvent safely without errors when analytics is null or unsupported', async () => {
    vi.spyOn(firebaseServices, 'initAnalytics').mockResolvedValue(null);

    await expect(trackEvent('test_event', { key: 'value' })).resolves.toBeUndefined();
  });

  it('provides helpers for tabs, matches, optimizer, predictions and theme', () => {
    expect(() => trackTabChange('optimizer')).not.toThrow();
    expect(() =>
      trackMatchDetailViewed({
        fixtureId: '2026-27-w01-01',
        homeTeam: 'galatasaray',
        awayTeam: 'corum-fk',
        round: 1,
      })
    ).not.toThrow();
    expect(() =>
      trackOptimizerRun({
        formation: '3-5-2',
        budget: 10000,
        totalPoints: 65,
        captainName: 'Victor Osimhen',
      })
    ).not.toThrow();
    expect(() => trackOptimizerReset()).not.toThrow();
    expect(() =>
      trackPredictionSaved({
        round: 1,
        predictionCount: 9,
        totalMatches: 9,
      })
    ).not.toThrow();
    expect(() => trackPredictionReset({ round: 1 })).not.toThrow();
    expect(() => trackThemeToggle('dark')).not.toThrow();
  });
});
