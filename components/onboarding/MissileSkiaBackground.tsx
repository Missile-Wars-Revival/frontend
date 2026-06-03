import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
  Line,
  Path,
  Skia,
  BlurMask,
  useClock,
} from '@shopify/react-native-skia';
import { useDerivedValue } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Radar / map centre — sits in the upper-middle so content below stays readable.
const CX = width / 2;
const CY = height * 0.4;
const RANGE = Math.max(width, height) * 0.62;
const GRID = 64;

type Props = {
  /** Per-slide accent so the radar themes with the active slide. */
  accentColor?: string;
};

// Local missile silhouette (reused from the splash screen aesthetic).
const MISSILE_PATH = Skia.Path.MakeFromSVGString(
  'M -11 -3 L 7 -3 L 7 3 L -11 3 Z' + // body
    ' M 7 -3 L 18 0 L 7 3 Z' + // nose
    ' M -11 -3 L -19 -9 L -6 -3 Z' + // top fin
    ' M -11 3 L -19 9 L -6 3 Z' // bottom fin
)!;

// Rotating radar sweep wedge (built once in local space around the origin).
const SWEEP_PATH = (() => {
  const p = Skia.Path.Make();
  p.moveTo(0, 0);
  p.lineTo(RANGE * 0.56, -RANGE * 0.12);
  p.lineTo(RANGE * 0.56, RANGE * 0.04);
  p.close();
  return p;
})();

// Static "enemy" blips scattered across the map that emit radar pings.
const S0 = { x: width * 0.24, y: height * 0.22, period: 2400, phase: 0.0 };
const S1 = { x: width * 0.78, y: height * 0.31, period: 2800, phase: 0.45 };
const S2 = { x: width * 0.62, y: height * 0.56, period: 2600, phase: 0.8 };

// Missile flight lanes — parabolic arcs across the screen.
const L0 = { startX: -60, endX: width + 60, baseY: height * 0.3, arc: 120, period: 5200, phase: 0.0 };
const L1 = { startX: width + 60, endX: -60, baseY: height * 0.5, arc: 90, period: 6400, phase: 0.4 };
const L2 = { startX: -60, endX: width + 60, baseY: height * 0.64, arc: 150, period: 7200, phase: 0.7 };

