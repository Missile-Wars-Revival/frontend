/**
 * Declarative enter animation built on react-native-ease. Fades + slides (and
 * optionally scales) its children in from a small offset using native platform
 * animations (Core Animation / Animator) — no JS animation loop.
 *
 * Use `index` to stagger lists: each row animates in slightly after the last.
 */
import React from 'react';
import type { ViewProps } from 'react-native';
import { EaseView } from 'react-native-ease';

export type AnimatedEntranceProps = ViewProps & {
  /** Position in a list — multiplied by `stagger` to delay the entrance. */
  index?: number;
  /** Per-item stagger delay in ms. @default 45 */
  stagger?: number;
  /** Base delay applied to every item in ms. @default 0 */
  delay?: number;
  /** Vertical offset to slide up from, in px. @default 18 */
  offsetY?: number;
  /** Start scale (1 = no scale-in). @default 1 */
  fromScale?: number;
};

export function AnimatedEntrance({
  index = 0,
  stagger = 45,
  delay = 0,
  offsetY = 18,
  fromScale = 1,
  children,
  ...rest
}: AnimatedEntranceProps) {
  const totalDelay = delay + index * stagger;

  return (
    <EaseView
      {...rest}
      initialAnimate={{ opacity: 0, translateY: offsetY, scale: fromScale }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 18, stiffness: 160, delay: totalDelay }}
    >
      {children}
    </EaseView>
  );
}

export default AnimatedEntrance;
