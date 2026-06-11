import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import MissileSkiaBackground from './onboarding/MissileSkiaBackground';

const STATUS_LINES = [
  'Establishing battlefield link...',
  'Scanning local airspace...',
  'Syncing missile telemetry...',
  'Calibrating radar sweep...',
];

/**
 * Shown on the map tab while the player's alive-state / first websocket data
 * is still unknown (e.g. right after login) — replaces the old behaviour of
 * flashing the death screen before the connection settled.
 */
export function ConnectingScreen() {
  const pulse = useSharedValue(0.4);
  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.4, { duration: 900, easing: Easing.inOut(Easing.quad) })
      ),
      -1
    );
  }, [pulse]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setStatusIndex((index) => (index + 1) % STATUS_LINES.length);
    }, 2200);
    return () => clearInterval(intervalId);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.container}>
      <MissileSkiaBackground accentColor="#64b5f6" />
      <View style={styles.content}>
        <Image
          source={require('../assets/icons/MissleWarsTitle.png')}
          style={styles.title}
          contentFit="contain"
        />
        <Animated.Text style={[styles.statusText, pulseStyle]}>
          {STATUS_LINES[statusIndex]}
        </Animated.Text>
        <Text style={styles.hintText}>Connecting to the battlefield</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060818',
  },
  content: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    width: 280,
    height: 92,
    marginBottom: 28,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#a0c4ff',
    textAlign: 'center',
  },
  hintText: {
    marginTop: 10,
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
  },
});

export default ConnectingScreen;
