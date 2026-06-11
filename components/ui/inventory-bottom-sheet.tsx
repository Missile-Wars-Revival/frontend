import React, { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
  type ViewStyle,
} from 'react-native';

import { getPalette, Radius, Spacing } from './theme';
import { SHEET_HEIGHT_FRACTION, type InventoryBottomSheetProps } from './inventory-bottom-sheet.types';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * SHEET_HEIGHT_FRACTION);

/**
 * Bottom sheet for inventory / store pickers. Uses a single React Native `Modal` on all
 * platforms so presentation lines up with the placement `Modal`s (iOS serializes RN
 * modals one at a time; native SwiftUI / Compose sheets fought that ordering).
 *
 * The modal itself fades (backdrop fades in like the fire selector) while the sheet
 * slides up with its own spring.
 */
export function InventoryBottomSheet({
  visible,
  onClose,
  onDismissed,
  children,
  fitToContents,
  backgroundColor,
}: InventoryBottomSheetProps) {
  const isDark = useColorScheme() === 'dark';
  const c = getPalette(isDark);
  const [slideAnim] = useState(() => new Animated.Value(SHEET_HEIGHT));

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const sheetStyle: ViewStyle[] = [
    styles.sheet,
    fitToContents ? styles.sheetFitToContents : styles.sheetFixed,
    { backgroundColor: backgroundColor ?? c.surface },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      onDismiss={onDismissed}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: c.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <Animated.View style={[...sheetStyle, { transform: [{ translateY: slideAnim }] }]}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={fitToContents ? styles.contentFit : styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    overflow: 'hidden',
    // No bottom safe-area inset: the tab bar isn't visible under the sheet and
    // the content scrolls, so the extra gap just wastes space.
    paddingBottom: Spacing.sm,
  },
  sheetFixed: {
    height: SHEET_HEIGHT,
  },
  sheetFitToContents: {
    maxHeight: SHEET_HEIGHT,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  // fitToContents: let children drive the height (sheet only has maxHeight,
  // so flex: 1 would resolve to zero height here).
  contentFit: {
    flexShrink: 1,
    minHeight: 0,
  },
});
