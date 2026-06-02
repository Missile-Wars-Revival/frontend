import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { SHEET_HEIGHT_FRACTION, type InventoryBottomSheetProps } from './inventory-bottom-sheet.types';

/**
 * Fallback implementation (web / non-iOS-or-Android) used when the native `@expo/ui`
 * sheets are unavailable. Renders a simple bottom-anchored React Native modal so the
 * library pickers keep working everywhere. Metro resolves `.ios.tsx` / `.android.tsx`
 * on device; TypeScript and web resolve to this file.
 */
export function InventoryBottomSheet({
  visible,
  onClose,
  children,
  backgroundColor,
}: InventoryBottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, backgroundColor ? { backgroundColor } : null]}>{children}</View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: `${Math.round(SHEET_HEIGHT_FRACTION * 100)}%`,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});
