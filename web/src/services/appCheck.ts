import { app } from './firebase';
import type { AppCheck } from 'firebase/app-check';

let appCheckInstance: AppCheck | null = null;

/**
 * Initialize Firebase App Check with reCAPTCHA Enterprise provider.
 * Keeps enforcement strictly in MONITORING mode (Unenforced) to verify token flow safely.
 */
export const initAppCheck = async (): Promise<AppCheck | null> => {
  if (typeof window === 'undefined') return null;
  if (appCheckInstance) return appCheckInstance;

  try {
    const siteKey =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY) ||
      '';

    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
    const debugToken =
      typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_CHECK_DEBUG_TOKEN;

    // In local development, enable App Check debug token
    if (isDev || debugToken) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || true;
    }

    if (!siteKey && !isDev && !debugToken) {
      // No site key provided yet in production; skip gracefully
      return null;
    }

    const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check');

    // Use dummy/placeholder key if in dev with debug token and no key supplied
    const effectiveKey = siteKey || '6Ldummy_dev_site_key_for_app_check';

    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(effectiveKey),
      isTokenAutoRefreshEnabled: true,
    });

    return appCheckInstance;
  } catch (error) {
    // Fail-safe: App Check failure should never break or block core app workflows
    console.warn('Firebase App Check initialization skipped or failed:', error);
    return null;
  }
};

/**
 * Helper to get the current App Check instance (if initialized)
 */
export const getAppCheckInstance = (): AppCheck | null => {
  return appCheckInstance;
};
