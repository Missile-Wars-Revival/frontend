/**
 * Shared design tokens for the redesigned Friends / Notifications / Profile
 * surfaces. Provides a light/dark palette, spacing scale, radii, and a few
 * reusable gradient definitions so screens stay visually consistent.
 */

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
  /** Translucent tint used behind glass/blur surfaces. */
  glass: string;
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
    glass: 'rgba(255, 255, 255, 0.65)',
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
    glass: 'rgba(26, 29, 51, 0.6)',
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
