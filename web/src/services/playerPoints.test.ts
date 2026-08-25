import { describe, it, expect } from 'vitest';
import { calculateMatchPoints, calculateAllPlayerStats } from './playerPoints';
import { Player, Fixture } from '../types';

describe('playerPoints service', () => {
  it('calculates clean sheet points for defender correctly on 2-0 win', () => {
    // Defender, Home, 2-0 win -> 2 (played) + 4 (clean sheet) + 1 (won) + 1 (2 team goals) = 8 pts
    const result = calculateMatchPoints('Defender', true, 2, 0);
    expect(result.points).toBe(8);
    expect(result.cleanSheet).toBe(true);
    expect(result.won).toBe(true);
  });

  it('calculates points for goalkeeper on 0-2 loss', () => {
    // Goalkeeper, Home, 0-2 loss -> 2 (played) - 1 (2 conceded) = 1 pt
    const result = calculateMatchPoints('Goalkeeper', true, 0, 2);
    expect(result.points).toBe(1);
    expect(result.cleanSheet).toBe(false);
    expect(result.won).toBe(false);
  });

  it('calculates forward points on 3-1 win', () => {
    // Forward, Away, 1-3 win (Away team scored 3, home scored 1) -> 2 (played) + 1 (won) + 6 (3 team goals) = 9 pts
    const result = calculateMatchPoints('Forward', false, 1, 3);
    expect(result.points).toBe(9);
    expect(result.won).toBe(true);
  });

  it('aggregates finished matches across multiple rounds for players', () => {
    const mockPlayers: Player[] = [
      { id: 'muslera', name: 'Muslera', team_id: 'galatasaray', position: 'Goalkeeper', price: 1000 },
      { id: 'icardi', name: 'Icardi', team_id: 'galatasaray', position: 'Forward', price: 1300 },
    ];

    const mockFixtures: Fixture[] = [
      {
        id: 'f1',
        round: 1,
        home_team_id: 'galatasaray',
        away_team_id: 'corum-fk',
        kickoff: '2026-08-14T21:30:00+03:00',
        status: 'finished',
        score: { home: 2, away: 0 },
      },
      {
        id: 'f2',
        round: 2,
        home_team_id: 'fenerbahce',
        away_team_id: 'galatasaray',
        kickoff: '2026-08-21T21:30:00+03:00',
        status: 'scheduled',
      },
    ];

    const stats = calculateAllPlayerStats(mockPlayers, mockFixtures);
    const musleraStats = stats.get('muslera');
    expect(musleraStats).toBeDefined();
    expect(musleraStats?.matchesPlayed).toBe(1);
    expect(musleraStats?.cleanSheets).toBe(1);
    expect(musleraStats?.totalPoints).toBeGreaterThan(0);
    expect(musleraStats?.matchHistory.length).toBe(1);
  });
});
