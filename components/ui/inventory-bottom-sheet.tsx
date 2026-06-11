import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useColorScheme,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPalette, Radius, Spacing } from './theme';
import { SHEET_HEIGHT_FRACTION, type InventoryBottomSheetProps } from './inventory-bottom-sheet.types';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(WINDOW_HEIGHT * SHEET_HEIGHT_FRACTION);

/**
 * Bottom sheet for inventory / store pickers. Uses a single React Native `Modal` on all
 * platforms so presentation lines up with the placement `Modal`s (iOS serializes RN
 * modals one at a time; native SwiftUI / Compose sheets fought that ordering).
 */
export function InventoryBottomSheet({
  visible,
  onClose,
  children,
  fitToContents,
  backgroundColor,
}: InventoryBottomSheetProps) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const c = getPalette(isDark);

  const sheetStyle: ViewStyle[] = [
    styles.sheet,
    fitToContents ? styles.sheetFitToContents : styles.sheetFixed,
    { backgroundColor: backgroundColor ?? c.surface },
    { paddingBottom: Math.max(insets.bottom, Spacing.sm) },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: c.overlay }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View style={sheetStyle}>
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          <View style={styles.content}>{children}</View>
        </View>
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
});