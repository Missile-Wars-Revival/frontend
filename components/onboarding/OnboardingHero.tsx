import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Skia,
  useClock,
} from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

// Animated Skia "hero" for onboarding slides: the slide image floats inside a
// living tactical HUD — pulsing glow, counter-rotating dashed radar rings,
// orbiting glow dots and expanding pings, all themed to the slide accent.

type Props = {
  /** Square edge length of the hero. */
  size: number;
  /** Slide accent colour driving every canvas element. */
  accentColor: string;
  /** Slide artwork rendered in the centre. */
  image: any;
  /** Slide id — enables small per-slide flourishes (e.g. orbiting missile). */
  variant?: string;
};

// Same missile silhouette as the splash / effects screens.
const MISSILE_PATH = Skia.Path.MakeFromSVGString(
  'M -11 -3 L 7 -3 L 7 3 L -11 3 Z' + // body
    ' M 7 -3 L 18 0 L 7 3 Z' + // nose
    ' M -11 -3 L -19 -9 L -6 -3 Z' + // top fin
    ' M -11 3 L -19 9 L -6 3 Z' // bottom fin
)!;

const OrbitDot = ({
  clock,
  center,
  radius,
  size,
  color,
  period,
  phase,
}: {
  clock: SharedValue<number>;
  center: number;
  radius: number;
  size: number;
  color: string;
  period: number;
  phase: number;
}) => {
  const cx = useDerivedValue(
    () => center + Math.cos((clock.value / period + phase) * Math.PI * 2) * radius
  );
  const cy = useDerivedValue(
    () => center + Math.sin((clock.value / period + phase) * Math.PI * 2) * radius
  );
  return (
    <Group>
      <Circle cx={cx} cy={cy} r={size * 1.9} color={color} opacity={0.45}>
        <BlurMask blur={6} style="solid" />
      </Circle>
      <Circle cx={cx} cy={cy} r={size} color="#FFFFFF" />
    </Group>
  );
};

const PingRing = ({
  clock,
  center,
  fromR,
  toR,
  color,
  period,
  phase,
}: {
  clock: SharedValue<number>;
  center: number;
  fromR: number;
  toR: number;
  color: string;
  period: number;
  phase: number;
}) => {
  const r = useDerivedValue(() => {
    const t = (clock.value / period + phase) % 1;
    return fromR + (toR - fromR) * t;
  });
  const opacity = useDerivedValue(() => {
    const t = (clock.value / period + phase) % 1;
    return 0.5 * (1 - t);
  });
  return <Circle cx={center} cy={center} r={r} color={color} style="stroke" strokeWidth={1.6} opacity={opacity} />;
};

export const OnboardingHero: React.FC<Props> = ({ size, accentColor, image, variant }) => {
  const clock = useClock();

  const c = size / 2;
  const ringOuter = size * 0.46;
  const ringInner = size * 0.36;

  // Counter-rotating dashed rings.
  const rotOuter = useDerivedValue(() => [{ rotate: (clock.value / 16000) * Math.PI * 2 }]);
  const rotInner = useDerivedValue(() => [{ rotate: -(clock.value / 10000) * Math.PI * 2 }]);

  // Soft breathing glow behind the artwork.
  const glowR = useDerivedValue(() => size * 0.28 + Math.sin(clock.value / 900) * size * 0.022);
  const glowOpacity = useDerivedValue(() => 0.4 + Math.sin(clock.value / 900) * 0.12);

  // Orbiting missile flourish (missiles slide only): position + nose-forward rotation.
  const missileTransform = useDerivedValue(() => {
    const a = (clock.value / 7000) * Math.PI * 2;
    return [
      { translateX: c + Math.cos(a) * ringOuter },
      { translateY: c + Math.sin(a) * ringOuter },
      { rotate: a + Math.PI / 2 },
      { scale: 1.15 },
    ];
  });

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Breathing accent glow */}
        <Circle cx={c} cy={c} r={glowR} color={accentColor} opacity={glowOpacity}>
          <BlurMask blur={30} style="normal" />
        </Circle>

        {/* Outer dashed radar ring */}
        <Group origin={{ x: c, y: c }} transform={rotOuter}>
          <Circle cx={c} cy={c} r={ringOuter} color={accentColor} style="stroke" strokeWidth={2} opacity={0.55}>
            <DashPathEffect intervals={[26, 14]} />
          </Circle>
        </Group>

        {/* Inner dashed ring, rotating the other way */}
        <Group origin={{ x: c, y: c }} transform={rotInner}>
          <Circle cx={c} cy={c} r={ringInner} color={accentColor} style="stroke" strokeWidth={1.4} opacity={0.35}>
            <DashPathEffect intervals={[8, 10]} />
          </Circle>
        </Group>

        {/* Expanding radar pings */}
        <PingRing clock={clock} center={c} fromR={ringInner} toR={size * 0.52} color={accentColor} period={2600} phase={0} />
        <PingRing clock={clock} center={c} fromR={ringInner} toR={size * 0.52} color={accentColor} period={2600} phase={0.5} />

        {/* Orbiting glow dots */}
        <OrbitDot clock={clock} center={c} radius={ringOuter} size={3} color={accentColor} period={9000} phase={0} />
        <OrbitDot clock={clock} center={c} radius={ringOuter} size={2.4} color={accentColor} period={9000} phase={0.38} />
        <OrbitDot clock={clock} center={c} radius={ringInner} size={2.2} color={accentColor} period={6500} phase={0.7} />

        {/* Missiles slide: a missile circles the artwork */}
        {variant === 'missiles' && (
          <Group transform={missileTransform}>
            <Group>
              <BlurMask blur={3} style="solid" />
              <Path path={MISSILE_PATH} color={accentColor} />
            </Group>
          </Group>
        )}
      </Canvas>

      <Image
        source={image}
        style={[
          styles.image,
          {
            width: size * 0.56,
            height: size * 0.56,
            top: size * 0.22,
            left: size * 0.22,
          },
        ]}
        contentFit="contain"
        transition={250}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    position: 'absolute',
  },
});

export default OnboardingHero;
