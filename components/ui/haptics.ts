/**
 * Thin, crash-safe wrapper around react-native-pulsar haptics.
 *
 * Pulsar is a native TurboModule resolved with `getEnforcing`, so even importing
 * it throws when it isn't linked (web, Expo Go). We therefore load it lazily on
 * first use inside a try/catch and cache the result. Every call is guarded so
 * haptics are a pure enhancement and never break the UI. Import `haptics` and
 * call the intent-named helpers rather than reaching into Pulsar directly.
 */

type PulsarPresets = typeof import('react-native-pulsar').Presets;

let presets: PulsarPresets | null | undefined; // undefined = not yet loaded, null = unavailable

const getPresets = (): PulsarPresets | null => {
  if (presets !== undefined) return presets;
  try {
    // Lazy require so a missing native module doesn't crash at import time.
    presets = require('react-native-pulsar').Presets as PulsarPresets;
  } catch {
    presets = null;
  }
  return presets;
};

const safe = (fn: (p: PulsarPresets) => void) => {
  try {
    const p = getPresets();
    if (p) fn(p);
  } catch {
    // Native module unavailable or unsupported on this device — ignore.
  }
};

export const haptics = {
  /** Light tap — list selection, opening a profile, tab-like taps. */
  select: () => safe((p) => p.System.selection()),
  /** Medium tap — primary button presses. */
  tap: () => safe((p) => p.System.impactMedium()),
  /** Soft tap — subtle secondary actions (search focus, toggles). */
  soft: () => safe((p) => p.System.impactSoft()),
  /** Heavy thud — destructive / weighty actions (remove, delete). */
  heavy: () => safe((p) => p.System.impactHeavy()),
  /** Success notification — friend added, request accepted. */
  success: () => safe((p) => p.System.notificationSuccess()),
  /** Warning notification — confirmations, caution states. */
  warning: () => safe((p) => p.System.notificationWarning()),
  /** Error notification — failures. */
  error: () => safe((p) => p.System.notificationError()),
  /** Rich themed preset — firing a missile. */
  fire: () => safe((p) => p.hammer()),
};

export default haptics;
