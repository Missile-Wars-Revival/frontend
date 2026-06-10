import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { gameHaptics } from '../../util/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type HapticKind = 'none' | 'selection' | 'light' | 'medium' | 'heavy';

const HAPTIC_FOR_KIND: Record<Exclude<HapticKind, 'none'>, () => void> = {
  selection: gameHaptics.selection,
  light: gameHaptics.tapLight,
  medium: gameHaptics.tapMedium,
  heavy: gameHaptics.tapHeavy,
};

interface BouncyPressableProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Haptic played on press-in. Defaults to a light tap. */
  haptic?: HapticKind;
  /** Scale while pressed. */
  pressedScale?: number;
}

/**
 * Drop-in `Pressable` that springs down on press and plays a haptic tick —
 * the shared "juicy button" used across the store and fire flows.
 */
export const BouncyPressable: React.FC<BouncyPressableProps> = ({
  style,
  haptic = 'light',
  pressedScale = 0.92,
  onPressIn,
  onPressOut,
  ...rest
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(pressedScale, { damping: 18, stiffness: 420 });
        if (haptic !== 'none') HAPTIC_FOR_KIND[haptic]();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 320 });
        onPressOut?.(e);
      }}
    />
  );
};
