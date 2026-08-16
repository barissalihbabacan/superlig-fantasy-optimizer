/**
 * Server-side proxy for the "Free API Live Football Data" RapidAPI endpoint
 * (https://rapidapi.com/Creativesdev/api/free-api-live-football-data).
 *
 * The frontend used to call RapidAPI directly from the browser, which meant
 * whichever key was in play (a user's own, or previously a build-time env
 * var) was visible in devtools/network. This function keeps a shared key in
 * Secret Manager and never sends it to the client; a user who supplies their
 * own key (still supported, for people who want their personal quota instead
 * of the shared one) has it forwarded per-request rather than stored here.
 */
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import logger from 'firebase-functions/logger';

const rapidApiKey = defineSecret('RAPIDAPI_KEY');

const API_HOST = 'free-api-live-football-data.p.rapidapi.com';

// Only these endpoints are ever forwarded — this proxy must not become an
// open relay for arbitrary RapidAPI hosts/paths.
const ALLOWED_ENDPOINTS = new Set([
  'football-live-scores',
  'football-get-all-matches-by-league',
  'football-get-matches-by-date',
  'football-get-match-detail',
  'football-get-match-events',
  'football-get-match-all-stats',
  'football-get-match-highlights',
  'football-get-match-lineups',
  'football-get-head-to-head',
  'football-get-standing-all',
  'football-get-players-list-all-by-team-id',
  'football-get-player-detail',
  'football-get-top-players-by-goals',
  'football-get-top-players-by-assists',
  'football-get-top-players-by-rating',
  'football-get-transfers-by-league-id',
]);

// Restrict who can call this proxy so a stranger's site can't quietly burn
// through the shared plan's monthly quota. Add custom domains here if the
// project gets one.
const ALLOWED_ORIGINS = new Set([
  'https://superlig-fantasy-optimizer.web.app',
  'https://superlig-fantasy-optimizer.firebaseapp.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

export const footballProxy = onRequest(
  { secrets: [rapidApiKey], cors: false, region: 'us-central1' },
  async (req, res) => {
    const origin = req.get('origin');
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
      res.set('Vary', 'Origin');
    }
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-user-rapidapi-key');

    if (req.method === 'OPTIONS') {
      res.status(204).send('');
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ success: false, error: 'Yalnızca GET istekleri desteklenir.' });
      return;
    }

    // Path looks like /footballProxy/football-live-scores or, behind the
    // Hosting rewrite, /api/football/football-live-scores.
    const segments = req.path.split('/').filter(Boolean);
    const endpoint = segments[segments.length - 1];

    if (!endpoint || !ALLOWED_ENDPOINTS.has(endpoint)) {
      res.status(404).json({ success: false, error: `Bilinmeyen veya izin verilmeyen uç nokta: ${endpoint}` });
      return;
    }

    const userKey = req.get('x-user-rapidapi-key');
    const key = userKey || rapidApiKey.value();
    if (!key) {
      res.status(500).json({ success: false, error: 'Sunucuda RapidAPI anahtarı yapılandırılmamış.' });
      return;
    }

    const query = new URLSearchParams();
    for (const [param, value] of Object.entries(req.query)) {
      if (typeof value === 'string') query.append(param, value);
    }

    const url = `https://${API_HOST}/${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;

    try {
      const upstream = await fetch(url, {
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': API_HOST,
        },
      });

      const body = await upstream.text();

      if (!upstream.ok) {
        logger.warn('RapidAPI upstream error', { endpoint, status: upstream.status });
        res.status(upstream.status).json({
          success: false,
          error:
            upstream.status === 401 || upstream.status === 403
              ? 'Geçersiz RapidAPI anahtarı veya kota aşıldı.'
              : `API Hatası (${upstream.status})`,
        });
        return;
      }

      // Short, shared CDN cache: identical requests within this window reuse
      // one upstream call instead of costing quota per visitor.
      res.set('Cache-Control', 'public, max-age=60, s-maxage=60');
      res.set('Content-Type', 'application/json');
      res.status(200).send(body);
    } catch (error) {
      logger.error('RapidAPI proxy request failed', { endpoint, error: String(error) });
      res.status(502).json({ success: false, error: 'Ağ bağlantı hatası oluştu.' });
    }
  }
);
