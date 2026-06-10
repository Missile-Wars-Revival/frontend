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
   * When true, the sheet height is driven by content (up to `SHEET_HEIGHT_FRACTION` of the screen).
   * Defaults to false to preserve the legacy fixed-height behavior.
   */
  fitToContents?: boolean;
  /** Background colour for the sheet panel. Defaults to white. */
  backgroundColor?: ColorValue;
}

/** Height of the sheet content, shared across platforms. */
export const SHEET_HEIGHT_FRACTION = 0.88;
