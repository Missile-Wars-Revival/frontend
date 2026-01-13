import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated, useColorScheme, Dimensions } from 'react-native';
import { getlocation } from '../util/locationreq';
import { getApps, initializeApp } from "firebase/app";
import { firebaseConfig } from '../util/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [progressAnim] = useState(new Animated.Value(0));
  const [loadingText, setLoadingText] = useState('Initializing connection...');
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const initializeAppLoad = async () => {
      try {
        // Step 1: Initialize location
        setLoadingText('Initializing connection...');
        await getlocation();
        Animated.timing(progressAnim, {
          toValue: 0.2,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Step 2: Initialize Firebase
        setLoadingText('Connecting to servers...');
        let app;
        if (getApps().length === 0) {
          app = initializeApp(firebaseConfig);
        } else {
          app = getApps()[0];
        }
        Animated.timing(progressAnim, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Step 3: Initialize AsyncStorage
        setLoadingText('Setting up storage...');
        await initializeAsyncStorageValues();
        Animated.timing(progressAnim, {
          toValue: 0.8,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Step 4: Loading assets
        setLoadingText('Loading assets...');
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start();

        // Wait a bit for smooth transition
        setTimeout(() => {
          onFinish();
        }, 500);

      } catch (error) {
        console.error("Error during app initialization:", error);
        // Still finish even if there's an error
        onFinish();
      }
    };

    initializeAppLoad();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

  }, [onFinish, fadeAnim, progressAnim]);

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

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <Animated.View style={{ ...styles.bannerContainer, opacity: fadeAnim }}>
        <Image source={require('../assets/icons/MissleWarsTitle.png')} style={styles.banner} />
      </Animated.View>
      <Text style={[styles.text, isDarkMode && styles.textDark]}>{loadingText}</Text>
      <View style={[styles.progressBarContainer, isDarkMode && styles.progressBarContainerDark]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
              backgroundColor: isDarkMode ? '#4CAF50' : '#0000ff',
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
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
    textAlign: 'center',
  },
  textDark: {
    color: '#fff',
  },
  progressBarContainer: {
    width: '70%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarContainerDark: {
    backgroundColor: '#333',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SplashScreen;
