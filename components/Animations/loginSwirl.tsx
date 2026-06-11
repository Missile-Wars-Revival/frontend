import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useColorScheme, useWindowDimensions } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  DashPathEffect,
  Group,
  Path,
  Rect,
  Skia,
} from '@shopify/react-native-skia';
import {
  Easing,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Presets } from 'react-native-pulsar';

type LoginSwirlProps = {
  onAnimationComplete: () => void;
};

type Progress = SharedValue<number>;

const DURATION_MS = 1650;

const MISSILE_PATH = Skia.Path.MakeFromSVGString(
  'M -11 -3 L 7 -3 L 7 3 L -11 3 Z' +
  ' M 7 -3 L 18 0 L 7 3 Z' +
  ' M -11 -3 L -19 -9 L -6 -3 Z' +
  ' M -11 3 L -19 9 L -6 3 Z'
)!;

const EXHAUST_PATH = Skia.Path.MakeFromSVGString('M -11 -2 L -24 0 L -11 2 Z')!;

const MISSILE_ANGLES = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3];

function windowT(p: number, start: number, end: number): number {
  'worklet';
  if (end <= start) return p >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

function easeOutCubic(t: number): number {
  'worklet';
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutQuad(t: number): number {
  'worklet';
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface SparkSpec {
  angle: number;
  dist: number;
  size: number;
  color: string;
  start: number;
  end: number;
}

const Spark = ({
  progress,
  cx,
  cy,
  spec,
}: {
  progress: Progress;
  cx: number;
  cy: number;
  spec: SparkSpec;
}) => {
  const x = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return cx + Math.cos(spec.angle) * spec.dist * easeOutCubic(t);
  });
  const y = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return cy + Math.sin(spec.angle) * spec.dist * easeOutCubic(t);
  });
  const r = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return Math.max(0.1, spec.size * (1 - 0.7 * t));
  });
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    if (t === 0 || t === 1) return 0;
    return t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5;
  });

  return <Circle cx={x} cy={y} r={r} color={spec.color} opacity={opacity} />;
};

const ShockRing = ({
  progress,
  cx,
  cy,
  maxR,
  color,
  width,
  start,
  end,
}: {
  progress: Progress;
  cx: number;
  cy: number;
  maxR: number;
  color: string;
  width: number;
  start: number;
  end: number;
}) => {
  const r = useDerivedValue(() => {
    const t = windowT(progress.value, start, end);
    return Math.max(0.1, maxR * easeOutCubic(t));
  });
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, start, end);
    if (t === 0 || t === 1) return 0;
    return 0.85 * (1 - t);
  });

  return (
    <Circle cx={cx} cy={cy} r={r} color={color} style="stroke" strokeWidth={width} opacity={opacity} />
  );
};

const PortalRing = ({
  progress,
  cx,
  cy,
  radius,
  accent,
  spin,
  start,
  end,
}: {
  progress: Progress;
  cx: number;
  cy: number;
  radius: number;
  accent: string;
  spin: number;
  start: number;
  end: number;
}) => {
  const transform = useDerivedValue(() => {
    const t = windowT(progress.value, start, end);
    const scale = 0.35 + easeOutCubic(t) * 0.65;
    const rotate = spin * easeInOutQuad(t) * Math.PI * 2;
    return [{ translateX: cx }, { translateY: cy }, { rotate }, { scale }];
  });
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, start, end);
    if (t === 0) return 0;
    const fadeOut = windowT(progress.value, 0.78, 1);
    return (0.35 + t * 0.45) * (1 - fadeOut);
  });

  return (
    <Group transform={transform} opacity={opacity}>
      <Circle cx={0} cy={0} r={radius} color={accent} style="stroke" strokeWidth={2.2}>
        <DashPathEffect intervals={[18, 12]} />
      </Circle>
    </Group>
  );
};

const BurstMissile = ({
  progress,
  cx,
  cy,
  angle,
  accent,
  travel,
}: {
  progress: Progress;
  cx: number;
  cy: number;
  angle: number;
  accent: string;
  travel: number;
}) => {
  const transform = useDerivedValue(() => {
    const t = windowT(progress.value, 0.18, 0.72);
    const move = easeOutCubic(t) * travel;
    const scale = 0.4 + easeOutCubic(Math.min(1, t * 2.2)) * 1.4;
    return [
      { translateX: cx + Math.cos(angle) * move },
      { translateY: cy + Math.sin(angle) * move },
      { rotate: angle + Math.PI / 2 },
      { scale },
    ];
  });
  const opacity = useDerivedValue(() => {
    const enter = windowT(progress.value, 0.16, 0.24);
    const exit = windowT(progress.value, 0.72, 0.9);
    return Math.min(enter, 1 - exit);
  });
  const exhaustOpacity = useDerivedValue(() => {
    const t = windowT(progress.value, 0.18, 0.72);
    return t > 0 && t < 1 ? 0.55 + Math.abs(Math.sin(progress.value * 80)) * 0.25 : 0;
  });

  return (
    <Group transform={transform} opacity={opacity}>
      <Group opacity={exhaustOpacity}>
        <Path path={EXHAUST_PATH} color="#FFA726">
          <BlurMask blur={5} style="solid" />
        </Path>
      </Group>
      <Group>
        <BlurMask blur={2.5} style="solid" />
        <Path path={MISSILE_PATH} color={accent} />
      </Group>
    </Group>
  );
};