const MissileSkiaBackground: React.FC<Props> = ({ accentColor = '#64b5f6' }) => {
  const clock = useClock();

  const stars = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        x: ((i * 73) % width) + 6,
        y: ((i * 137) % height) + 8,
        r: 0.6 + (i % 3) * 0.5,
      })),
    []
  );

  // Diagonal drift for the battlefield grid (modulo spacing for a seamless loop).
  const gridDrift = useDerivedValue(() => {
    const d = (clock.value / 70) % GRID;
    return [{ translateX: -d * 0.4 }, { translateY: d }];
  });

  // Rotating radar sweep.
  const sweepRot = useDerivedValue(() => [{ rotate: (clock.value / 4200) * Math.PI * 2 }]);

  // --- Radar ping rings (radius + opacity per site) ---
  const ping0r = useDerivedValue(() => (((clock.value / S0.period) + S0.phase) % 1) * RANGE * 0.55);
  const ping0o = useDerivedValue(() => (1 - ((clock.value / S0.period) + S0.phase) % 1) * 0.5);
  const ping1r = useDerivedValue(() => (((clock.value / S1.period) + S1.phase) % 1) * RANGE * 0.55);
  const ping1o = useDerivedValue(() => (1 - ((clock.value / S1.period) + S1.phase) % 1) * 0.5);
  const ping2r = useDerivedValue(() => (((clock.value / S2.period) + S2.phase) % 1) * RANGE * 0.55);
  const ping2o = useDerivedValue(() => (1 - ((clock.value / S2.period) + S2.phase) % 1) * 0.5);
  const pingItems = [
    { x: S0.x, y: S0.y, r: ping0r, o: ping0o },
    { x: S1.x, y: S1.y, r: ping1r, o: ping1o },
    { x: S2.x, y: S2.y, r: ping2r, o: ping2o },
  ];

  // --- Missile transforms (translate + rotate to flight tangent) ---
  const m0 = useDerivedValue(() => {
    const p = ((clock.value / L0.period) + L0.phase) % 1;
    const x = L0.startX + (L0.endX - L0.startX) * p;
    const y = L0.baseY - L0.arc * Math.sin(p * Math.PI);
    const rot = Math.atan2(-L0.arc * Math.PI * Math.cos(p * Math.PI), L0.endX - L0.startX);
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });
  const m1 = useDerivedValue(() => {
    const p = ((clock.value / L1.period) + L1.phase) % 1;
    const x = L1.startX + (L1.endX - L1.startX) * p;
    const y = L1.baseY - L1.arc * Math.sin(p * Math.PI);
    const rot = Math.atan2(-L1.arc * Math.PI * Math.cos(p * Math.PI), L1.endX - L1.startX);
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });
  const m2 = useDerivedValue(() => {
    const p = ((clock.value / L2.period) + L2.phase) % 1;
    const x = L2.startX + (L2.endX - L2.startX) * p;
    const y = L2.baseY - L2.arc * Math.sin(p * Math.PI);
    const rot = Math.atan2(-L2.arc * Math.PI * Math.cos(p * Math.PI), L2.endX - L2.startX);
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });
  const missileItems = [m0, m1, m2];

  // Pre-built grid line offsets covering an over-sized area so drift never reveals an edge.
  const hLines = useMemo(
    () => Array.from({ length: Math.ceil(height / GRID) + 3 }, (_, i) => (i - 1) * GRID),
    []
  );
  const vLines = useMemo(
    () => Array.from({ length: Math.ceil(width / GRID) + 3 }, (_, i) => (i - 1) * GRID),
    []
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Faint starfield */}
        {stars.map((s) => (
          <Circle key={`star-${s.id}`} cx={s.x} cy={s.y} r={s.r} color="rgba(255,255,255,0.22)" />
        ))}

        {/* Drifting battlefield grid */}
        <Group transform={gridDrift} opacity={0.18}>
          {hLines.map((y) => (
            <Line key={`h-${y}`} p1={{ x: -GRID, y }} p2={{ x: width + GRID, y }} color={accentColor} strokeWidth={1} />
          ))}
          {vLines.map((x) => (
            <Line key={`v-${x}`} p1={{ x, y: -GRID }} p2={{ x, y: height + GRID }} color={accentColor} strokeWidth={1} />
          ))}
        </Group>

        {/* Concentric radar range rings */}
        <Group opacity={0.25}>
          <Circle cx={CX} cy={CY} r={RANGE * 0.2} color={accentColor} style="stroke" strokeWidth={1.5} />
          <Circle cx={CX} cy={CY} r={RANGE * 0.38} color={accentColor} style="stroke" strokeWidth={1.2} />
          <Circle cx={CX} cy={CY} r={RANGE * 0.56} color={accentColor} style="stroke" strokeWidth={1} />
        </Group>

        {/* Rotating radar sweep wedge */}
        <Group transform={[{ translateX: CX }, { translateY: CY }]}>
          <Group transform={sweepRot} opacity={0.22}>
            <Path path={SWEEP_PATH} color={accentColor}>
              <BlurMask blur={6} style="normal" />
            </Path>
          </Group>
        </Group>

        {/* Enemy blips + expanding radar pings */}
        {pingItems.map((site, i) => (
          <Group key={`site-${i}`}>
            <Circle cx={site.x} cy={site.y} r={site.r} color={accentColor} style="stroke" strokeWidth={2} opacity={site.o} />
            <Circle cx={site.x} cy={site.y} r={4} color={accentColor}>
              <BlurMask blur={3} style="solid" />
            </Circle>
            <Circle cx={site.x} cy={site.y} r={1.8} color="#ffffff" />
          </Group>
        ))}

        {/* Arcing missiles with glowing heads and trails */}
        {missileItems.map((transform, i) => (
          <Group key={`missile-${i}`} transform={transform}>
            <Line p1={{ x: -46, y: 0 }} p2={{ x: -6, y: 0 }} color="rgba(255,255,255,0.35)" strokeWidth={2.2} />
            <Circle cx={-50} cy={0} r={2} color="#FFA500" opacity={0.7} />
            <Group>
              <BlurMask blur={4} style="solid" />
              <Path path={MISSILE_PATH} color={i % 2 === 0 ? '#FF5722' : '#FFC107'} />
            </Group>
          </Group>
        ))}
      </Canvas>
    </View>
  );
};

export default MissileSkiaBackground;
