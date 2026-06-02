import React, { useEffect, useMemo, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';

type MissileTrack = {
  laneY: number;
  speed: number;
  amplitude: number;
  frequency: number;
  phase: number;
  offset: number;
  direction: 1 | -1;
  color: string;
};

const { width, height } = Dimensions.get('window');

const TRACKS: MissileTrack[] = [
  { laneY: height * 0.2, speed: 0.07, amplitude: 16, frequency: 0.0012, phase: 0.2, offset: 30, direction: 1, color: '#ff7548' },
  { laneY: height * 0.32, speed: 0.05, amplitude: 22, frequency: 0.001, phase: 1.4, offset: 220, direction: -1, color: '#ffd35a' },
  { laneY: height * 0.46, speed: 0.065, amplitude: 14, frequency: 0.0014, phase: 2.1, offset: 120, direction: 1, color: '#8ee7ff' },
  { laneY: height * 0.62, speed: 0.045, amplitude: 18, frequency: 0.0011, phase: 0.8, offset: 300, direction: -1, color: '#ff9ec5' },
  { laneY: height * 0.74, speed: 0.06, amplitude: 12, frequency: 0.0015, phase: 2.8, offset: 80, direction: 1, color: '#92ffb0' },
];

const MissileSkiaBackground: React.FC = () => {
  const [timeMs, setTimeMs] = useState(0);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setTimeMs(Date.now() - startedAt);
    }, 33);

    return () => clearInterval(timer);
  }, []);

  const stars = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, index) => ({
        id: index,
        x: ((index * 53) % width) + 6,
        y: ((index * 97) % height) + 8,
        r: 0.8 + (index % 3) * 0.5,
      })),
    []
  );

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Canvas style={StyleSheet.absoluteFill}>
        {stars.map((star) => (
          <Circle
            key={`star-${star.id}`}
            cx={star.x}
            cy={star.y}
            r={star.r}
            color="rgba(255,255,255,0.30)"
          />
        ))}

        {TRACKS.map((track, idx) => {
          const travel = (timeMs * track.speed + track.offset) % (width + 140);
          const x = track.direction === 1 ? travel - 70 : width + 70 - travel;
          const y = track.laneY + Math.sin(timeMs * track.frequency + track.phase) * track.amplitude;
          const tailX = x - 34 * track.direction;
          const exhaustX = x - 40 * track.direction;

          return (
            <React.Fragment key={`missile-${idx}`}>
              <Line
                p1={{ x: tailX, y }}
                p2={{ x, y }}
                color="rgba(255,255,255,0.36)"
                strokeWidth={2.4}
              />
              <Circle cx={exhaustX} cy={y} r={1.8} color="rgba(255,255,255,0.45)" />
              <Circle cx={x} cy={y} r={3.5} color={track.color} />
            </React.Fragment>
          );
        })}
      </Canvas>
    </View>
  );
};

export default MissileSkiaBackground;
