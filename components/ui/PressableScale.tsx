/**
 * Pressable that scales down with a native ease animation on press and fires a
 * Pulsar haptic. A drop-in replacement for TouchableOpacity that feels tactile.
 */
import React, { useState } from 'react';
import { Pressable, type PressableProps, type ViewStyle, type StyleProp } from 'react-native';
import { EaseView } from 'react-native-ease';
import { haptics } from './haptics';

type HapticKind = keyof typeof haptics | 'none';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  /** Plain nodes only — the render-function form of Pressable children is not supported. */
  children?: React.ReactNode;
  /** Scale applied while pressed. @default 0.95 */
  pressedScale?: number;
  /** Which haptic to fire on press-in. @default 'select' */
  haptic?: HapticKind;
};

export function PressableScale({
  style,
  pressedScale = 0.95,
  haptic = 'select',
  onPressIn,
  children,
  ...rest
}: PressableScaleProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        setPressed(true);
        if (haptic !== 'none') haptics[haptic]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        rest.onPressOut?.(e);
      }}
    >
      <EaseView
        style={style}
        animate={{ scale: pressed ? pressedScale : 1, opacity: pressed ? 0.92 : 1 }}
        transition={{ type: 'spring', damping: 16, stiffness: 320 }}
      >
        {children}
      </EaseView>
    </Pressable>
  );
}

export default PressableScale;
