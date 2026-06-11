import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Radius, Spacing, cardShadow, type ThemePalette } from '../ui/theme';

const SHEET_HEIGHT_FRACTION = 0.7;
const MAX_DRAG_UP = 48;
const SHEET_BLEED = MAX_DRAG_UP + 32;
const DISMISS_DISTANCE_FRACTION = 0.2;
const DISMISS_VELOCITY = 0.85;

type CartBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  palette: ThemePalette;
  isDark: boolean;
  bottomInset: number;
  children: React.ReactNode;
};

export function CartBottomSheet({
  visible,
  onClose,
  palette,
  isDark,
  bottomInset,
  children,
}: CartBottomSheetProps) {
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * SHEET_HEIGHT_FRACTION;
  const hiddenOffset = sheetHeight + 40;

  const translateY = useSharedValue(hiddenOffset);
  const dragStartY = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const isClosingRef = useRef(false);
  const hiddenOffsetRef = useRef(hiddenOffset);
  const animateCloseRef = useRef<() => void>(() => {});
  const snapOpenRef = useRef<() => void>(() => {});

  const styles = useMemo(
    () => getStyles(palette, isDark, bottomInset, sheetHeight),
    [palette, isDark, bottomInset, sheetHeight]
  );

  const finishClose = useCallback(() => {
    isClosingRef.current = false;
    onClose();
  }, [onClose]);

  /* eslint-disable react-hooks/immutability --
     Reanimated shared values are intentionally mutated from gesture and
     animation handlers; they never run during render. */
  const animateClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    backdropOpacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(
      hiddenOffsetRef.current,
      { duration: 240, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finishClose)();
        }
      }
    );
  }, [backdropOpacity, finishClose, translateY]);

  const snapOpen = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 160, easing: Easing.out(Easing.quad) });
    translateY.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [backdropOpacity, translateY]);
  /* eslint-enable react-hooks/immutability */

  useEffect(() => {
    hiddenOffsetRef.current = hiddenOffset;
    animateCloseRef.current = animateClose;
    snapOpenRef.current = snapOpen;
  }, [hiddenOffset, animateClose, snapOpen]);

  useEffect(() => {
    if (!visible) {
      isClosingRef.current = false;
      return;
    }

    isClosingRef.current = false;
    /* eslint-disable react-hooks/immutability -- open animation runs in effect, not render */
    translateY.value = hiddenOffsetRef.current;
    backdropOpacity.value = 0;
    backdropOpacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, {
      duration: 300,
      easing: Easing.out(Easing.cubic),
    });
    /* eslint-enable react-hooks/immutability */
  }, [visible, backdropOpacity, translateY]);

  // Pan handlers only read refs when a gesture fires, never during render.
  // eslint-disable-next-line react-hooks/refs
  const [panResponder] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 4,
      onPanResponderGrant: () => {
        dragStartY.value = translateY.value;
      },
      onPanResponderMove: (_, gesture) => {
        const offset = hiddenOffsetRef.current;
        const raw = dragStartY.value + gesture.dy;
        const resisted =
          raw < 0
            ? raw * 0.35
            : raw;
        const clamped = Math.min(offset, Math.max(-MAX_DRAG_UP, resisted));
        translateY.value = clamped;

        const progress = 1 - Math.min(1, Math.max(0, clamped / offset));
        backdropOpacity.value = progress;
      },
      onPanResponderRelease: (_, gesture) => {
        const offset = hiddenOffsetRef.current;
        const dismissDistance = Math.max(96, offset * DISMISS_DISTANCE_FRACTION);
        if (translateY.value > dismissDistance || gesture.vy > DISMISS_VELOCITY) {
          animateCloseRef.current();
          return;
        }
        snapOpenRef.current();
      },
      onPanResponderTerminate: () => {
        snapOpenRef.current();
      },
    })
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={animateClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Reanimated.View style={[styles.backdrop, backdropStyle]} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={animateClose} accessibilityLabel="Close cart" />
        </Reanimated.View>

        <Reanimated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.sheetInner}>
            <View style={styles.dragZone} {...panResponder.panHandlers}>
              <View style={styles.handle} />
              <View style={styles.header}>
                <Text style={styles.title}>Your Cart</Text>
                <Pressable onPress={animateClose} hitSlop={8} accessibilityLabel="Close cart">
                  <Ionicons name="close-circle" size={26} color={palette.textFaint} />
                </Pressable>
              </View>
            </View>
            {children}
          </View>
          <View style={styles.sheetBleed} />
        </Reanimated.View>
      </View>
    </Modal>
  );
}

const getStyles = (
  palette: ThemePalette,
  isDark: boolean,
  bottomInset: number,
  sheetHeight: number
) =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: palette.overlay,
    },
    sheet: {
      height: sheetHeight,
      backgroundColor: palette.surface,
      borderTopLeftRadius: Radius.xl,
      borderTopRightRadius: Radius.xl,
      ...cardShadow(isDark),
    },
    sheetInner: {
      flex: 1,
    },
    sheetBleed: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -SHEET_BLEED,
      height: SHEET_BLEED,
      backgroundColor: palette.surface,
    },
    dragZone: {
      paddingTop: Spacing.sm,
      paddingBottom: Spacing.xs,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: palette.border,
      marginBottom: Spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.sm,
    },
    title: {
      fontSize: 18,
      fontWeight: '800',
      color: palette.text,
    },
  });