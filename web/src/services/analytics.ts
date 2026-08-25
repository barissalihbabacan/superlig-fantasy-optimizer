import { logEvent, type Analytics } from 'firebase/analytics';
import { initAnalytics } from './firebase';

let analyticsPromise: Promise<Analytics | null> | null = null;

function getAnalyticsInstance(): Promise<Analytics | null> {
  if (!analyticsPromise) {
    analyticsPromise = initAnalytics();
  }
  return analyticsPromise;
}

/**
 * Safely logs an event to Firebase Analytics without throwing on error or in unsupported environments.
 */
export async function trackEvent(
  eventName: string,
  eventParams?: Record<string, string | number | boolean | undefined>
): Promise<void> {
  try {
    const analytics = await getAnalyticsInstance();
    if (analytics) {
      logEvent(analytics, eventName, eventParams);
    }
  } catch (err) {
    // Fail silently in development/test/unsupported browser environments
    if (import.meta.env.DEV) {
      console.debug(`[Analytics: ${eventName}]`, eventParams, err);
    }
  }
}

/**
 * Tracks navigation / active tab changes
 */
export function trackTabChange(tabName: string): void {
  trackEvent('tab_change', {
    tab_name: tabName,
    page_title: tabName.charAt(0).toUpperCase() + tabName.slice(1),
  });
}

/**
 * Tracks when a match detail page is opened
 */
export function trackMatchDetailViewed(params: {
  fixtureId: string;
  homeTeam?: string;
  awayTeam?: string;
  round?: number;
}): void {
  trackEvent('match_detail_viewed', {
    fixture_id: params.fixtureId,
    home_team: params.homeTeam,
    away_team: params.awayTeam,
    round: params.round,
  });
}

/**
 * Tracks squad optimization execution
 */
export function trackOptimizerRun(params: {
  formation: string;
  budget: number;
  totalPoints?: number;
  captainName?: string;
}): void {
  trackEvent('optimizer_run', {
    formation: params.formation,
    budget: params.budget,
    total_points: params.totalPoints,
    captain_name: params.captainName,
  });
}

/**
 * Tracks optimizer reset
 */
export function trackOptimizerReset(): void {
  trackEvent('optimizer_reset');
}

/**
 * Tracks when a user saves Nostradamus predictions for a round
 */
export function trackPredictionSaved(params: {
  round: number;
  predictionCount: number;
  totalMatches: number;
}): void {
  trackEvent('prediction_saved', {
    round: params.round,
    prediction_count: params.predictionCount,
    total_matches: params.totalMatches,
  });
}

/**
 * Tracks Nostradamus prediction reset for a round
 */
export function trackPredictionReset(params: { round: number }): void {
  trackEvent('prediction_reset', {
    round: params.round,
  });
}

/**
 * Tracks theme toggle
 */
export function trackThemeToggle(theme: 'dark' | 'light'): void {
  trackEvent('theme_toggle', {
    selected_theme: theme,
  });
}
