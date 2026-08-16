/**
 * Goal-alert push notification client. Talks to the `subscribeToGoalAlerts`
 * Cloud Function (via the same-origin `/api/notifications/subscribe` Hosting
 * rewrite, mirroring `rapidApiFootball.ts`'s `/api/football/**` pattern) and
 * to the `firebase-messaging-sw.js` service worker for background delivery.
 */
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingIfSupported } from './firebase';

// Firebase Console → Project Settings → Cloud Messaging → "Web Push
// certificates" → generate a key pair and paste its value here. There is no
// API/CLI to create this — it must come from the console.
const VAPID_KEY = 'BIuCU_KO0A7mc9KfNlQYqKGSIak8qHEofMJhMaxOQ8mGNYw71sHXl0E3eJToEDEhETwyiVh-TBmIlJ86Ulln5tk';

const SUBSCRIBE_ENDPOINT = '/api/notifications/subscribe';
const LOCAL_STORAGE_KEY = 'superlig_goal_alert_teams';

export function getSavedFollowedTeamIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function requestGoalAlertSubscription(
  followedTeamIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_KEY) {
    return { success: false, error: 'VAPID anahtarı henüz yapılandırılmamış.' };
  }

  const messaging = await getMessagingIfSupported();
  if (!messaging) {
    return { success: false, error: 'Bu tarayıcı push bildirimlerini desteklemiyor.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return { success: false, error: 'Bildirim izni verilmedi.' };
  }

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) {
    return { success: false, error: "Bildirim token'ı alınamadı." };
  }

  const response = await fetch(SUBSCRIBE_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, followedTeamIds }),
  });
  if (!response.ok) {
    return { success: false, error: 'Sunucuya kaydedilemedi.' };
  }

  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(followedTeamIds));
  return { success: true };
}

/**
 * Subscribes to push messages that arrive while the tab is open — FCM does
 * not auto-display these as OS notifications in the foreground, so the
 * caller is expected to surface `title`/`body` itself (e.g. via Toast).
 */
export function onForegroundGoalAlert(callback: (title: string, body: string) => void): () => void {
  let unsubscribe: (() => void) | undefined;
  let cancelled = false;

  getMessagingIfSupported().then((messaging) => {
    if (!messaging || cancelled) return;
    unsubscribe = onMessage(messaging, (payload) => {
      callback(payload.notification?.title ?? '⚽ Gol!', payload.notification?.body ?? '');
    });
  });

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
