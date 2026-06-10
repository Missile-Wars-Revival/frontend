import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Tiny event bus for full-screen game effects. `GameEffectsOverlay` (mounted
// once in app/_layout.tsx) subscribes and plays a Skia animation for each
// event; any component can fire one without worrying about modal stacking or
// where the canvas lives. Triggering also plays a matching haptic pattern so
// visuals and feel stay in sync from a single call site.

export type GameEffectType =
  | 'missileLaunch'
  | 'landmineArm'
  | 'lootDrop'
  | 'shieldUp'
  | 'coinBurst'
  | 'purchaseSuccess';

export interface GameEffectEvent {
  id: number;
  type: GameEffectType;
}

type Listener = (event: GameEffectEvent) => void;

const listeners = new Set<Listener>();
let nextId = 1;

// --- Haptic choreography -----------------------------------------------
// Rich Pulsar presets when the native module is linked (dev client builds),
// otherwise timed expo-haptics sequences so the patterns still land.

type PulsarPresets = typeof import('react-native-pulsar').Presets;

let pulsar: PulsarPresets | null | undefined;

const getPulsar = (): PulsarPresets | null => {
  if (pulsar !== undefined) return pulsar;
  try {
    pulsar = require('react-native-pulsar').Presets as PulsarPresets;
  } catch {
    pulsar = null;
  }
  return pulsar;
};

const HAPTICS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

const rich = (play: (p: PulsarPresets) => void): boolean => {
  try {
    const p = getPulsar();
    if (!p) return false;
    play(p);
    return true;
  } catch {
    return false;
  }
};

const beat = (ms: number, fn: () => Promise<unknown>) => {
  if (!HAPTICS_SUPPORTED) return;
  if (ms === 0) {
    fn().catch(() => {});
  } else {
    setTimeout(() => fn().catch(() => {}), ms);
  }
};

const HAPTIC_FOR_EFFECT: Record<GameEffectType, () => void> = {
  missileLaunch: () => {
    if (rich((p) => p.ignition())) {
      setTimeout(() => rich((p) => p.shockwave()), 800);
      return;
    }
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    beat(110, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    beat(240, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    beat(400, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
    beat(620, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    beat(950, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  landmineArm: () => {
    if (rich((p) => p.lock())) {
      setTimeout(() => rich((p) => p.System.notificationSuccess()), 450);
      return;
    }
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
    beat(160, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    beat(420, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  lootDrop: () => {
    if (rich((p) => p.plummet())) {
      setTimeout(() => rich((p) => p.coinDrop()), 900);
      return;
    }
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
    beat(180, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    beat(500, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  shieldUp: () => {
    if (rich((p) => p.surge())) return;
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
    beat(140, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    beat(280, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    beat(520, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
  coinBurst: () => {
    if (rich((p) => p.coinDrop())) return;
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    beat(90, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },
  purchaseSuccess: () => {
    if (rich((p) => p.triumph())) return;
    beat(0, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    beat(150, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    beat(380, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
};

export function triggerGameEffect(type: GameEffectType) {
  HAPTIC_FOR_EFFECT[type]();
  const event: GameEffectEvent = { id: nextId++, type };
  listeners.forEach((listener) => listener(event));
}

export function onGameEffect(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
