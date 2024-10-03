import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';
import { itemimages } from '../../app/profile';

type ItemCollectAnimationProps = {
  itemName: string;
  onAnimationComplete: () => void;
};

const ItemCollectAnimation: React.FC<ItemCollectAnimationProps> = ({ itemName, onAnimationComplete }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnims = useRef(Array(6).fill(null).map(() => new Animated.Value(0))).current;
  const colorScheme = useColorScheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
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
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(onAnimationComplete);
      }, 500);
    });
  }, []);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <Animated.View style={[styles.itemContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <Image source={itemimages[itemName]} style={styles.itemImage} />
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
    // Remove the backgroundColor from here
  },
  itemContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFD700', // Gold color for sparkles
  },
});

export default ItemCollectAnimation;