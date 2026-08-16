import { describe, it, expect } from 'vitest';
import { calculateMatchProbabilities } from './matchPredictor';
import { Fixture, Player, Team } from '../types';

const teams: Team[] = [
  { id: 'home-team', name: 'Home FC' },
  { id: 'away-team', name: 'Away FC' },
];

function makePlayers(teamId: string, prices: number[]): Player[] {
  return prices.map((price, index) => ({
    id: `${teamId}-${index}`,
    name: `${teamId} Player ${index}`,
    team_id: teamId,
    position: 'Midfielder',
    price,
  }));
}

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'test-fixture',
    round: 1,
    home_team_id: 'home-team',
    away_team_id: 'away-team',
    kickoff: '2026-08-16T18:00:00',
    status: 'scheduled',
    ...overrides,
  };
}

describe('calculateMatchProbabilities', () => {
  it('always returns probabilities that sum to exactly 100', () => {
    const players = [...makePlayers('home-team', [500, 400, 300]), ...makePlayers('away-team', [500, 400, 300])];
    const result = calculateMatchProbabilities(makeFixture(), players, teams);
    expect(result.homeWinProb + result.drawProb + result.awayWinProb).toBe(100);
  });

  it('favors the stronger squad and applies a home-field advantage on ties', () => {
    const evenPlayers = [...makePlayers('home-team', [500, 500]), ...makePlayers('away-team', [500, 500])];
    const evenResult = calculateMatchProbabilities(makeFixture(), evenPlayers, teams);
    // Equal squad values: home advantage should tip the balance toward the home side.
    expect(evenResult.homeWinProb).toBeGreaterThan(evenResult.awayWinProb);
    expect(evenResult.suggestedPick).toBe('1');

    const strongerAway = [...makePlayers('home-team', [100, 100]), ...makePlayers('away-team', [900, 900, 900])];
    const strongerAwayResult = calculateMatchProbabilities(makeFixture(), strongerAway, teams);
    expect(strongerAwayResult.awayWinProb).toBeGreaterThan(strongerAwayResult.homeWinProb);
    expect(strongerAwayResult.suggestedPick).toBe('2');
  });

  it('keeps every probability within the enforced realistic bounds', () => {
    const lopsided = [...makePlayers('home-team', [10]), ...makePlayers('away-team', [10000, 9000, 8000])];
    const result = calculateMatchProbabilities(makeFixture(), lopsided, teams);
    expect(result.homeWinProb).toBeGreaterThanOrEqual(12);
    expect(result.awayWinProb).toBeLessThanOrEqual(78);
  });

  it('falls back to a baseline power value when a team has no priced players', () => {
    const onlyAwayPlayers = makePlayers('away-team', [500, 500]);
    // home-team has zero matching players -> its power falls back to the 50000 baseline
    const result = calculateMatchProbabilities(makeFixture(), onlyAwayPlayers, teams);
    expect(result.homeWinProb + result.drawProb + result.awayWinProb).toBe(100);
    expect(Number.isFinite(result.homeWinProb)).toBe(true);
  });

  it('labels the suggested pick with the real team name', () => {
    const players = [...makePlayers('home-team', [900, 900]), ...makePlayers('away-team', [100, 100])];
    const result = calculateMatchProbabilities(makeFixture(), players, teams);
    expect(result.suggestedLabel).toContain('Home FC');
  });
});
