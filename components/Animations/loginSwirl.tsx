import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { EaseView, type Transition } from 'react-native-ease';
import { Presets } from 'react-native-pulsar';

type LoginSwirlProps = {
  onAnimationComplete: () => void;
};

const LoginSwirl: React.FC<LoginSwirlProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const accent = isDarkMode ? '#4CAF50' : '#773765';
  const accentLight = isDarkMode ? '#66BB6A' : '#9C4D8C';

  // Targets for multi-layer vortex (reimagined login "portal" / success swirl)
  const [coreScale, setCoreScale] = useState(1);
  const [coreRotate, setCoreRotate] = useState(360);
  const [ringScale, setRingScale] = useState(1);
  const [ringRotate, setRingRotate] = useState(-720); // counter spin for depth
  const [ringOpacity, setRingOpacity] = useState(0.9);

  const [isExiting, setIsExiting] = useState(false);
  const exitTriggered = useRef(false);

  // Haptic on successful login swirl start (satisfying "whoosh" confirmation)
  useEffect(() => {
    try {
      Presets.System.notificationSuccess();
    } catch {
      // silent
    }
  }, []);

  const coreTransition: Transition = isExiting
    ? { type: 'timing', duration: 280, easing: 'easeIn' }
    : { type: 'spring', stiffness: 120, damping: 14 };

  const ringTransition: Transition = isExiting
    ? { type: 'timing', duration: 320, easing: 'easeIn' }
    : { type: 'timing', duration: 1100, easing: 'linear' };

  const handleCoreEnd = (e: { finished: boolean }) => {
    if (e.finished && !exitTriggered.current) {
      exitTriggered.current = true;
      setIsExiting(true);
      setTimeout(() => {
        setCoreScale(1.6);
        setCoreRotate(720);
        setRingScale(1.8);
        setRingRotate(-1080);
        setRingOpacity(0);
        setTimeout(onAnimationComplete, 300);
      }, 420);
    }
  };

  return (
    <View style={styles.container}>
      {/* Outer counter-rotating ring for vortex depth */}
      <EaseView
        style={[
          styles.swirl,
          {
            backgroundColor: accentLight,
            opacity: ringOpacity,
            transform: [{ rotateZ: '25deg' }],
          },
        ]}
        animate={{ scale: ringScale, rotate: ringRotate }}
        initialAnimate={{ scale: 0.3, rotate: 0 }}
        transition={ringTransition}
      />

      {/* Main "swirl" core - pops with spring, spins, then expands/fades on exit */}
      <EaseView
        style={[
          styles.swirl,
          {
            backgroundColor: accent,
            transform: [{ rotateZ: '45deg' }],
          },
        ]}
        animate={{ scale: coreScale, rotate: coreRotate }}
        initialAnimate={{ scale: 0.2, rotate: -120 }}
        transition={coreTransition}
        onTransitionEnd={handleCoreEnd}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  swirl: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderTopLeftRadius: 0,
    // Layers will be absolutely positioned siblings for vortex effect
  },
});

export default LoginSwirl;
