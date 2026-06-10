import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
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
import { GameEffectEvent, GameEffectType, onGameEffect } from './game-effects';

// Full-screen, tap-through Skia layer that plays one-shot celebration
// animations for key game actions (firing, placing, purchasing). It renders
// nothing while idle; a single linear progress value (0 → 1) drives every
// element of the active scene so the whole effect stays in lockstep.

const DURATION_MS: Record<GameEffectType, number> = {
  missileLaunch: 2200,
  landmineArm: 1800,
  lootDrop: 2100,
  shieldUp: 1800,
  coinBurst: 1500,
  purchaseSuccess: 2000,
};

// Same missile silhouette as the splash/onboarding screens.
const MISSILE_PATH = Skia.Path.MakeFromSVGString(
  'M -11 -3 L 7 -3 L 7 3 L -11 3 Z' + // body
    ' M 7 -3 L 18 0 L 7 3 Z' + // nose
    ' M -11 -3 L -19 -9 L -6 -3 Z' + // top fin
    ' M -11 3 L -19 9 L -6 3 Z' // bottom fin
)!;

// Deterministic PRNG so particle layouts are pure per effect id (plays nicely
// with the React Compiler — no Math.random during render).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function windowT(p: number, start: number, end: number): number {
  'worklet';
  if (end <= start) return p >= end ? 1 : 0;
  return Math.min(1, Math.max(0, (p - start) / (end - start)));
}

function easeOutCubic(t: number): number {
  'worklet';
  return 1 - Math.pow(1 - t, 3);
}

type Progress = SharedValue<number>;

// ---------------------------------------------------------------------------
// Building blocks
// ---------------------------------------------------------------------------

interface SparkSpec {
  x0: number;
  y0: number;
  angle: number;
  dist: number;
  size: number;
  color: string;
  gravity: number;
  start: number;
  end: number;
}

const Spark = ({ progress, spec }: { progress: Progress; spec: SparkSpec }) => {
  const cx = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return spec.x0 + Math.cos(spec.angle) * spec.dist * easeOutCubic(t);
  });
  const cy = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return spec.y0 + Math.sin(spec.angle) * spec.dist * easeOutCubic(t) + spec.gravity * t * t;
  });
  const r = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return Math.max(0.1, spec.size * (1 - 0.65 * t));
  });
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    if (t === 0 || t === 1) return 0;
    return t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
  });
  return <Circle cx={cx} cy={cy} r={r} color={spec.color} opacity={opacity} />;
};

interface RingSpec {
  x: number;
  y: number;
  maxR: number;
  width: number;
  color: string;
  start: number;
  end: number;
}

const ShockRing = ({ progress, spec }: { progress: Progress; spec: RingSpec }) => {
  const r = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    return Math.max(0.1, spec.maxR * easeOutCubic(t));
  });
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, spec.start, spec.end);
    if (t === 0 || t === 1) return 0;
    return 0.9 * (1 - t);
  });
  return (
    <Circle cx={spec.x} cy={spec.y} r={r} color={spec.color} style="stroke" strokeWidth={spec.width} opacity={opacity} />
  );
};

const Flash = ({
  progress,
  width,
  height,
  color,
  peak,
  start = 0,
  end = 0.3,
}: {
  progress: Progress;
  width: number;
  height: number;
  color: string;
  peak: number;
  start?: number;
  end?: number;
}) => {
  const opacity = useDerivedValue(() => {
    const t = windowT(progress.value, start, end);
    if (t === 0 || t === 1) return 0;
    // Fast attack, slow decay.
    return t < 0.25 ? (t / 0.25) * peak : peak * (1 - (t - 0.25) / 0.75);
  });
  return <Rect x={0} y={0} width={width} height={height} color={color} opacity={opacity} />;
};

function makeSparks(
  rand: () => number,
  count: number,
  opts: {
    x0: number;
    y0: number;
    colors: string[];
    minDist: number;
    maxDist: number;
    minSize: number;
    maxSize: number;
    gravity: number;
    start: number;
    end: number;
    /** Centre direction in radians; spread is +/- around it. Omit for full circle. */
    angle?: number;
    spread?: number;
  }
): SparkSpec[] {
  const sparks: SparkSpec[] = [];
  for (let i = 0; i < count; i++) {
    const angle =
      opts.angle !== undefined
        ? opts.angle + (rand() - 0.5) * (opts.spread ?? Math.PI / 2)
        : rand() * Math.PI * 2;
    sparks.push({
      x0: opts.x0,
      y0: opts.y0,
      angle,
      dist: opts.minDist + rand() * (opts.maxDist - opts.minDist),
      size: opts.minSize + rand() * (opts.maxSize - opts.minSize),
      color: opts.colors[Math.floor(rand() * opts.colors.length)] ?? '#FFFFFF',
      gravity: opts.gravity * (0.6 + rand() * 0.8),
      start: opts.start + rand() * 0.08,
      end: opts.end,
    });
  }
  return sparks;
}

