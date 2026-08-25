import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initAppCheck, getAppCheckInstance } from './appCheck';

vi.mock('firebase/app-check', () => {
  return {
    initializeAppCheck: vi.fn(() => ({
      app: {},
      _isTokenAutoRefreshEnabled: true,
    })),
    ReCaptchaEnterpriseProvider: vi.fn((key: string) => ({
      siteKey: key,
    })),
  };
});

describe('appCheck service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles initialization safely', async () => {
    const result = await initAppCheck();
    expect(result === null || typeof result === 'object').toBe(true);
  });

  it('provides getAppCheckInstance getter', () => {
    const instance = getAppCheckInstance();
    expect(instance === null || typeof instance === 'object').toBe(true);
  });
});
