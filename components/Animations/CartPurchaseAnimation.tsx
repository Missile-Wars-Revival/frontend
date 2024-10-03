import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing, useColorScheme } from 'react-native';
import { itemimages } from '../../app/profile';
import { Product } from '../../api/store';

type CartPurchaseAnimationProps = {
  cartItems: { product: Product; quantity: number }[];
  onAnimationComplete: () => void;
};

const CartPurchaseAnimation: React.FC<CartPurchaseAnimationProps> = ({ cartItems, onAnimationComplete }) => {
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
      }, 1000);
    });
  }, []);

  return (
    <View style={[
      styles.container,
      { backgroundColor: colorScheme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <Animated.View style={[styles.itemsContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        {cartItems.map((item, index) => (
          <Image 
            key={index} 
            source={itemimages[item.product.name]} 
            style={[styles.itemImage, { transform: [{ rotate: `${index * (360 / cartItems.length)}deg` }, { translateY: -50 }] }]} 
          />
        ))}
        {sparkleAnims.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.sparkle,
              {
                transform: [
                  { scale: anim },
                  { rotate: `${index * 60}deg` },
                  { translateX: 70 },
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
  itemsContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    position: 'absolute',
    width: 50,
    height: 50,
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

export default CartPurchaseAnimation;