// ---------------------------------------------------------------------------
// Scenes
// ---------------------------------------------------------------------------

const MissileLaunchScene = ({
  progress,
  width,
  height,
  seed,
}: {
  progress: Progress;
  width: number;
  height: number;
  seed: number;
}) => {
  const origin = { x: width / 2, y: height * 0.78 };

  const sparks = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 1), 26, {
        x0: origin.x,
        y0: origin.y,
        colors: ['#FFC107', '#FF5722', '#FFE082', '#FF8A65'],
        minDist: 40,
        maxDist: width * 0.42,
        minSize: 2,
        maxSize: 5,
        gravity: 130,
        start: 0.05,
        end: 0.8,
      }),
    [seed, width, origin.x, origin.y]
  );

  const missileTransform = useDerivedValue(() => {
    const t = windowT(progress.value, 0.06, 0.62);
    const climb = t * t; // accelerate off the pad
    const sway = Math.sin(t * Math.PI * 4) * 7 * (1 - t);
    return [
      { translateX: origin.x + sway },
      { translateY: origin.y - (origin.y + 160) * climb },
      { rotate: -Math.PI / 2 + sway * 0.012 },
      { scale: 2.4 },
    ];
  });
  const missileOpacity = useDerivedValue(() => (progress.value < 0.04 ? 0 : 1));

  // Exhaust flame flickers at the tail (local -x once rotated to point up).
  const exhaustR = useDerivedValue(() => 5 + Math.abs(Math.sin(progress.value * 70)) * 4);

  const rings: RingSpec[] = [
    { x: origin.x, y: origin.y, maxR: width * 0.32, width: 3, color: '#FF7043', start: 0.05, end: 0.5 },
    { x: origin.x, y: origin.y, maxR: width * 0.46, width: 2.4, color: '#FFAB91', start: 0.12, end: 0.62 },
    { x: origin.x, y: origin.y, maxR: width * 0.6, width: 1.8, color: '#FFE0B2', start: 0.2, end: 0.74 },
  ];

  return (
    <Group>
      <Flash progress={progress} width={width} height={height} color="#FF6B35" peak={0.16} end={0.32} />
      {rings.map((spec, i) => (
        <ShockRing key={`ring-${i}`} progress={progress} spec={spec} />
      ))}
      {sparks.map((spec, i) => (
        <Spark key={`spark-${i}`} progress={progress} spec={spec} />
      ))}
      <Group transform={missileTransform} opacity={missileOpacity}>
        <Circle cx={-24} cy={0} r={exhaustR} color="#FFA726">
          <BlurMask blur={6} style="solid" />
        </Circle>
        <Group>
          <BlurMask blur={3} style="solid" />
          <Path path={MISSILE_PATH} color="#FF5722" />
        </Group>
      </Group>
    </Group>
  );
};

const LandmineArmScene = ({
  progress,
  width,
  height,
  seed,
}: {
  progress: Progress;
  width: number;
  height: number;
  seed: number;
}) => {
  const origin = { x: width / 2, y: height * 0.58 };

  const sparks = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 2), 18, {
        x0: origin.x,
        y0: origin.y,
        colors: ['#FF5252', '#FF8A80', '#FFAB91'],
        minDist: 30,
        maxDist: width * 0.3,
        minSize: 1.6,
        maxSize: 4,
        gravity: 80,
        start: 0.08,
        end: 0.85,
      }),
    [seed, width, origin.x, origin.y]
  );

  // Targeting ring locks in: collapses onto the mine, then holds.
  const lockR = useDerivedValue(() => {
    const t = windowT(progress.value, 0.05, 0.45);
    return 86 - 52 * easeOutCubic(t);
  });
  const lockOpacity = useDerivedValue(() => {
    const fadeIn = windowT(progress.value, 0, 0.1);
    const fadeOut = 1 - windowT(progress.value, 0.8, 1);
    return 0.95 * fadeIn * fadeOut;
  });

  // Armed core pulses like a live explosive.
  const coreR = useDerivedValue(() => 16 + Math.sin(progress.value * Math.PI * 6) * 6);
  const coreOpacity = useDerivedValue(() => 0.85 * (1 - windowT(progress.value, 0.7, 1)));

  const rings: RingSpec[] = [
    { x: origin.x, y: origin.y, maxR: width * 0.3, width: 2.6, color: '#FF1744', start: 0.3, end: 0.75 },
    { x: origin.x, y: origin.y, maxR: width * 0.42, width: 2, color: '#FF8A80', start: 0.42, end: 0.9 },
  ];

  return (
    <Group>
      <Flash progress={progress} width={width} height={height} color="#FF1744" peak={0.1} end={0.3} />
      <Circle cx={origin.x} cy={origin.y} r={lockR} color="#FF1744" style="stroke" strokeWidth={3} opacity={lockOpacity} />
      <Circle cx={origin.x} cy={origin.y} r={coreR} color="#FF5252" opacity={coreOpacity}>
        <BlurMask blur={8} style="solid" />
      </Circle>
      {rings.map((spec, i) => (
        <ShockRing key={`ring-${i}`} progress={progress} spec={spec} />
      ))}
      {sparks.map((spec, i) => (
        <Spark key={`spark-${i}`} progress={progress} spec={spec} />
      ))}
    </Group>
  );
};

