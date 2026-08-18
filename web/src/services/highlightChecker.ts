import { Fixture } from '../types';

// Slugifier for Turkish team names matching beIN SPORTS URL structure
export const slugifyTeamName = (teamName: string): string => {
  return teamName
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

/**
 * Generates canonical beIN SPORTS match highlight URL template based on match details
 * Example: https://beinsports.com.tr/mac-ozetleri-goller/super-lig/ozet/2026-2027/1/genclerbirligi-2-1-fenerbahce-mac-ozeti
 */
export const generateBeinHighlightUrl = (
  round: number,
  homeName: string,
  awayName: string,
  homeScore: number,
  awayScore: number,
  season: string = '2026-2027'
): string => {
  const normalizedSeason = season.includes('/')
    ? season.replace('/', '-')
    : season.length === 7 && season.includes('-')
      ? `${season.split('-')[0]}-20${season.split('-')[1]}`
      : season;

  const homeSlug = slugifyTeamName(homeName);
  const awaySlug = slugifyTeamName(awayName);

  return `https://beinsports.com.tr/mac-ozetleri-goller/super-lig/ozet/${normalizedSeason}/${round}/${homeSlug}-${homeScore}-${awayScore}-${awaySlug}-mac-ozeti`;
};

export interface HighlightCheckResult {
  isAvailable: boolean;
  status: 'available' | 'pending' | 'unplayed';
  url: string | null;
  youtubeSearchUrl: string;
}

/**
 * Automatically inspects and dynamically resolves highlight availability and canonical URL for any match
 */
export const checkHighlightAvailability = (
  fixture: Fixture,
  homeName: string,
  awayName: string,
  season: string = '2026-2027'
): HighlightCheckResult => {
  const isFinished = fixture.status === 'finished';
  const hasScore = fixture.score !== undefined && fixture.score !== null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${homeName} ${awayName} maç özeti beIN SPORTS`
  )}`;

  // If the match is not finished yet, highlights are unplayed
  if (!isFinished || !hasScore || !fixture.score) {
    return {
      isAvailable: false,
      status: 'unplayed',
      url: null,
      youtubeSearchUrl,
    };
  }

  // Generate canonical direct URL dynamically with fallback to explicit URL
  const directUrl =
    fixture.highlights_url ||
    generateBeinHighlightUrl(
      fixture.round,
      homeName,
      awayName,
      fixture.score.home,
      fixture.score.away,
      season
    );

  return {
    isAvailable: true,
    status: 'available',
    url: directUrl,
    youtubeSearchUrl,
  };
};
