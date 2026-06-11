import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { EaseView, type Transition } from 'react-native-ease';
import { Presets } from 'react-native-pulsar';

type MissileFiringAnimationProps = {
  onAnimationComplete: () => void;
};

const MissileFiringAnimation: React.FC<MissileFiringAnimationProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const missileColors = isDarkMode ? (['#303030', '#505050'] as const) : (['#A0A0A0', '#C0C0C0'] as const);

  // Declarative targets (replaces all the Animated.Value + complex interpolates)
  const [missileY, setMissileY] = useState(150);
  const [missileScale, setMissileScale] = useState(1);
  const [missileRotate, setMissileRotate] = useState(0);
  const [flameOpacity, setFlameOpacity] = useState(0);
  const [flameScaleY, setFlameScaleY] = useState(0.5);

  // Multiple smoke puffs for trail (staggered, lighter than one big animated blob)
  const [smokePuffs, setSmokePuffs] = useState(() =>
    Array.from({ length: 4 }, (_, i) => ({ y: 0, scale: 0.4, opacity: 0 }))
  );

  const [explosionScale, setExplosionScale] = useState(0.4);
  const [explosionOpacity, setExplosionOpacity] = useState(0);

  const completeCalled = useRef(false);

  // Kick off the reimagined sequence + haptics (launch feel + impact)
  useEffect(() => {
    try {
      Presets.System.impactMedium(); // "thruster" ignition
    } catch {}

    // Flight: missile rises (translateY negative), slight forward scale + wobble
    setTimeout(() => {
      setMissileY(-160);
      setMissileScale(0.55);
      setMissileRotate(6); // tiny wobble
      setFlameOpacity(1);
      setFlameScaleY(1.8);

      // Staggered smoke trail puffs rising behind
      setSmokePuffs(
        Array.from({ length: 4 }, (_, i) => ({
          y: -25 - i * 18,
          scale: 0.7 + i * 0.25,
          opacity: 0.75 - i * 0.12,
        }))
      );
    }, 60);

    // After flight time -> impact
    const flightTimer = setTimeout(() => {
      try {
        Presets.System.impactHeavy();
      } catch {}

      // Stop flame, start explosion burst
      setFlameOpacity(0);
      setExplosionOpacity(1);
      setExplosionScale(3.2);

      // Quick flash then settle
      setTimeout(() => {
        setExplosionScale(2.2);
        setExplosionOpacity(0);

        const doneTimer = setTimeout(() => {
          if (!completeCalled.current) {
            completeCalled.current = true;
            onAnimationComplete();
          }
        }, 420);

        return () => clearTimeout(doneTimer);
      }, 380);
    }, 1450);

    return () => clearTimeout(flightTimer);
  }, [onAnimationComplete]);

  const flightTransition: Transition = { type: 'timing', duration: 1350, easing: 'easeInOut' };
  const flameTransition: Transition = { type: 'timing', duration: 900, easing: 'linear' };
  const puffBase: Transition = { type: 'timing', duration: 1100, easing: 'easeOut' };
  const explosionTransition: Transition = { type: 'spring', stiffness: 80, damping: 6 };

  return (
    <View style={styles.container}>
      {/* Smoke puffs - individual EaseViews for nice staggered rising trail */}
      {smokePuffs.map((puff, i) => (
        <EaseView
          key={`smoke-${i}`}
          style={[
            styles.smoke,
            {
              // base position shifted per puff for trail look
              top: 180 + i * 8,
              transform: [{ translateY: puff.y }, { scale: puff.scale }],
              opacity: puff.opacity,
            },
          ]}
          animate={{ translateY: puff.y - 95, scale: puff.scale * 2.1, opacity: 0 }}
          initialAnimate={{ translateY: puff.y, scale: puff.scale, opacity: puff.opacity }}
          transition={{ ...puffBase, delay: 180 + i * 140 }}
        />
      ))}

      {/* The missile body - rises with scale + light wobble rotate */}
      <EaseView
        style={[styles.missile]}
        animate={{ translateY: missileY, scale: missileScale, rotate: missileRotate }}
        initialAnimate={{ translateY: 150, scale: 1, rotate: -3 }}
        transition={flightTransition}
      >
        <LinearGradient colors={missileColors} style={styles.missileGradient} />
        <View style={styles.fins} />
      </EaseView>

      {/* Thrust flame - flickers with opacity/scaleY while ascending */}
      <EaseView
        style={[styles.flame]}
        animate={{ opacity: flameOpacity, scaleY: flameScaleY }}
        initialAnimate={{ opacity: 0, scaleY: 0.4 }}
        transition={flameTransition}
      >
        <LinearGradient
          colors={['#FF4500', '#FFA500', '#FFFF00']}
          style={styles.flameGradient}
        />
      </EaseView>

      {/* Impact explosion - springy burst then fade (replaces the exp sequence) */}
      <EaseView
        style={[styles.explosion]}
        animate={{ scale: explosionScale, opacity: explosionOpacity }}
        initialAnimate={{ scale: 0.4, opacity: 0 }}
        transition={explosionTransition}
      >
        <LinearGradient
          colors={['#FF8C00', '#FF4500']}
          style={styles.explosionGradient}
        />
      </EaseView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  missile: {
    width: 10,
    height: 50,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    overflow: 'hidden',
    // position + motion now fully driven by EaseView animate (translateY/scale/rotate)
  },
  missileGradient: {
    flex: 1,
  },
  fins: {
    position: 'absolute',
    bottom: 0,
    left: -5,
    right: -5,
    height: 10,
    backgroundColor: 'transparent',
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#505050',
  },
  smoke: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(200, 200, 200, 0.65)',
    // individual puffs get their own top/transform via Ease inline styles
  },
  flame: {
    position: 'absolute',
    width: 16,
    height: 42,
    // position is tuned so it sits under the missile in the overlay center
    bottom: 138,
    overflow: 'hidden',
  },
  flameGradient: {
    flex: 1,
  },
  explosion: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    top: 95,
    // scale/opacity animated via EaseView for big springy boom
  },
  explosionGradient: {
    flex: 1,
  },
});

export default MissileFiringAnimation;