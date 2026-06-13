import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Gradients, Radius, Spacing, Type, cardShadow, getPalette } from './ui/theme';
import type { UpdatePhase } from '../hooks/useUpdates';

type UpdateOverlayProps = {
  visible: boolean;
  phase: UpdatePhase;
};

const PHASE_CONFIG: Record<UpdatePhase, { title: string; subtitle: string }> = {
  checking: {
    title: 'Checking for updates',
    subtitle: 'Looking for the newest Missile Wars build',
  },
  downloading: {
    title: 'Downloading update',
    subtitle: 'Saving the latest build to this device',
  },
  installing: {
    title: 'Preparing update',
    subtitle: 'Finishing setup before the app restarts',
  },
  restarting: {
    title: 'Restarting',
    subtitle: 'Relaunching Missile Wars',
  },
};

export default function UpdateOverlay({ visible, phase }: UpdateOverlayProps) {
  const isDark = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const palette = getPalette(isDark);
  const compact = width < 360;

  const progress = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const dotOpacity1 = useSharedValue(0.3);
  const dotOpacity2 = useSharedValue(0.3);
  const dotOpacity3 = useSharedValue(0.3);
  const checkScale = useSharedValue(0);

  useEffect(() => {
    if (visible && phase !== 'restarting') {
      iconScale.set(withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ));
    } else if (visible && phase === 'restarting') {
      iconScale.set(withTiming(1.14, { duration: 300, easing: Easing.out(Easing.back(2)) }));
    }

    return () => {
      if (!visible) cancelAnimation(iconScale);
    };
  }, [iconScale, phase, visible]);

  useEffect(() => {
    if (visible && phase !== 'restarting') {
      dotOpacity1.set(withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1));
      dotOpacity2.set(withDelay(200, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1)));
      dotOpacity3.set(withDelay(400, withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.3, { duration: 400 })), -1)));
    }

    return () => {
      if (!visible) {
        cancelAnimation(dotOpacity1);
        cancelAnimation(dotOpacity2);
        cancelAnimation(dotOpacity3);
      }
    };
  }, [dotOpacity1, dotOpacity2, dotOpacity3, phase, visible]);

  useEffect(() => {
    if (!visible) {
      progress.set(0);
      checkScale.set(0);
      return;
    }

    if (phase === 'checking') {
      progress.set(withTiming(0.15, { duration: 1200, easing: Easing.out(Easing.ease) }));
    } else if (phase === 'downloading') {
      progress.set(withTiming(0.7, { duration: 4000, easing: Easing.out(Easing.ease) }));
    } else if (phase === 'installing') {
      progress.set(withTiming(0.9, { duration: 1300, easing: Easing.out(Easing.ease) }));
    } else {
      progress.set(withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }));
      checkScale.set(withDelay(350, withTiming(1, { duration: 360, easing: Easing.out(Easing.back(2)) })));
    }
  }, [checkScale, phase, progress, visible]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progress.value, [0, 1], [0, 100])}%`,
  }));

  const progressGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.35, 0.75, 1]),
  }));

  const dot1Style = useAnimatedStyle(() => ({ opacity: dotOpacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: dotOpacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: dotOpacity3.value }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    opacity: checkScale.value,
    transform: [{ scale: checkScale.value }],
  }));

  if (!visible) return null;

  const config = PHASE_CONFIG[phase];

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(180)}
      pointerEvents="auto"
      style={styles.container}
    >
      <BlurView intensity={42} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(4,5,14,0.78)' : 'rgba(10,12,26,0.58)' }]} />

      <Animated.View
        style={[
          styles.card,
          { backgroundColor: palette.surface, borderColor: palette.border },
          cardShadow(isDark),
        ]}
      >
        <Animated.View style={[styles.iconContainer, { backgroundColor: palette.surfaceAlt }, iconAnimatedStyle]}>
          <Image source={require('../assets/logo.png')} style={styles.icon} />
          {phase === 'restarting' && (
            <Animated.View style={[styles.checkBadge, { backgroundColor: palette.success }, checkmarkStyle]}>
              <Ionicons name="checkmark" size={18} color="#fff" />
            </Animated.View>
          )}
        </Animated.View>

        <Text
          style={[styles.title, { color: palette.text }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.82}
        >
          {config.title}
        </Text>
        <View style={styles.subtitleBlock}>
          <Text
            style={[styles.subtitle, { color: palette.textMuted }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.9}
          >
            {config.subtitle}
          </Text>
          {phase !== 'restarting' && (
            <View style={styles.dots}>
              <Animated.View style={[styles.dot, { backgroundColor: palette.accent }, dot1Style]} />
              <Animated.View style={[styles.dot, { backgroundColor: palette.accent }, dot2Style]} />
              <Animated.View style={[styles.dot, { backgroundColor: palette.accent }, dot3Style]} />
            </View>
          )}
        </View>

        <View style={[styles.progressTrack, { backgroundColor: palette.surfaceAlt }]}>
          <Animated.View style={[styles.progressBar, progressBarStyle]}>
            <Animated.View style={[styles.progressGlow, progressGlowStyle]} />
          </Animated.View>
        </View>

        <View style={styles.phases}>
          <PhaseStep label="Check" active={phase === 'checking'} done={phase !== 'checking'} />
          <View style={[styles.phaseDivider, { backgroundColor: palette.border }]} />
          <PhaseStep label={compact ? 'Fetch' : 'Download'} active={phase === 'downloading'} done={phase === 'installing' || phase === 'restarting'} />
          <View style={[styles.phaseDivider, { backgroundColor: palette.border }]} />
          <PhaseStep label="Prepare" active={phase === 'installing'} done={phase === 'restarting'} />
          <View style={[styles.phaseDivider, { backgroundColor: palette.border }]} />
          <PhaseStep label="Restart" active={phase === 'restarting'} done={false} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function PhaseStep({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  const isDark = useColorScheme() === 'dark';
  const palette = getPalette(isDark);
  const dotColor = done ? palette.success : active ? palette.accent : palette.surfaceAlt;
  const textColor = done ? palette.success : active ? palette.text : palette.textFaint;

  return (
    <View style={styles.phaseStep}>
      <View style={[styles.phaseDot, { backgroundColor: dotColor, borderColor: palette.border }]}>
        {active && <ActivityIndicator size={14} color="#fff" style={styles.phaseSpinner} />}
        {done && <Ionicons name="checkmark" size={12} color="#fff" />}
      </View>
      <Text
        style={[styles.phaseLabel, { color: textColor }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.82}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    width: 92,
    height: 92,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
  },
  checkBadge: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Type.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitleBlock: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
    marginBottom: Spacing.xl,
  },
  subtitle: {
    ...Type.body,
    textAlign: 'center',
    maxWidth: 300,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 12,
    marginTop: Spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: Radius.pill,
    marginHorizontal: 3,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
  },
  progressBar: {
    height: '100%',
    borderRadius: Radius.pill,
    overflow: 'hidden',
    backgroundColor: Gradients.brand[0],
  },
  progressGlow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Gradients.brand[1],
  },
  phases: {
    width: '100%',
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  phaseStep: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    paddingHorizontal: 1,
  },
  phaseDot: {
    width: 22,
    height: 22,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  phaseSpinner: {
    transform: [{ scale: 0.72 }],
  },
  phaseLabel: {
    ...Type.micro,
    textAlign: 'center',
    maxWidth: '100%',
  },
  phaseDivider: {
    width: 8,
    flexShrink: 1,
    height: StyleSheet.hairlineWidth,
    marginTop: 11,
  },
});
