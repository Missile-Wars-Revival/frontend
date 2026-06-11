/**
 * Shared chrome for the map placement popups (missile / landmine / loot /
 * special items). Each popup builds these from the active palette so the
 * modal card, status overlays, and action buttons match the app theme.
 */
import { StyleSheet, Dimensions } from 'react-native';
import { Radius, Spacing, Type, cardShadow, type ThemePalette } from './theme';

const { width, height } = Dimensions.get('window');

export const getPlacementStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.overlay,
  },
  modalContent: {
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    width: width - 32,
    height: height - 200,
    overflow: 'hidden',
    ...cardShadow(isDark),
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: isDark ? 'rgba(14, 16, 32, 0.88)' : 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  overlayText: {
    ...Type.title,
    fontSize: 18,
    color: palette.text,
    textAlign: 'center',
  },
  overlaySubText: {
    ...Type.body,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: palette.surfaceAlt,
  },
  cancelButtonText: {
    ...Type.button,
    fontSize: 15,
    color: palette.text,
  },
  actionButtonWrap: {
    flex: 1,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  actionButtonText: {
    ...Type.button,
    fontSize: 15,
    color: '#FFFFFF',
  },
  disabledButton: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
});
