import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Centralised game haptics. Every helper is fire-and-forget and silently
// no-ops where haptics are unavailable (web, simulators, devices with
// haptics disabled) so callers never need to guard or await.

const HAPTICS_SUPPORTED = Platform.OS === 'ios' || Platform.OS === 'android';

const safely = (fn: () => Promise<unknown>) => {
  if (!HAPTICS_SUPPORTED) return;
  fn().catch(() => {});
};

const after = (ms: number, fn: () => Promise<unknown>) => {
  if (!HAPTICS_SUPPORTED) return;
  setTimeout(() => fn().catch(() => {}), ms);
};

export const gameHaptics = {
  /** Tiny tick for pickers, tabs and map taps. */
  selection: () => safely(() => Haptics.selectionAsync()),

  tapLight: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  tapMedium: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  tapHeavy: () => safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)),

  success: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safely(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),

  /** Rising rumble that tracks the missile-launch overlay animation. */
  missileLaunch: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    after(110, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    after(240, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    after(400, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
    after(620, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    after(950, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  /** Mechanical click-clack of a landmine arming. */
  landmineArm: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid));
    after(160, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    after(420, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  /** Soft thud + confirmation for a loot drop request. */
  lootDrop: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
    after(180, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    after(500, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  /** Three quick pulses, like a shield powering up. */
  shieldUp: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
    after(140, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    after(280, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    after(520, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },

  /** Coin clink for adding items to the cart. */
  coin: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    after(90, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  },

  /** Big celebratory pattern for a completed premium purchase. */
  purchaseSuccess: () => {
    safely(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    after(150, () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
    after(380, () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  },
};