const LoginSwirl: React.FC<LoginSwirlProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { width, height } = useWindowDimensions();
  const accent = isDarkMode ? '#4CAF50' : '#773765';
  const accentLight = isDarkMode ? '#81C784' : '#9C4D8C';
  const accentHot = isDarkMode ? '#66BB6A' : '#FF6B9D';

  const cx = width / 2;
  const cy = height / 2;
  const progress = useSharedValue(0);

  useEffect(() => {
    try {
      Presets.System.notificationSuccess();
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    progress.value = withTiming(
      1,
      { duration: DURATION_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      }
    );
  }, [onAnimationComplete, progress]);

  const backdropOpacity = useDerivedValue(() => {
    const fadeIn = windowT(progress.value, 0, 0.08);
    const fadeOut = windowT(progress.value, 0.8, 1);
    return 0.72 * fadeIn * (1 - fadeOut);
  });

  const centerGlowR = useDerivedValue(() => {
    const t = windowT(progress.value, 0.05, 0.45);
    return 28 + easeOutCubic(t) * Math.min(width, height) * 0.18;
  });
  const centerGlowOpacity = useDerivedValue(() => {
    const t = windowT(progress.value, 0.05, 0.45);
    const fadeOut = windowT(progress.value, 0.78, 1);
    return (0.25 + t * 0.35) * (1 - fadeOut);
  });

  const flashOpacity = useDerivedValue(() => {
    const t = windowT(progress.value, 0.22, 0.42);
    if (t === 0 || t === 1) return 0;
    return t < 0.2 ? (t / 0.2) * 0.22 : 0.22 * (1 - (t - 0.2) / 0.8);
  });

  const stars = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        x: ((Math.sin(i * 127.1 + 311) + 1) / 2) * width,
        y: ((Math.sin(i * 311.7 + 74) + 1) / 2) * height,
        r: 0.5 + ((Math.sin(i * 74.3) + 1) / 2) * 1.2,
        a: 0.15 + ((Math.sin(i * 53.1) + 1) / 2) * 0.35,
      })),
    [width, height]
  );

  const sparks = useMemo<SparkSpec[]>(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        angle: (i / 22) * Math.PI * 2,
        dist: Math.min(width, height) * (0.18 + (i % 5) * 0.04),
        size: 2 + (i % 3),
        color: i % 2 === 0 ? accentLight : accentHot,
        start: 0.14 + (i % 4) * 0.02,
        end: 0.72,
      })),
    [accentHot, accentLight, height, width]
  );

  const travel = Math.min(width, height) * 0.34;

  return (
    <View style={styles.container} pointerEvents="box-only">
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height} color="#060818" opacity={backdropOpacity} />

        {stars.map((star, i) => (
          <Circle
            key={`star-${i}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            color={`rgba(200,220,255,${star.a.toFixed(2)})`}
          />
        ))}

        <Circle cx={cx} cy={cy} r={centerGlowR} color={accent} opacity={centerGlowOpacity}>
          <BlurMask blur={42} style="normal" />
        </Circle>

        <PortalRing progress={progress} cx={cx} cy={cy} radius={72} accent={accentLight} spin={1.2} start={0.04} end={0.55} />
        <PortalRing progress={progress} cx={cx} cy={cy} radius={52} accent={accent} spin={-1.8} start={0.06} end={0.58} />

        <ShockRing progress={progress} cx={cx} cy={cy} maxR={width * 0.28} color={accentLight} width={2.6} start={0.1} end={0.52} />
        <ShockRing progress={progress} cx={cx} cy={cy} maxR={width * 0.42} color={accent} width={2} start={0.16} end={0.62} />
        <ShockRing progress={progress} cx={cx} cy={cy} maxR={width * 0.56} color={accentHot} width={1.4} start={0.22} end={0.72} />

        {sparks.map((spec, i) => (
          <Spark key={`spark-${i}`} progress={progress} cx={cx} cy={cy} spec={spec} />
        ))}

        {MISSILE_ANGLES.map((angle, i) => (
          <BurstMissile
            key={`missile-${i}`}
            progress={progress}
            cx={cx}
            cy={cy}
            angle={angle}
            accent={accent}
            travel={travel}
          />
        ))}

        <Rect x={0} y={0} width={width} height={height} color={accentHot} opacity={flashOpacity} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
});

export default LoginSwirl;