import { gameHaptics } from '../../util/haptics';

// Tiny event bus for full-screen game effects. `GameEffectsOverlay` (mounted
// once in app/_layout.tsx) subscribes and plays a Skia animation for each
// event; any component can fire one without worrying about modal stacking or
// where the canvas lives. Triggering also plays the matching haptic sequence
// so visuals and feel stay in sync from a single call site.

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

const HAPTIC_FOR_EFFECT: Record<GameEffectType, () => void> = {
  missileLaunch: gameHaptics.missileLaunch,
  landmineArm: gameHaptics.landmineArm,
  lootDrop: gameHaptics.lootDrop,
  shieldUp: gameHaptics.shieldUp,
  coinBurst: gameHaptics.coin,
  purchaseSuccess: gameHaptics.purchaseSuccess,
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
