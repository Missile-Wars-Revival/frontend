import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type MissileFiringAnimationProps = {
  onAnimationComplete: () => void;
};

const MissileFiringAnimation: React.FC<MissileFiringAnimationProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const missileAnim = useRef(new Animated.Value(0)).current;
  const explosionAnim = useRef(new Animated.Value(0)).current;
  const smokeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(missileAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }),
      Animated.timing(smokeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start(() => {
      Animated.sequence([
        Animated.timing(explosionAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
          easing: Easing.out(Easing.exp),
        }),
        Animated.timing(explosionAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start(onAnimationComplete);
    });
  }, []);

  const missileStyle = {
    transform: [
      {
        translateY: missileAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-150, 0],
        }),
      },
      {
        scale: missileAnim.interpolate({
          inputRange: [0, 0.8, 1],
          outputRange: [0.5, 0.5, 0],
        }),
      },
    ],
  };

  const smokeStyle = {
    opacity: smokeAnim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 0.8, 0.2, 0],
    }),
    transform: [
      {
        translateY: smokeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-100, 50],
        }),
      },
      {
        scale: smokeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 2],
        }),
      },
    ],
  };

  const explosionStyle = {
    opacity: explosionAnim,
    transform: [
      {
        scale: explosionAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.5, 3, 2.5],
        }),
      },
    ],
  };

  const flameStyle = {
    opacity: missileAnim.interpolate({
      inputRange: [0, 0.2, 0.8, 1],
      outputRange: [0, 1, 1, 0],
    }),
    transform: [
      {
        scaleY: missileAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 2],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.smoke, smokeStyle]} />
      <Animated.View style={[styles.missile, missileStyle]}>
        <LinearGradient
          colors={isDarkMode ? ['#303030', '#505050'] : ['#A0A0A0', '#C0C0C0']}
          style={styles.missileGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.flame, flameStyle]}>
        <LinearGradient
          colors={['#FF4500', '#FFA500', '#FFFF00']}
          style={styles.flameGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.explosion, explosionStyle]}>
        <LinearGradient
          colors={['#FF8C00', '#FF4500']}
          style={styles.explosionGradient}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missile: {
    width: 20,
    height: 60,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    overflow: 'hidden',
  },
  missileGradient: {
    flex: 1,
  },
  smoke: {
    position: 'absolute',
    width: 40,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(200, 200, 200, 0.6)',
  },
  flame: {
    position: 'absolute',
    width: 30,
    height: 80,
    bottom: -40,
    overflow: 'hidden',
  },
  flameGradient: {
    flex: 1,
  },
  explosion: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
  },
  explosionGradient: {
    flex: 1,
  },
});

export default MissileFiringAnimation;