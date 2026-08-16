/**
 * Shared RapidAPI GET helper for the "Free API Live Football Data" product,
 * used by both `footballProxy` (on-demand, browser-triggered) and
 * `liveGoalPoller` (scheduled). Centralizes the Secret Manager key and a
 * monthly-quota guard, since both callers draw from the same RapidAPI plan
 * (100 requests/month) that `scripts/sync_fixtures_results.py`'s GitHub
 * Actions cron already spends ~50/month of on its own (untracked here, since
 * it never touches Firestore) — so this guard caps *this* codebase's share
 * well under the remainder, rather than the full 100.
 */
import { defineSecret } from 'firebase-functions/params';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

export const rapidApiKey = defineSecret('RAPIDAPI_KEY');

export const API_HOST = 'free-api-live-football-data.p.rapidapi.com';
export const SUPER_LIG_LEAGUE_ID = '71';

// Leaves headroom under the shared 100/month plan for
// scripts/sync_fixtures_results.py's own ~50/month cron usage, which this
// counter has no visibility into.
const MONTHLY_CAP = 45;

function currentMonthKey(now: Date): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * Atomically reserves one unit of this month's shared-quota budget. Returns
 * false (without incrementing) once MONTHLY_CAP is reached.
 */
async function reserveSharedQuota(db: Firestore): Promise<boolean> {
  const ref = db.collection('quotaUsage').doc(currentMonthKey(new Date()));
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const used = (snap.data()?.count as number | undefined) ?? 0;
    if (used >= MONTHLY_CAP) return false;
    tx.set(ref, { count: used + 1, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return true;
  });
}

export type RapidApiResult =
  | { ok: true; status: number; body: string }
  | { ok: false; status?: number; error: string };

/**
 * Calls a RapidAPI endpoint. When `userSuppliedKey` is absent, the request
 * uses the shared server-side key and counts against MONTHLY_CAP (pass `db`
 * to enforce this); a caller-supplied key burns that caller's own separate
 * quota instead and is never throttled here.
 */
export async function fetchRapidApi(
  endpoint: string,
  params: Record<string, string | number>,
  opts: { userSuppliedKey?: string; db?: Firestore } = {}
): Promise<RapidApiResult> {
  const key = opts.userSuppliedKey || rapidApiKey.value();
  if (!key) {
    return { ok: false, error: 'Sunucuda RapidAPI anahtarı yapılandırılmamış.' };
  }

  if (!opts.userSuppliedKey && opts.db) {
    const reserved = await reserveSharedQuota(opts.db);
    if (!reserved) {
      return { ok: false, error: 'Paylaşımlı RapidAPI aylık kotası bu ay için doldu.' };
    }
  }

  const query = new URLSearchParams();
  for (const [param, value] of Object.entries(params)) {
    query.append(param, String(value));
  }
  const url = `https://${API_HOST}/${endpoint}${query.toString() ? `?${query.toString()}` : ''}`;

  try {
    const upstream = await fetch(url, {
      headers: { 'x-rapidapi-key': key, 'x-rapidapi-host': API_HOST },
    });
    const body = await upstream.text();
    if (!upstream.ok) {
      return { ok: false, status: upstream.status, error: `API Hatası (${upstream.status})` };
    }
    return { ok: true, status: upstream.status, body };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
