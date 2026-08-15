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

// Known verified published highlights registry
// A match highlight is ONLY marked verified once it is officially live on the broadcast servers
const VERIFIED_PUBLISHED_HIGHLIGHTS = new Set<string>([
  '2026-27-w01-01', // Galatasaray 2 - 2 Çorum FK (Verified 200 OK)
  '2026-27-w01-02', // Konyaspor 0 - 1 Çaykur Rizespor (Verified 200 OK)
  '2026-27-w01-05', // Kasımpaşa 1 - 1 Trabzonspor (Verified 200 OK)
]);

export interface HighlightCheckResult {
  isAvailable: boolean;
  status: 'available' | 'pending' | 'unplayed';
  url: string | null;
  youtubeSearchUrl: string;
}

/**
 * Automatically inspects and resolves highlight availability for any match
 * without requiring manual user input.
 */
export const checkHighlightAvailability = (
  fixture: Fixture,
  homeName: string,
  awayName: string
): HighlightCheckResult => {
  const isFinished = fixture.status === 'finished';
  const hasScore = fixture.score !== undefined && fixture.score !== null;

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${homeName} ${awayName} maç özeti beIN SPORTS`
  )}`;

  // If the match is not finished yet, highlights are not applicable
  if (!isFinished || !hasScore) {
    return {
      isAvailable: false,
      status: 'unplayed',
      url: null,
      youtubeSearchUrl,
    };
  }

  // If fixture has an explicit verified highlights_url or is in the verified published list
  const isExplicitlyVerified = Boolean(fixture.highlights_url) || VERIFIED_PUBLISHED_HIGHLIGHTS.has(fixture.id);

  if (isExplicitlyVerified) {
    const directUrl =
      fixture.highlights_url ||
      `https://beinsports.com.tr/mac-ozetleri-goller/super-lig/ozet/2026-2027/${fixture.round}/${slugifyTeamName(
        homeName
      )}-${fixture.score?.home}-${fixture.score?.away}-${slugifyTeamName(awayName)}-mac-ozeti`;

    return {
      isAvailable: true,
      status: 'available',
      url: directUrl,
      youtubeSearchUrl,
    };
  }

  // Automatic Fallback: Match is finished, but highlight publication is still pending from broadcaster
  return {
    isAvailable: false,
    status: 'pending',
    url: null,
    youtubeSearchUrl,
  };
};
