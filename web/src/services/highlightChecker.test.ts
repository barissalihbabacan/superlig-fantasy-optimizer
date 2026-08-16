import { describe, it, expect } from 'vitest';
import { slugifyTeamName, checkHighlightAvailability } from './highlightChecker';
import { Fixture } from '../types';

describe('slugifyTeamName', () => {
  it('replaces Turkish characters with their ASCII equivalents', () => {
    expect(slugifyTeamName('Çaykur Rizespor')).toBe('caykur-rizespor');
    expect(slugifyTeamName('Gençlerbirliği')).toBe('genclerbirligi');
    expect(slugifyTeamName('Beşiktaş')).toBe('besiktas');
  });

  it('collapses whitespace and repeated hyphens', () => {
    expect(slugifyTeamName('  İstanbul   Başakşehir  ')).toBe('istanbul-basaksehir');
  });
});

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    id: 'fixture-x',
    round: 1,
    home_team_id: 'home-team',
    away_team_id: 'away-team',
    kickoff: '2026-08-16T18:00:00',
    status: 'scheduled',
    ...overrides,
  };
}

describe('checkHighlightAvailability', () => {
  it('marks an unplayed fixture as unavailable', () => {
    const result = checkHighlightAvailability(makeFixture({ status: 'scheduled' }), 'Galatasaray', 'Çorum FK');
    expect(result.status).toBe('unplayed');
    expect(result.isAvailable).toBe(false);
    expect(result.url).toBeNull();
  });

  it('marks a finished, unverified fixture as pending', () => {
    const result = checkHighlightAvailability(
      makeFixture({ id: 'not-in-verified-list', status: 'finished', score: { home: 1, away: 0 } }),
      'Galatasaray',
      'Çorum FK'
    );
    expect(result.status).toBe('pending');
    expect(result.isAvailable).toBe(false);
  });

  it('marks a finished fixture on the verified list as available with a direct URL', () => {
    const result = checkHighlightAvailability(
      makeFixture({ id: '2026-27-w01-01', round: 1, status: 'finished', score: { home: 2, away: 2 } }),
      'Galatasaray',
      'Çorum FK'
    );
    expect(result.status).toBe('available');
    expect(result.isAvailable).toBe(true);
    expect(result.url).toContain('galatasaray');
    expect(result.url).toContain('corum-fk');
  });

  it('prefers an explicit highlights_url over the derived one', () => {
    const result = checkHighlightAvailability(
      makeFixture({
        id: 'not-in-verified-list',
        status: 'finished',
        score: { home: 1, away: 0 },
        highlights_url: 'https://example.com/explicit-highlight',
      }),
      'Galatasaray',
      'Çorum FK'
    );
    expect(result.status).toBe('available');
    expect(result.url).toBe('https://example.com/explicit-highlight');
  });

  it('always provides a YouTube fallback search URL', () => {
    const result = checkHighlightAvailability(makeFixture(), 'Galatasaray', 'Çorum FK');
    expect(result.youtubeSearchUrl).toContain('youtube.com/results');
    expect(result.youtubeSearchUrl).toContain(encodeURIComponent('Galatasaray Çorum FK maç özeti beIN SPORTS'));
  });
});
