import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image, Animated } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import { getlocation } from '../util/locationreq';

mobileAds()
  .initialize()
  .then(adapterStatuses => {
    // Initialization complete!
  });

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    getlocation();
    const timer = setTimeout(() => {
      onFinish();
    }, 2000); // 2 seconds splash screen

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    return () => clearTimeout(timer);
  }, [onFinish, fadeAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ ...styles.bannerContainer, opacity: fadeAnim }}>
        <Image source={require('../assets/icons/MissleWarsTitle.png')} style={styles.banner} />
      </Animated.View>
      <Text style={styles.text}>Loading...</Text>
      <ActivityIndicator size="small" color="#0000ff" />
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
  bannerContainer: {
    marginBottom: 20,
  },
  banner: {
    width: 300,
    height: 100,
    resizeMode: 'contain',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default SplashScreen;
