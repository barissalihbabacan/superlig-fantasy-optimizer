/**
 * Free API Live Football Data (RapidAPI) Service
 * Official integration for legal, automated Süper Lig data fetching.
 * Provider: https://rapidapi.com/Creativesdev/api/free-api-live-football-data
 */

export interface RapidApiConfig {
  apiKey?: string;
  apiHost?: string;
}

const DEFAULT_API_HOST = 'free-api-live-football-data.p.rapidapi.com';

// Local storage key for optional user-provided API key
const RAPIDAPI_KEY_STORAGE = 'superlig_rapidapi_football_key';

export const getSavedRapidApiKey = (): string => {
  if (typeof window === 'undefined') return '';
  // Yalnızca kullanıcının kendi girdiği anahtar kullanılır. Bir build-time env
  // değişkeni (ör. VITE_RAPIDAPI_KEY) burada okunmaz: Vite bu tür değişkenleri
  // istemci bundle'ına düz metin olarak gömer, bu da paylaşılan/takım
  // anahtarının devtools/network sekmesinden herkes tarafından görülebilmesi
  // anlamına gelir.
  return localStorage.getItem(RAPIDAPI_KEY_STORAGE) || '';
};

export const saveRapidApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(RAPIDAPI_KEY_STORAGE, key.trim());
  }
};

/**
 * Generic fetcher for Free API Live Football Data
 */
export async function fetchFootballData<T = any>(
  endpoint: string,
  params: Record<string, string | number> = {},
  customApiKey?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  const apiKey = customApiKey || getSavedRapidApiKey();

  if (!apiKey) {
    return {
      success: false,
      error: 'RapidAPI Anahtarı bulunamadı. Lütfen ücretsiz RapidAPI anahtarınızı girin.',
    };
  }

  const query = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => query.append(k, String(v)));

  const url = `https://${DEFAULT_API_HOST}/${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': DEFAULT_API_HOST,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: 'Geçersiz RapidAPI Anahtarı veya kota aşıldı.' };
      }
      return { success: false, error: `API Hatası (${response.status}): ${response.statusText}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Ağ bağlantı hatası oluştu.' };
  }
}

// ==========================================
// 1. Livescores & Fixtures Endpoints
// ==========================================

export const SUPER_LIG_LEAGUE_ID = '71';

/**
 * Canlı Maçlar ve Canlı Skorlar (Get Livescores/Matches/Events)
 */
export async function getLiveScores(apiKey?: string) {
  return fetchFootballData('football-live-scores', {}, apiKey);
}

/**
 * Süper Lig Tüm Maçlar ve Fikstür (Get All Matches/Events by League ID)
 */
export async function getLeagueMatches(leagueId = SUPER_LIG_LEAGUE_ID, round?: number, apiKey?: string) {
  return fetchFootballData(
    'football-get-all-matches-by-league',
    { leagueid: leagueId, ...(round ? { round } : {}) },
    apiKey
  );
}

/**
 * Tarihe Göre Maçlar (Get Matches/Events by Date)
 */
export async function getMatchesByDate(dateStr: string, apiKey?: string) {
  return fetchFootballData('football-get-matches-by-date', { date: dateStr }, apiKey);
}

// ==========================================
// 2. Match Details, Events & Stats Endpoints
// ==========================================

/**
 * Maç Detayı (Get Match/Event Detail by Event ID)
 */
export async function getMatchDetail(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-match-detail', { eventid: eventId }, apiKey);
}

/**
 * Maç Olayları (Goller, Asistler, Kartlar) (Get Match/Event Events)
 */
export async function getMatchEvents(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-match-events', { matchid: eventId }, apiKey);
}

/**
 * Maç İstatistikleri (Get Match/Event All Stats by Event ID)
 */
export async function getMatchAllStats(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-match-all-stats', { eventid: eventId }, apiKey);
}

/**
 * Maç Özetleri (Get Match/Event Highlights by Event ID)
 */
export async function getMatchHighlights(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-match-highlights', { eventid: eventId }, apiKey);
}

/**
 * İlk 11 Kadroları (Get Lineup by Event ID)
 */
export async function getMatchLineups(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-match-lineups', { matchid: eventId }, apiKey);
}

/**
 * Head to Head Karşılaşmalar (Get Head to Head by Event ID)
 */
export async function getHeadToHead(eventId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-head-to-head', { eventid: eventId }, apiKey);
}

// ==========================================
// 3. Teams, Players & Standings Endpoints
// ==========================================

/**
 * Canlı Puan Durumu (Get Standing All by League ID)
 */
export async function getLeagueStandings(leagueId = SUPER_LIG_LEAGUE_ID, apiKey?: string) {
  return fetchFootballData('football-get-standing-all', { leagueid: leagueId }, apiKey);
}

/**
 * Takım Oyuncu Kadrosu (Get Players List All by Team ID)
 */
export async function getTeamPlayers(teamId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-players-list-all-by-team-id', { teamid: teamId }, apiKey);
}

/**
 * Oyuncu Detayı ve İstatistikleri (Get Player Detail by Player ID)
 */
export async function getPlayerDetail(playerId: string | number, apiKey?: string) {
  return fetchFootballData('football-get-player-detail', { playerid: playerId }, apiKey);
}

/**
 * Gol Krallığı / En Çok Gol Atanlar (Get Top Players by Goals)
 */
export async function getTopPlayersByGoals(leagueId = SUPER_LIG_LEAGUE_ID, apiKey?: string) {
  return fetchFootballData('football-get-top-players-by-goals', { leagueid: leagueId }, apiKey);
}

/**
 * Asist Krallığı (Get Top Players by Assists)
 */
export async function getTopPlayersByAssists(leagueId = SUPER_LIG_LEAGUE_ID, apiKey?: string) {
  return fetchFootballData('football-get-top-players-by-assists', { leagueid: leagueId }, apiKey);
}

/**
 * En Yüksek Reytingli Oyuncular (Get Top Players by Rating)
 */
export async function getTopPlayersByRating(leagueId = SUPER_LIG_LEAGUE_ID, apiKey?: string) {
  return fetchFootballData('football-get-top-players-by-rating', { leagueid: leagueId }, apiKey);
}

/**
 * Transferler (Get Transfers by League ID)
 */
export async function getLeagueTransfers(leagueId = SUPER_LIG_LEAGUE_ID, apiKey?: string) {
  return fetchFootballData('football-get-transfers-by-league-id', { leagueid: leagueId }, apiKey);
}
