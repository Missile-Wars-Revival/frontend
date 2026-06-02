import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { EaseView, type Transition } from 'react-native-ease';
import { Presets } from 'react-native-pulsar';

type FriendAddedAnimationProps = {
  onAnimationComplete: () => void;
};

const FriendAddedAnimation: React.FC<FriendAddedAnimationProps> = ({ onAnimationComplete }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const iconColor = isDarkMode ? '#FFFFFF' : '#000000';

  // Declarative animation targets (updated to trigger enter/exit)
  const [animateRotate, setAnimateRotate] = useState(360);
  const [animateScale, setAnimateScale] = useState(1);
  const [sparkleAnimates, setSparkleAnimates] = useState(() =>
    Array(6).fill({ scale: 1, opacity: 1 })
  );
  const [isExiting, setIsExiting] = useState(false);

  const exitTriggered = useRef(false);

  // Trigger haptic feedback on mount (using lightweight Pulsar)
  useEffect(() => {
    try {
      Presets.System.notificationSuccess();
    } catch {
      // Fallback silently if haptics not supported on device
    }
  }, []);

  // Transitions (can be phase-dependent for enter vs exit)
  const rotateTransition: Transition = isExiting
    ? { type: 'timing', duration: 300, easing: 'easeInOut' }
    : { type: 'timing', duration: 650, easing: 'easeInOut' };

  const scaleTransition: Transition = isExiting
    ? { type: 'timing', duration: 300, easing: 'easeIn' }
    : { type: 'spring', stiffness: 240, damping: 9 };


  return (
    <View style={[
      styles.container,
      { backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)' }
    ]}>
      <EaseView
        style={styles.iconContainer}
        animate={{ rotate: animateRotate }}
        initialAnimate={{ rotate: 0 }}
        transition={rotateTransition}
      >
        <EaseView
          animate={{ scale: animateScale }}
          initialAnimate={{ scale: 0 }}
          transition={scaleTransition}
          onTransitionEnd={(e) => {
            if (e.finished && !exitTriggered.current) {
              exitTriggered.current = true;
              setIsExiting(true);
              setTimeout(() => {
                setAnimateRotate(0);
                setAnimateScale(0);
                setSparkleAnimates(Array(6).fill({ scale: 0, opacity: 0 }));
                setTimeout(() => {
                  onAnimationComplete();
                }, 350);
              }, 1000);
            }
          }}
        >
          <Ionicons name="person-add" size={60} color={iconColor} />
        </EaseView>

        {sparkleAnimates.map((anim, index) => {
          const sparkleTransition: Transition = isExiting
            ? { type: 'timing', duration: 280, easing: 'easeIn' }
            : {
                type: 'timing',
                duration: 480,
                easing: 'easeOut',
                delay: 40 + index * 70,
              };

          return (
            <EaseView
              key={index}
              style={[
                styles.sparkle,
                {
                  transform: [
                    { rotate: `${index * 60}deg` },
                    { translateX: 50 },
                  ],
                },
              ]}
              animate={anim}
              initialAnimate={{ scale: 0, opacity: 0 }}
              transition={sparkleTransition}
            />
          );
        })}
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
  iconContainer: {
    width: 100,
    height: 100,
    position: 'relative',
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
