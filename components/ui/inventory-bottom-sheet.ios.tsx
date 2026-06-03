import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { BottomSheet, Group, Host, RNHostView } from '@expo/ui/swift-ui';
import { presentationBackground, presentationDragIndicator } from '@expo/ui/swift-ui/modifiers';
import type { ModifierConfig } from '@expo/ui/swift-ui/modifiers';

import { SHEET_HEIGHT_FRACTION, type InventoryBottomSheetProps } from './inventory-bottom-sheet.types';

const { width, height } = Dimensions.get('window');
const SHEET_HEIGHT = Math.round(height * SHEET_HEIGHT_FRACTION);

/**
 * iOS implementation backed by SwiftUI's native sheet (`@expo/ui/swift-ui` `BottomSheet`).
 * The existing React Native content is embedded via `RNHostView`. The sheet sizes itself
 * to the fixed-height content (`fitToContents`), giving a consistent ~88%-tall sheet with a
 * native grabber and swipe-to-dismiss.
 */
export function InventoryBottomSheet({
  visible,
  onClose,
  children,
  fitToContents,
  backgroundColor,
}: InventoryBottomSheetProps) {
  const modifiers: ModifierConfig[] = [presentationDragIndicator('visible')];
  if (backgroundColor) {
    modifiers.push(presentationBackground(String(backgroundColor)));
  }

  return (
    <Host style={styles.anchor} pointerEvents="box-none">
      <BottomSheet
        isPresented={visible}
        onIsPresentedChange={(isPresented) => {
          if (!isPresented) {
            onClose();
          }
        }}
        fitToContents>
        <Group modifiers={modifiers}>
          <RNHostView matchContents>
            <View style={[styles.content, fitToContents ? styles.contentFitToContents : null]}>{children}</View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
}

const styles = StyleSheet.create({
  // Zero-size anchor: the sheet presents at the window level, so this must not
  // occupy space or intercept touches on the map underneath.
  anchor: { position: 'absolute', width: 0, height: 0 },
  content: { width, height: SHEET_HEIGHT },
  contentFitToContents: { height: undefined, maxHeight: SHEET_HEIGHT },
});
