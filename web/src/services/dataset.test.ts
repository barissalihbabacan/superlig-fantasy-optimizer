import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  getPositionBadgeColor,
  translatePosition,
  getShortPosition,
  formatDateDDMMYYYY,
  getTeamBranding,
} from './dataset';

describe('formatPrice', () => {
  it('converts price units to millions with one decimal', () => {
    expect(formatPrice(500)).toBe('5.0M ₺');
    expect(formatPrice(1250)).toBe('12.5M ₺');
    expect(formatPrice(0)).toBe('0.0M ₺');
  });
});

describe('translatePosition', () => {
  it('translates known positions to Turkish', () => {
    expect(translatePosition('Goalkeeper')).toBe('Kaleci');
    expect(translatePosition('Defender')).toBe('Defans');
    expect(translatePosition('Midfielder')).toBe('Orta Saha');
    expect(translatePosition('Forward')).toBe('Forvet');
  });

  it('passes through unknown positions unchanged', () => {
    expect(translatePosition('Unknown')).toBe('Unknown');
  });
});

describe('getShortPosition', () => {
  it('abbreviates known positions', () => {
    expect(getShortPosition('Goalkeeper')).toBe('KL');
    expect(getShortPosition('Defender')).toBe('DEF');
    expect(getShortPosition('Midfielder')).toBe('OS');
    expect(getShortPosition('Forward')).toBe('FOR');
  });
});

describe('getPositionBadgeColor', () => {
  it('returns a distinct color set per known position', () => {
    const gk = getPositionBadgeColor('Goalkeeper');
    const def = getPositionBadgeColor('Defender');
    expect(gk.text).not.toBe(def.text);
  });

  it('falls back to a neutral color for unknown positions', () => {
    const unknown = getPositionBadgeColor('Sweeper');
    expect(unknown.text).toBe('#94a3b8');
  });
});

describe('getTeamBranding', () => {
  it('returns the real branding for a known team', () => {
    const branding = getTeamBranding('galatasaray');
    expect(branding.code).toBe('GS');
    expect(branding.primaryColor).toBe('#fdb912');
  });

  it('derives a fallback branding for an unknown team id', () => {
    const branding = getTeamBranding('some-unlisted-team');
    expect(branding.code).toBe('SOM');
    expect(branding.city).toBe('Türkiye');
  });
});

describe('formatDateDDMMYYYY', () => {
  it('formats a valid ISO date as DD-MM-YYYY', () => {
    expect(formatDateDDMMYYYY('2026-08-16T18:00:00')).toBe('16-08-2026');
  });

  it('returns an empty string for an undefined input', () => {
    expect(formatDateDDMMYYYY(undefined)).toBe('');
  });

  it('falls back to manual parsing for a date-only string with a T separator that Date() cannot parse', () => {
    expect(formatDateDDMMYYYY('2026-08-16Txx:invalid')).toBe('16-08-2026');
  });
});
