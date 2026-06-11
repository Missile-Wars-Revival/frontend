/**
 * Shared design tokens for the redesigned surfaces (Friends / Notifications /
 * Profile / Store / map overlays). Provides a light/dark palette, semantic
 * status colours, a typography scale, spacing, radii, and reusable gradient
 * definitions so screens stay visually consistent.
 */

import { Platform } from 'react-native';

export type ThemePalette = {
  /** Screen background. */
  bg: string;
  /** Elevated surface (cards, rows). */
  surface: string;
  /** Slightly stronger surface for nested elements. */
  surfaceAlt: string;
  /** Hairline / divider colour. */
  border: string;
  /** Primary text. */
  text: string;
  /** Secondary / muted text. */
  textMuted: string;
  /** Faint text (timestamps, captions). */
  textFaint: string;
  /** Brand accent (used for highlights, active states). */
  accent: string;
  /** Translucent accent tint (chips, icon wells, selected rows). */
  accentSoft: string;
  /** Positive state (success, online, alive). */
  success: string;
  /** Translucent success tint. */
  successSoft: string;
  /** Caution state (warnings, pending). */
  warning: string;
  /** Translucent warning tint. */
  warningSoft: string;
  /** Destructive state (errors, remove, fire). */
  danger: string;
  /** Translucent danger tint. */
  dangerSoft: string;
  /** Coin / premium gold. */
  gold: string;
  /** Translucent tint used behind glass/blur surfaces. */
  glass: string;
  /** Dimmed backdrop behind modals and popups. */
  overlay: string;
};

export const Palette: { light: ThemePalette; dark: ThemePalette } = {
  light: {
    bg: '#EEF1F8',
    surface: '#FFFFFF',
    surfaceAlt: '#F4F6FB',
    border: 'rgba(20, 23, 40, 0.08)',
    text: '#141728',
    textMuted: '#5A6178',
    textFaint: '#9AA0B4',
    accent: '#5B5BF0',
    accentSoft: 'rgba(91, 91, 240, 0.12)',
    success: '#16A34A',
    successSoft: 'rgba(34, 197, 94, 0.14)',
    warning: '#D97706',
    warningSoft: 'rgba(245, 158, 11, 0.16)',
    danger: '#E11D48',
    dangerSoft: 'rgba(225, 29, 72, 0.12)',
    gold: '#D9930D',
    glass: 'rgba(255, 255, 255, 0.65)',
    overlay: 'rgba(10, 12, 26, 0.55)',
  },
  dark: {
    bg: '#0E1020',
    surface: '#1A1D33',
    surfaceAlt: '#232744',
    border: 'rgba(255, 255, 255, 0.08)',
    text: '#F4F6FF',
    textMuted: '#A6ACC8',
    textFaint: '#6E7494',
    accent: '#8E8EFF',
    accentSoft: 'rgba(142, 142, 255, 0.18)',
    success: '#4ADE80',
    successSoft: 'rgba(74, 222, 128, 0.16)',
    warning: '#FBBF24',
    warningSoft: 'rgba(251, 191, 36, 0.16)',
    danger: '#FB7185',
    dangerSoft: 'rgba(251, 113, 133, 0.16)',
    gold: '#F7B733',
    glass: 'rgba(26, 29, 51, 0.6)',
    overlay: 'rgba(4, 5, 14, 0.7)',
  },
};

/** Brand gradients (used for headers, primary buttons, the fire action). */
export const Gradients = {
  brand: ['#6D5BF8', '#9B5BF0', '#C04CE0'] as const,
  fire: ['#FF6B4A', '#F5365C'] as const,
  success: ['#22C55E', '#16A34A'] as const,
  danger: ['#FB7185', '#E11D48'] as const,
  gold: ['#F7B733', '#FC4A1A'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

/**
 * Typography scale. Spread into text styles so size/weight pairs stay
 * consistent across screens, e.g. `{ ...Type.title, color: palette.text }`.
 */
export const Type = {
  /** Screen titles. */
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  /** Section / modal titles. */
  title: { fontSize: 20, fontWeight: '800' },
  /** Card titles, prominent rows. */
  headline: { fontSize: 16, fontWeight: '700' },
  /** Default body copy. */
  body: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  /** Secondary copy, list metadata. */
  caption: { fontSize: 13, fontWeight: '600' },
  /** Smallest labels (badges, timestamps). */
  micro: { fontSize: 11, fontWeight: '700' },
  /** Button labels. */
  button: { fontSize: 15, fontWeight: '800' },
} as const;

export const getPalette = (isDark: boolean): ThemePalette =>
  isDark ? Palette.dark : Palette.light;

/** Soft elevation shadow tuned per theme. */
export const cardShadow = (isDark: boolean) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: isDark ? 0.35 : 0.12,
  shadowRadius: 16,
  elevation: 6,
});

/** Tighter shadow for small floating controls (FABs, pills). */
export const chipShadow = (isDark: boolean) => ({
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: isDark ? 0.3 : 0.1,
  shadowRadius: 6,
  elevation: 3,
});

/** Native tab bar height (expo-router NativeTabs). */
export const NATIVE_TAB_BAR_HEIGHT = Platform.select({ ios: 44, android: 50, default: 50 }) ?? 50;

/**
 * Bottom gap for floating controls inside a tab screen. Tab content already sits
 * above the native tab bar, so only a small margin is needed.
 */
export function tabContentBottomGap(gap = Spacing.xs) {
  return gap;
}

/** Bottom offset on full-bleed screens (parent does not apply bottom safe-area padding). */
export function floatingAboveTabBar(bottomInset: number, gap = Spacing.sm) {
  return bottomInset + NATIVE_TAB_BAR_HEIGHT + gap;
}

/** Bottom offset inside SafeAreaView / content that already clears the home indicator. */
export function floatingAboveTabBarFromSafeContent(gap = Spacing.sm) {
  return NATIVE_TAB_BAR_HEIGHT + gap;
}
