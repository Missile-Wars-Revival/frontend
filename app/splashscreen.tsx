import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Canvas, Path, Skia, Group, Circle, Rect } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, useDerivedValue, Easing } from 'react-native-reanimated';
import { getlocation } from '../util/locationreq';
import { getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from '../util/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSecureItemSafely } from '../util/secure-store';

interface SplashScreenProps {
  onFinish: (isAuthenticated: boolean) => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [loadingText, setLoadingText] = useState('Initializing connection...');
  const { width, height } = useWindowDimensions();

  const cx = width / 2;
  const cy = height / 2 - 40;
  const orbitRx = width * 0.44;
  const orbitRy = height * 0.13;

  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(
      withTiming(Math.PI * 2, { duration: 4500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const missilePath = useMemo(() =>
    Skia.Path.MakeFromSVGString(
      'M -13 -4 L 9 -4 L 9 4 L -13 4 Z' +
      ' M 9 -4 L 23 0 L 9 4 Z' +
      ' M -13 -4 L -23 -12 L -7 -4 Z' +
      ' M -13 4 L -23 12 L -7 4 Z'
    )!, []);

  const exhaustPath = useMemo(() =>
    Skia.Path.MakeFromSVGString('M -13 -2.5 L -30 0 L -13 2.5 Z')!, []);

  const stars = useMemo(() =>
    Array.from({ length: 100 }, (_, i) => ({
      x: ((Math.sin(i * 127.1 + 311) + 1) / 2) * width,
      y: ((Math.sin(i * 311.7 + 74) + 1) / 2) * height,
      r: 0.5 + ((Math.sin(i * 74.3) + 1) / 2) * 1.5,
      a: 0.25 + ((Math.sin(i * 53.1) + 1) / 2) * 0.6,
    })),
    [width, height]
  );

  const rocket0 = useDerivedValue(() => {
    const angle = t.value;
    const x = cx + orbitRx * Math.cos(angle);
    const y = cy + orbitRy * Math.sin(angle);
    const rot = Math.atan2(orbitRy * Math.cos(angle), -orbitRx * Math.sin(angle));
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });

  const rocket1 = useDerivedValue(() => {
    const angle = t.value + (2 * Math.PI) / 3;
    const x = cx + orbitRx * Math.cos(angle);
    const y = cy + orbitRy * Math.sin(angle);
    const rot = Math.atan2(orbitRy * Math.cos(angle), -orbitRx * Math.sin(angle));
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });

  const rocket2 = useDerivedValue(() => {
    const angle = t.value + (4 * Math.PI) / 3;
    const x = cx + orbitRx * Math.cos(angle);
    const y = cy + orbitRy * Math.sin(angle);
    const rot = Math.atan2(orbitRy * Math.cos(angle), -orbitRx * Math.sin(angle));
    return [{ translateX: x }, { translateY: y }, { rotate: rot }];
  });

  // Wraps Animated.timing in a Promise so each step can be properly awaited
  const animateProgress = (toValue: number, duration: number) =>
    new Promise<void>(resolve =>
      Animated.timing(progressAnim, { toValue, duration, useNativeDriver: false })
        .start(() => resolve())
    );

  const initializeAsyncStorageValues = async () => {
    const keysToInitialize = [
      { key: 'visibilitymode', defaultValue: 'global' },
      { key: 'selectedMapStyle', defaultValue: 'default' },
      { key: 'regionlocation', defaultValue: JSON.stringify({ latitude: 0, longitude: 0, latitudeDelta: 0.0922, longitudeDelta: 0.0421 }) },
      { key: 'firstload', defaultValue: 'true' },
      { key: 'dbconnection', defaultValue: 'false' },
      { key: 'isAlive', defaultValue: 'true' },
      { key: 'signedIn', defaultValue: 'false' },
      { key: 'locActive', defaultValue: 'false' },
    ];

    for (const { key, defaultValue } of keysToInitialize) {
      const value = await AsyncStorage.getItem(key);
      if (value === null) {
        await AsyncStorage.setItem(key, defaultValue);
      }
    }
  };

  useEffect(() => {
    const initializeAppLoad = async () => {
      try {
        // Step 1: location + animate to 33% in parallel (whichever is slower wins)
        setLoadingText('Initializing connection...');
        await Promise.all([
          getlocation(),
          animateProgress(0.33, 900),
        ]);

        // Step 2: Firebase (instant) + animate to 60%
        setLoadingText('Connecting to servers...');
        if (getApps().length === 0) initializeApp(firebaseConfig);
        await animateProgress(0.6, 500);

        // Step 3: AsyncStorage init + animate to 85%
        setLoadingText('Setting up storage...');
        await Promise.all([
          initializeAsyncStorageValues(),
          animateProgress(0.85, 600),
        ]);

        // Step 4: Auth check + fill bar to 100%
        setLoadingText('Loading assets...');
        const username = await getSecureItemSafely('username');
        const isAuthenticated = !!username;
        await animateProgress(1.0, 400);

        setTimeout(() => onFinish(isAuthenticated), 2000);
      } catch (error) {
        console.error("Error during app initialization:", error);
        onFinish(false);
      }
    };

    initializeAppLoad();
    Animated.timing(fadeAnim, { toValue: 1, duration: 1200, useNativeDriver: true }).start();
  }, [onFinish, fadeAnim]);

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height} color="#060818" />

        {stars.map((s, i) => (
          <Circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            color={`rgba(200,220,255,${s.a.toFixed(2)})`}
          />
        ))}

        <Group transform={rocket0}>
          <Path path={exhaustPath} color="#FFA500" opacity={0.75} />
          <Path path={missilePath} color="#FF4500" />
        </Group>
        <Group transform={rocket1}>
          <Path path={exhaustPath} color="#FFA500" opacity={0.75} />
          <Path path={missilePath} color="#FF4500" />
        </Group>
        <Group transform={rocket2}>
          <Path path={exhaustPath} color="#FFA500" opacity={0.75} />
          <Path path={missilePath} color="#FF4500" />
        </Group>
      </Canvas>

      <Animated.View style={[styles.bannerContainer, { opacity: fadeAnim }]}>
        <Image source={require('../assets/icons/MissleWarsTitle.png')} style={styles.banner} contentFit="contain" />
      </Animated.View>

      <Text style={styles.text}>{loadingText}</Text>

      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#060818',
  },
  bannerContainer: {
    marginBottom: 20,
  },
  banner: {
    width: 300,
    height: 100,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 20,
    color: '#a0c4ff',
    textAlign: 'center',
  },
  progressBarContainer: {
    width: '70%',
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#4fc3f7',
  },
});

export default SplashScreen;