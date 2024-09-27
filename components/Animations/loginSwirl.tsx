import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';

type LoginSwirlProps = {
  onAnimationComplete: () => void;
};

const LoginSwirl: React.FC<LoginSwirlProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]);

    const fadeOutAnimation = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]);

    animation.start(() => {
      setTimeout(() => {
        fadeOutAnimation.start(onAnimationComplete);
      }, 500);
    });

    return () => {
      animation.stop();
      fadeOutAnimation.stop();
    };
  }, [onAnimationComplete]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.swirl,
          {
            opacity: opacityAnim,
            transform: [
              { scale: scaleAnim },
              { rotate },
              { rotateZ: '45deg' }, // Add this to replace the static transform in styles
            ],
            backgroundColor: isDarkMode ? '#4CAF50' : '#773765',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  swirl: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderTopLeftRadius: 0,
    // Remove the static transform from here
  },
});

export default LoginSwirl;
