import React from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  const sheetStyle: ViewStyle[] = [
    styles.sheet,
    fitToContents ? styles.sheetFitToContents : styles.sheetFixed,
    backgroundColor ? { backgroundColor } : null,
    { paddingBottom: Math.max(insets.bottom, 8) },
  ].filter(Boolean) as ViewStyle[];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" />
        <View style={sheetStyle}>
          <View style={styles.handle} />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  sheetFixed: {
    height: SHEET_HEIGHT,
  },
  sheetFitToContents: {
    maxHeight: SHEET_HEIGHT,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});