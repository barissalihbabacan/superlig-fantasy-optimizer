/**
 * Registers (or updates) a browser's FCM token and its followed-team list so
 * `liveGoalPoller` knows which live windows are worth spending quota on and
 * who to notify when a followed team scores. No auth exists in this app, so
 * subscriptions are keyed by token, not by user account.
 */
import { onRequest } from 'firebase-functions/v2/https';
import logger from 'firebase-functions/logger';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import teamsDataset from './data/teams.json' with { type: 'json' };

const ALLOWED_ORIGINS = new Set([
  'https://superlig-fantasy-optimizer.web.app',
  'https://superlig-fantasy-optimizer.firebaseapp.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

const KNOWN_TEAM_IDS = new Set((teamsDataset as { teams: { id: string }[] }).teams.map((t) => t.id));

/**
 * Rejects tokens that were never real push subscriptions. Without this, a
 * caller could POST made-up strings claiming to follow every team, which
 * doesn't let them send anything (notification content is always
 * server-generated), but would trick `liveGoalPoller` into treating every
 * match as worth polling — burning the shared RapidAPI quota faster than
 * intended. `dryRun: true` validates the token with FCM without sending.
 */
async function isValidFcmToken(token: string): Promise<boolean> {
  try {
    await getMessaging().send({ token, notification: { title: 'validate' } }, true);
    return true;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === 'messaging/invalid-registration-token' || code === 'messaging/registration-token-not-registered') {
      return false;
    }
    // Any other failure (network, quota, etc.) — don't block subscribing over
    // an unrelated transient error; let the write proceed.
    logger.warn('subscribeToGoalAlerts: token validation inconclusive, allowing', { error: String(error) });
    return true;
  }
}

export const subscribeToGoalAlerts = onRequest({ region: 'us-central1', cors: false }, async (req, res) => {
  const origin = req.get('origin');
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Yalnızca POST istekleri desteklenir.' });
    return;
  }

  const body = req.body ?? {};
  const token = body.token;
  const followedTeamIds = body.followedTeamIds;

  if (typeof token !== 'string' || !token.trim()) {
    res.status(400).json({ success: false, error: 'Geçersiz bildirim token\'ı.' });
    return;
  }
  if (
    !Array.isArray(followedTeamIds) ||
    !followedTeamIds.every((id) => typeof id === 'string' && KNOWN_TEAM_IDS.has(id))
  ) {
    res.status(400).json({ success: false, error: 'followedTeamIds geçerli takım id\'lerinden oluşmalı.' });
    return;
  }

  if (!(await isValidFcmToken(token))) {
    res.status(400).json({ success: false, error: 'Geçersiz bildirim token\'ı.' });
    return;
  }

  try {
    await getFirestore()
      .collection('pushSubscriptions')
      .doc(token)
      .set(
        {
          token,
          followedTeamIds,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error('subscribeToGoalAlerts: Firestore write failed', { error: String(error) });
    res.status(500).json({ success: false, error: 'Abonelik kaydedilemedi.' });
  }
});
