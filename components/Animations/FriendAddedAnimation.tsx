import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type FriendAddedAnimationProps = {
  onAnimationComplete: () => void;
};

const FriendAddedAnimation: React.FC<FriendAddedAnimationProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(Array(6).fill(null).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.cubic),
      }),
      ...sparkleAnims.map((anim) =>
        Animated.sequence([
          Animated.delay(Math.random() * 200),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
            easing: Easing.out(Easing.cubic),
          }),
        ])
      ),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          ...sparkleAnims.map((anim) =>
            Animated.timing(anim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            })
          ),
        ]).start(onAnimationComplete);
      }, 1000);
    });
  }, []);

  const iconColor = isDarkMode ? '#FFFFFF' : '#000000';

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <Animated.View style={[
        styles.iconContainer,
        {
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        },
      ]}>
        <Ionicons name="person-add" size={60} color={iconColor} />
        {sparkleAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                transform: [
                  { scale: anim },
                  { rotate: `${index * 60}deg` },
                  { translateX: 50 },
                ],
                opacity: anim,
              },
            ]}
          />
        ))}
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
  iconContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50', // Green color for friend-related sparkles
  },
});

export default FriendAddedAnimation;
