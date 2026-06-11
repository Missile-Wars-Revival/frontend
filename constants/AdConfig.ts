import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

/**
 * Ad Unit IDs for Google AdMob.
 *
 * In development / test builds these resolve to the official AdMob test IDs
 * so that real ads are never accidentally requested during development.
 *
 * Replace the production values below with your real AdMob unit IDs once
 * your ad units have been created in the AdMob console.
 */

const IS_TEST = __DEV__;

// ── Banner ──────────────────────────────────────────────────────────────────
const BANNER_IOS = 'ca-app-pub-8706187791347511/6311528606';
const BANNER_ANDROID = 'ca-app-pub-8706187791347511/9891266643';

// ── Interstitial ────────────────────────────────────────────────────────────
const INTERSTITIAL_IOS = 'ca-app-pub-8706187791347511/5431134739';
const INTERSTITIAL_ANDROID = 'ca-app-pub-8706187791347511/1341474190';

// ── Native (in-feed) ───────────────────────────────────────────────────────
const NATIVE_IOS = 'ca-app-pub-8706187791347511/4118053067';
const NATIVE_ANDROID = 'ca-app-pub-8706187791347511/9822599447';

// ── Rewarded Video ─────────────────────────────────────────────────────────
const REWARDED_IOS = 'ca-app-pub-8706187791347511/6937456393'; // TODO: replace with real rewarded ad unit ID
const REWARDED_ANDROID = 'ca-app-pub-8706187791347511/8844559698';

// Warn loudly in production if placeholder ad unit IDs are still present
if (!IS_TEST && BANNER_IOS.includes('YYYY')) {
  console.error('⚠️ AdConfig: Production build is using placeholder AdMob unit IDs. Replace them in constants/AdConfig.ts');
}

export const AD_UNIT_IDS = {
  BANNER: IS_TEST
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({ ios: BANNER_IOS, android: BANNER_ANDROID, default: BANNER_IOS }),

  INTERSTITIAL: IS_TEST
    ? TestIds.INTERSTITIAL
    : Platform.select({ ios: INTERSTITIAL_IOS, android: INTERSTITIAL_ANDROID, default: INTERSTITIAL_IOS }),

  NATIVE: IS_TEST
    ? TestIds.NATIVE
    : Platform.select({ ios: NATIVE_IOS, android: NATIVE_ANDROID, default: NATIVE_IOS }),

  REWARDED: IS_TEST
    ? TestIds.REWARDED
    : Platform.select({ ios: REWARDED_IOS, android: REWARDED_ANDROID, default: REWARDED_IOS }),
} as const;

/**
 * Controls how often interstitial ads may be shown.
 *
 * - `minIntervalMs` – minimum time between two interstitial impressions.
 * - `actionsBeforeFirst` – how many qualifying actions the user must perform
 *   in a session before the first interstitial is eligible.
 */
export const INTERSTITIAL_FREQUENCY = {
  /** Minimum gap between interstitials (5 minutes). */
  minIntervalMs: 5 * 60 * 1000,
  /** Number of qualifying actions before the first interstitial in a session. */
  actionsBeforeFirst: 3,
} as const;

/** Number of timeline items between inline native ads. */
export const TIMELINE_AD_INTERVAL = 3;

/**
 * Rewarded ad configuration.
 * Controls cooldown between rewarded ads and daily limits.
 */
export const REWARDED_AD_CONFIG = {
  /** Minimum gap between rewarded ad views (30 minutes). */
  minIntervalMs: 30 * 60 * 1000,
  /** Maximum rewarded ads per day per user. */
  maxPerDay: 5,
} as const;

/**
 * Powerups available via rewarded video ads.
 * Each maps to a powerup key recognized by the backend.
 */
export const REWARDED_POWERUP_OPTIONS = [
  { key: 'streak_shield' as const, label: 'Streak Shield', icon: 'shield-checkmark' as const, color: '#60A5FA' },
  { key: 'lastCall' as const, label: 'Last Call', icon: 'flash' as const, color: '#F472B6' },
  { key: 'ghostMode' as const, label: 'Ghost Mode', icon: 'eye-off' as const, color: '#A78BFA' },
] as const;