const LootDropScene = ({
  progress,
  width,
  height,
  seed,
}: {
  progress: Progress;
  width: number;
  height: number;
  seed: number;
}) => {
  const landing = { x: width / 2, y: height * 0.5 };
  const IMPACT = 0.42;

  const sparks = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 3), 26, {
        x0: landing.x,
        y0: landing.y,
        colors: ['#FFD54F', '#FFC107', '#FFF8E1', '#FFB300'],
        minDist: 36,
        maxDist: width * 0.36,
        minSize: 2,
        maxSize: 5,
        gravity: 150,
        start: IMPACT,
        end: 1,
        angle: -Math.PI / 2,
        spread: Math.PI * 1.5,
      }),
    [seed, width, landing.x, landing.y]
  );

  // Golden "supply comet" falls in from above the screen.
  const cometY = useDerivedValue(() => {
    const t = windowT(progress.value, 0, IMPACT);
    return -70 + (landing.y + 70) * t * t;
  });
  const cometOpacity = useDerivedValue(() => (progress.value < IMPACT ? 1 : 0));
  const trailY = useDerivedValue(() => {
    const t = windowT(progress.value, 0, IMPACT);
    return -70 + (landing.y + 70) * t * t - 36;
  });

  const rings: RingSpec[] = [
    { x: landing.x, y: landing.y, maxR: width * 0.3, width: 3, color: '#FFC107', start: IMPACT, end: 0.78 },
    { x: landing.x, y: landing.y, maxR: width * 0.44, width: 2, color: '#FFE082', start: IMPACT + 0.08, end: 0.92 },
  ];

  return (
    <Group>
      <Flash progress={progress} width={width} height={height} color="#FFC107" peak={0.12} start={IMPACT} end={IMPACT + 0.25} />
      <Circle cx={landing.x} cy={trailY} r={7} color="#FFE082" opacity={cometOpacity}>
        <BlurMask blur={10} style="solid" />
      </Circle>
      <Circle cx={landing.x} cy={cometY} r={11} color="#FFC107" opacity={cometOpacity}>
        <BlurMask blur={5} style="solid" />
      </Circle>
      {rings.map((spec, i) => (
        <ShockRing key={`ring-${i}`} progress={progress} spec={spec} />
      ))}
      {sparks.map((spec, i) => (
        <Spark key={`spark-${i}`} progress={progress} spec={spec} />
      ))}
    </Group>
  );
};

const ShieldUpScene = ({
  progress,
  width,
  height,
  seed,
}: {
  progress: Progress;
  width: number;
  height: number;
  seed: number;
}) => {
  const center = { x: width / 2, y: height / 2 };

  const sparks = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 4), 20, {
        x0: center.x,
        y0: center.y,
        colors: ['#4FC3F7', '#81D4FA', '#E1F5FE'],
        minDist: 60,
        maxDist: width * 0.4,
        minSize: 1.8,
        maxSize: 4,
        gravity: -60, // drift upward, like energy motes
        start: 0.1,
        end: 0.95,
      }),
    [seed, width, center.x, center.y]
  );

  // Soft protective dome swelling outward.
  const domeR = useDerivedValue(() => {
    const t = windowT(progress.value, 0, 0.55);
    return width * 0.45 * easeOutCubic(t);
  });
  const domeOpacity = useDerivedValue(() => 0.22 * (1 - windowT(progress.value, 0.45, 1)));

  const rings: RingSpec[] = [
    { x: center.x, y: center.y, maxR: width * 0.28, width: 3, color: '#29B6F6', start: 0, end: 0.5 },
    { x: center.x, y: center.y, maxR: width * 0.4, width: 2.6, color: '#4FC3F7', start: 0.12, end: 0.66 },
    { x: center.x, y: center.y, maxR: width * 0.52, width: 2, color: '#B3E5FC', start: 0.26, end: 0.84 },
  ];

  return (
    <Group>
      <Flash progress={progress} width={width} height={height} color="#29B6F6" peak={0.1} end={0.35} />
      <Circle cx={center.x} cy={center.y} r={domeR} color="#4FC3F7" opacity={domeOpacity}>
        <BlurMask blur={24} style="normal" />
      </Circle>
      {rings.map((spec, i) => (
        <ShockRing key={`ring-${i}`} progress={progress} spec={spec} />
      ))}
      {sparks.map((spec, i) => (
        <Spark key={`spark-${i}`} progress={progress} spec={spec} />
      ))}
    </Group>
  );
};

