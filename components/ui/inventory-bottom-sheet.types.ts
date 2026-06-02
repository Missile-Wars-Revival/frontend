import type { ReactNode } from 'react';
import type { ColorValue } from 'react-native';

export interface InventoryBottomSheetProps {
  /** Whether the sheet is presented. */
  visible: boolean;
  /** Called when the user dismisses the sheet (swipe, scrim tap, back press) or taps Done. */
  onClose: () => void;
  /** The content rendered inside the sheet (regular React Native views). */
  children: ReactNode;
  /**
   * Background colour for the native sheet chrome (drag-handle zone / container),
   * so it matches the themed content card. Defaults to the platform system background.
   */
  backgroundColor?: ColorValue;
}

/** Height of the sheet content, shared across platforms. */
export const SHEET_HEIGHT_FRACTION = 0.88;
