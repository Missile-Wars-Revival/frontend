import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { getImages } from '../../api/store';
import { EaseView, type Transition } from 'react-native-ease';
import { Presets } from 'react-native-pulsar';

type ItemCollectAnimationProps = {
  itemName: string;
  onAnimationComplete: () => void;
};

const ItemCollectAnimation: React.FC<ItemCollectAnimationProps> = ({ itemName, onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

  // State targets for declarative Ease anim (no more ref/Animated in render)
  const [containerScale, setContainerScale] = useState(1);
  const [containerOpacity, setContainerOpacity] = useState(1);
  const [itemScale, setItemScale] = useState(1);
  const [sparkleAnimates, setSparkleAnimates] = useState(() =>
    Array(6).fill({ scale: 1, opacity: 1 })
  );
  const [isExiting, setIsExiting] = useState(false);

  const exitTriggered = useRef(false);

  // Load dynamic images (kept behavior)
  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  // Haptic + enter (Pulsar for satisfying "item get" feel)
  useEffect(() => {
    try {
      Presets.System.impactMedium();
    } catch {
      // fallback
    }
  }, []);

  const containerTransition: Transition = isExiting
    ? { type: 'timing', duration: 260, easing: 'easeIn' }
    : { type: 'spring', stiffness: 200, damping: 9 };

  const itemTransition: Transition = isExiting
    ? { type: 'timing', duration: 220, easing: 'easeIn' }
    : { type: 'spring', stiffness: 260, damping: 7, /* slight twist via extra rotate below */ };

  const sparkleTransition = (index: number): Transition =>
    isExiting
      ? { type: 'timing', duration: 180, easing: 'easeIn' }
      : {
          type: 'timing',
          duration: 400,
          easing: 'easeOut',
          delay: 20 + index * 50,
        };

  const handleEnd = (e: { finished: boolean }) => {
    if (e.finished && !exitTriggered.current) {
      exitTriggered.current = true;
      setIsExiting(true);
      setTimeout(() => {
        setContainerScale(0);
        setContainerOpacity(0);
        setItemScale(0);
        setSparkleAnimates(Array(6).fill({ scale: 0, opacity: 0 }));
        setTimeout(onAnimationComplete, 280);
      }, 420);
    }
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <EaseView
        style={styles.itemContainer}
        animate={{ scale: containerScale, opacity: containerOpacity }}
        initialAnimate={{ scale: 0, opacity: 0 }}
        transition={containerTransition}
        onTransitionEnd={handleEnd}
      >
        {/* The collected item - spring pop + a fun little rotate twist on collect */}
        <EaseView
          style={styles.itemImage}
          animate={{ scale: itemScale, rotate: 20 }}
          initialAnimate={{ scale: 0, rotate: -15 }}
          transition={itemTransition}
        >
          <Image
            source={getImageForProduct(itemName)}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
          />
        </EaseView>

        {/* Radiating sparkles for collect "bling" - staggered timing */}
        {sparkleAnimates.map((anim, index) => (
          <EaseView
            key={index}
            style={[
              styles.sparkle,
              {
                transform: [
                  { rotate: `${index * 60}deg` },
                  { translateX: 52 },
                ],
              },
            ]}
            animate={anim}
            initialAnimate={{ scale: 0, opacity: 0 }}
            transition={sparkleTransition(index)}
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
  itemContainer: {
    width: 100,
    height: 100,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemImage: {
    width: 80,
    height: 80,
    // no position absolute here; the EaseView wrapper handles centering + its own rotate/scale
    // child Image fills it
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
    backgroundColor: '#FFD700', // Gold for collect bling
  },
});

export default ItemCollectAnimation;