import { describe, it, expect } from 'vitest';
import { slugifyTeamName, generateBeinHighlightUrl, checkHighlightAvailability } from './highlightChecker';
import { Fixture } from '../types';

describe('slugifyTeamName', () => {
  it('replaces Turkish characters with their ASCII equivalents', () => {
    expect(slugifyTeamName('Çaykur Rizespor')).toBe('caykur-rizespor');
    expect(slugifyTeamName('Gençlerbirliği')).toBe('genclerbirligi');
    expect(slugifyTeamName('Beşiktaş')).toBe('besiktas');
    expect(slugifyTeamName('Fenerbahçe')).toBe('fenerbahce');
  });

  it('collapses whitespace and repeated hyphens', () => {
    expect(slugifyTeamName('  İstanbul   Başakşehir  ')).toBe('istanbul-basaksehir');
  });
});

describe('generateBeinHighlightUrl', () => {
  it('generates canonical beIN SPORTS highlight URL for Gençlerbirliği vs Fenerbahçe', () => {
    const url = generateBeinHighlightUrl(1, 'Gençlerbirliği', 'Fenerbahçe', 2, 1, '2026-27');
    expect(url).toBe(
      'https://beinsports.com.tr/mac-ozetleri-goller/super-lig/ozet/2026-2027/1/genclerbirligi-2-1-fenerbahce-mac-ozeti'
    );
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

  it('dynamically generates beIN SPORTS URL for any finished match', () => {
    const result = checkHighlightAvailability(
      makeFixture({ id: '2026-27-w01-04', round: 1, status: 'finished', score: { home: 2, away: 1 } }),
      'Gençlerbirliği',
      'Fenerbahçe'
    );
    expect(result.status).toBe('available');
    expect(result.isAvailable).toBe(true);
    expect(result.url).toBe(
      'https://beinsports.com.tr/mac-ozetleri-goller/super-lig/ozet/2026-2027/1/genclerbirligi-2-1-fenerbahce-mac-ozeti'
    );
  });

  it('prefers explicit highlights_url if specified', () => {
    const result = checkHighlightAvailability(
      makeFixture({
        id: 'explicit-test',
        status: 'finished',
        score: { home: 1, away: 0 },
        highlights_url: 'https://example.com/custom-highlight',
      }),
      'Galatasaray',
      'Çorum FK'
    );
    expect(result.status).toBe('available');
    expect(result.url).toBe('https://example.com/custom-highlight');
  });

  it('always provides a YouTube fallback search URL', () => {
    const result = checkHighlightAvailability(makeFixture(), 'Galatasaray', 'Çorum FK');
    expect(result.youtubeSearchUrl).toContain('youtube.com/results');
    expect(result.youtubeSearchUrl).toContain(encodeURIComponent('Galatasaray Çorum FK maç özeti beIN SPORTS'));
  });
});
