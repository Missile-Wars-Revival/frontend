import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Host, ModalBottomSheet, RNHostView } from '@expo/ui/jetpack-compose';

import { SHEET_HEIGHT_FRACTION, type InventoryBottomSheetProps } from './inventory-bottom-sheet.types';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(height * SHEET_HEIGHT_FRACTION);

/**
 * Android implementation backed by Jetpack Compose's `ModalBottomSheet` (`@expo/ui/jetpack-compose`).
 * The existing React Native content is embedded via `RNHostView` sized to a fixed height, so the
 * Material sheet (with its default drag handle and swipe-to-dismiss) wraps the content cleanly.
 * The sheet is mount-driven, so we only render it while `visible`.
 */
export function InventoryBottomSheet({
  visible,
  onClose,
  children,
  fitToContents,
  backgroundColor,
}: InventoryBottomSheetProps) {
  if (!visible) {
    return null;
  }

  return (
    <Host style={styles.anchor}>
      <ModalBottomSheet
        onDismissRequest={onClose}
        skipPartiallyExpanded
        containerColor={backgroundColor}>
        <RNHostView matchContents>
          <View style={[styles.content, fitToContents ? styles.contentFitToContents : null]}>{children}</View>
        </RNHostView>
      </ModalBottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  // Zero-size anchor: the sheet presents at the window level and must not occupy
  // layout space or intercept touches on the map underneath.
  anchor: { position: 'absolute', width: 0, height: 0 },
  content: { width, height: SHEET_HEIGHT },
  contentFitToContents: { height: undefined, maxHeight: SHEET_HEIGHT },
});