const CoinBurstScene = ({
  progress,
  width,
  height,
  seed,
  big,
}: {
  progress: Progress;
  width: number;
  height: number;
  seed: number;
  big: boolean;
}) => {
  const origin = { x: width / 2, y: height * 0.55 };

  const coins = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 5), big ? 34 : 20, {
        x0: origin.x,
        y0: origin.y,
        colors: ['#FFD54F', '#FFC107', '#FFB300', '#FFE082'],
        minDist: 70,
        maxDist: width * (big ? 0.5 : 0.38),
        minSize: 4,
        maxSize: big ? 9 : 7,
        gravity: 280,
        start: 0,
        end: 1,
        angle: -Math.PI / 2, // fountain upward, gravity brings them back down
        spread: Math.PI * 1.1,
      }),
    [seed, width, big, origin.x, origin.y]
  );

  const sparkles = useMemo(
    () =>
      makeSparks(mulberry32(seed * 7919 + 6), big ? 16 : 8, {
        x0: origin.x,
        y0: origin.y,
        colors: ['#FFFFFF', '#FFF8E1'],
        minDist: 40,
        maxDist: width * 0.3,
        minSize: 1.5,
        maxSize: 3,
        gravity: 40,
        start: 0.05,
        end: 0.9,
      }),
    [seed, width, big, origin.x, origin.y]
  );

  const rings: RingSpec[] = big
    ? [
        { x: origin.x, y: origin.y, maxR: width * 0.3, width: 3, color: '#FFD54F', start: 0, end: 0.5 },
        { x: origin.x, y: origin.y, maxR: width * 0.46, width: 2, color: '#FFF8E1', start: 0.12, end: 0.7 },
      ]
    : [{ x: origin.x, y: origin.y, maxR: width * 0.26, width: 2.4, color: '#FFD54F', start: 0, end: 0.55 }];

  return (
    <Group>
      {big && <Flash progress={progress} width={width} height={height} color="#FFD54F" peak={0.12} end={0.3} />}
      {rings.map((spec, i) => (
        <ShockRing key={`ring-${i}`} progress={progress} spec={spec} />
      ))}
      {coins.map((spec, i) => (
        <Spark key={`coin-${i}`} progress={progress} spec={spec} />
      ))}
      {sparkles.map((spec, i) => (
        <Spark key={`sparkle-${i}`} progress={progress} spec={spec} />
      ))}
    </Group>
  );
};

// ---------------------------------------------------------------------------
// Overlay host
// ---------------------------------------------------------------------------

const GameEffectsOverlay: React.FC = () => {
  const { width, height } = useWindowDimensions();
  const [event, setEvent] = useState<GameEffectEvent | null>(null);
  const progress = useSharedValue(0);

  const clear = useCallback(() => setEvent(null), []);

  useEffect(() => onGameEffect(setEvent), []);

  useEffect(() => {
    if (!event) return;
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: DURATION_MS[event.type], easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(clear)();
      }
    );
  }, [event, progress, clear]);

  if (!event) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      <Canvas style={StyleSheet.absoluteFill}>
        {event.type === 'missileLaunch' && (
          <MissileLaunchScene progress={progress} width={width} height={height} seed={event.id} />
        )}
        {event.type === 'landmineArm' && (
          <LandmineArmScene progress={progress} width={width} height={height} seed={event.id} />
        )}
        {event.type === 'lootDrop' && (
          <LootDropScene progress={progress} width={width} height={height} seed={event.id} />
        )}
        {event.type === 'shieldUp' && (
          <ShieldUpScene progress={progress} width={width} height={height} seed={event.id} />
        )}
        {event.type === 'coinBurst' && (
          <CoinBurstScene progress={progress} width={width} height={height} seed={event.id} big={false} />
        )}
        {event.type === 'purchaseSuccess' && (
          <CoinBurstScene progress={progress} width={width} height={height} seed={event.id} big={true} />
        )}
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});

export default GameEffectsOverlay;
