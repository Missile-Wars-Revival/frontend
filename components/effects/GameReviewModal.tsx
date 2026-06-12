import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as StoreReview from 'expo-store-review';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInUp,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gradients, Radius, Spacing, Type, cardShadow, getPalette } from '../ui/theme';
import { haptics } from '../ui/haptics';
import {
  markReviewPromptCompleted,
  markReviewPromptDismissed,
  onReviewPrompt,
} from './review-prompt';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const REVIEW_URL_IOS = 'https://apps.apple.com/app/missile-wars-revival/id6590602456?action=write-review';
const REVIEW_URL_ANDROID = 'https://play.google.com/store/apps/details?id=com.longtimenoc.missilewars';

const SPARKLES = [
  { top: -7, left: -10, size: 10, delay: 180 },
  { top: -5, right: -12, size: 8, delay: 260 },
  { bottom: -8, left: -7, size: 7, delay: 340 },
  { bottom: -9, right: -8, size: 9, delay: 300 },
  { top: 11, left: -16, size: 6, delay: 420 },
  { top: 10, right: -15, size: 6, delay: 460 },
];

function Sparkles({ color }: { color: string }) {
  return (
    <>
      {SPARKLES.map(({ size, delay, ...position }, index) => (
        <Animated.View
          key={index}
          entering={ZoomIn.delay(delay).duration(320).springify()}
          style={[styles.sparkle, position]}
        >
          <Ionicons name="sparkles" size={size} color={color} />
        </Animated.View>
      ))}
    </>
  );
}

export default function GameReviewModal() {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const palette = getPalette(isDark);
  const ctaScale = useSharedValue(1);

  const ctaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ctaScale.value }],
  }));

  useEffect(() => {
    return onReviewPrompt(() => {
      haptics.success();
      setVisible(true);
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    // Reanimated shared values are intentionally mutated from effects.
    // eslint-disable-next-line react-hooks/immutability
    ctaScale.value = withDelay(
      550,
      withSequence(
        withSpring(1.04, { damping: 8 }),
        withSpring(1, { damping: 10 }),
      ),
    );
  }, [ctaScale, visible]);

  const dismiss = useCallback(() => {
    haptics.select();
    setVisible(false);
    markReviewPromptDismissed().catch((error) => {
      console.error('Failed to dismiss review prompt:', error);
    });
  }, []);

  const openReview = useCallback(async () => {
    haptics.tap();
    try {
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        await Linking.openURL(Platform.OS === 'ios' ? REVIEW_URL_IOS : REVIEW_URL_ANDROID);
      }
      await markReviewPromptCompleted();
      setVisible(false);
    } catch {
      Alert.alert('Unable to Open Review', 'Please try again from Settings later.');
    }
  }, []);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View
        entering={FadeIn.duration(220)}
        exiting={FadeOut.duration(180)}
        style={[styles.overlay, { backgroundColor: palette.overlay }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

        <Animated.View
          entering={FadeInUp.springify().damping(15).stiffness(130)}
          style={[
            styles.card,
            { marginBottom: insets.bottom + Spacing.xl, backgroundColor: palette.surface, borderColor: palette.border },
            cardShadow(isDark),
          ]}
        >
          <Pressable
            onPress={dismiss}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: palette.surfaceAlt, opacity: pressed ? 0.65 : 1 },
            ]}
          >
            <Ionicons name="close" size={18} color={palette.textMuted} />
          </Pressable>

          <Animated.View entering={ZoomIn.delay(80).duration(320).springify()} style={styles.iconWrap}>
            <LinearGradient colors={Gradients.gold} style={styles.iconCircle}>
              <Ionicons name="star" size={34} color="#fff" />
            </LinearGradient>
            <Sparkles color={palette.gold} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(120).duration(260)}>
            <Text style={[styles.title, { color: palette.text }]}>Enjoying Missile Wars?</Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(180).duration(260)}>
            <Text style={[styles.subtitle, { color: palette.textMuted }]}>
              A quick rating helps other players find the game and helps us keep improving it.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(240).duration(260)} style={styles.starsRow}>
            {[0, 1, 2, 3, 4].map((index) => (
              <Ionicons key={index} name="star" size={22} color={palette.gold} style={{ opacity: 0.72 + index * 0.06 }} />
            ))}
          </Animated.View>

          <View style={[styles.divider, { backgroundColor: palette.border }]} />

          <Animated.View entering={FadeInUp.delay(300).duration(260)} style={[styles.ctaWrap, ctaStyle]}>
            <Pressable
              onPress={openReview}
              accessibilityRole="button"
              style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient colors={Gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaGradient}>
                <Ionicons name="star" size={18} color="#fff" />
                <Text style={styles.ctaText}>Rate Missile Wars</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(360).duration(240)}>
            <Pressable onPress={dismiss} style={({ pressed }) => [styles.secondaryButton, pressed && { opacity: 0.65 }]}>
              <Text style={[styles.secondaryText, { color: palette.textMuted }]}>Maybe later</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  card: {
    width: SCREEN_WIDTH - Spacing.xl,
    maxWidth: 420,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  iconWrap: {
    width: 76,
    height: 76,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
  },
  title: {
    ...Type.title,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Type.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  divider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.lg,
  },
  ctaWrap: {
    alignSelf: 'stretch',
  },
  ctaButton: {
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  ctaGradient: {
    height: 52,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ctaText: {
    ...Type.button,
    color: '#fff',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  secondaryText: {
    ...Type.caption,
  },
});
