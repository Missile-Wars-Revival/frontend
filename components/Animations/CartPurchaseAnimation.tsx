import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { getImages, Product } from '../../api/store';
import { EaseView, type Transition } from 'react-native-ease';
import { Presets } from 'react-native-pulsar';

type CartPurchaseAnimationProps = {
  cartItems: { product: Product; quantity: number }[];
  onAnimationComplete: () => void;
};

const CartPurchaseAnimation: React.FC<CartPurchaseAnimationProps> = ({ cartItems, onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

  // Declarative targets for Ease (replaces Animated.Values + ref)
  // High targets + initialAnimate={0} => Ease auto-animates in on mount (springy pop)
  const [containerScale, setContainerScale] = useState(1);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [itemScales, setItemScales] = useState(() => cartItems.map(() => 1));
  const [sparkleAnimates, setSparkleAnimates] = useState(() =>
    Array(6).fill({ scale: 1, opacity: 1 })
  );
  const [isExiting, setIsExiting] = useState(false);

  const exitTriggered = useRef(false);

  // Load dynamic product images (preserved from original)
  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  // Haptic on purchase success (pulsar for rich feedback)
  useEffect(() => {
    try {
      Presets.System.notificationSuccess();
    } catch {
      // silent fallback if haptics unsupported
    }
  }, []);

  // Phase-aware transitions (enter springy/bouncy, exit quick fade)
  const containerTransition: Transition = isExiting
    ? { type: 'timing', duration: 280, easing: 'easeIn' }
    : { type: 'spring', stiffness: 180, damping: 11 };

  const itemBaseTransition: Transition = isExiting
    ? { type: 'timing', duration: 220, easing: 'easeIn' }
    : { type: 'spring', stiffness: 220, damping: 8 };

  const sparkleBaseTransition = (index: number): Transition =>
    isExiting
      ? { type: 'timing', duration: 200, easing: 'easeIn' }
      : {
          type: 'timing',
          duration: 420,
          easing: 'easeOut',
          delay: 30 + index * 55,
        };

  const handleContainerEnd = (e: { finished: boolean }) => {
    if (e.finished && !exitTriggered.current) {
      exitTriggered.current = true;
      setIsExiting(true);
      setTimeout(() => {
        setContainerScale(0);
        setContainerOpacity(0);
        setItemScales(cartItems.map(() => 0));
        setSparkleAnimates(Array(6).fill({ scale: 0, opacity: 0 }));
        setTimeout(() => {
          onAnimationComplete();
        }, 300);
      }, 900);
    }
  };

  const numItems = Math.max(cartItems.length, 1);
  const itemAngleStep = 360 / numItems;

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <EaseView
        style={styles.itemsContainer}
        animate={{ scale: containerScale, opacity: containerOpacity }}
        initialAnimate={{ scale: 0, opacity: 0 }}
        transition={containerTransition}
        onTransitionEnd={handleContainerEnd}
      >
        {/* Purchased items arranged in circle, each with own spring pop */}
        {cartItems.map((item, index) => {
          const itemTransition: Transition = {
            ...itemBaseTransition,
            ...(isExiting ? {} : { delay: index * 40 }),
          };
          return (
            <EaseView
              key={index}
              style={[
                styles.itemImage,
                {
                  transform: [
                    { rotate: `${index * itemAngleStep}deg` },
                    { translateY: -55 },
                  ],
                },
              ]}
              animate={{ scale: itemScales[index] ?? 1 }}
              initialAnimate={{ scale: 0 }}
              transition={itemTransition}
            >
              <Image
                source={getImageForProduct(item.product.name)}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
              />
            </EaseView>
          );
        })}

        {/* Gold sparkles burst with stagger - reimagined as celebratory purchase confetti-like */}
        {sparkleAnimates.map((anim, index) => (
          <EaseView
            key={`sparkle-${index}`}
            style={[
              styles.sparkle,
              {
                transform: [
                  { rotate: `${index * 60}deg` },
                  { translateX: 72 },
                ],
              },
            ]}
            animate={anim}
            initialAnimate={{ scale: 0, opacity: 0 }}
            transition={sparkleBaseTransition(index)}
          />
        ))}
      </EaseView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    // Remove the backgroundColor from here
  },
  itemsContainer: {
    width: 150,
    height: 150,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    position: 'absolute',
    width: 50,
    height: 50,
    left: '50%',
    top: '50%',
    marginLeft: -25,
    marginTop: -25,
    // static rotate + translateY in component create circular arrangement around center pivot
  },
  sparkle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    left: '50%',
    top: '50%',
    marginLeft: -5,
    marginTop: -5,
    backgroundColor: '#FFD700', // Gold color for sparkles (purchase celebration)
  },
});

export default CartPurchaseAnimation;
