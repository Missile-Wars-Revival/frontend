/**
 * Pill segmented control used for mode toggles (Store: Coins/Premium,
 * PlayerView: Players/Missiles, Rankings: Leagues/Players).
 *
 * Plain Pressables are used instead of PressableScale so `flex: 1` sits on the
 * pressable itself and every segment gets equal width — wrapping the style in
 * an inner animated view breaks the row layout.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';
import { Radius, Spacing, Type, type ThemePalette } from './theme';
import { haptics } from './haptics';

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
};

export type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  palette: ThemePalette;
};

export function SegmentedControl<T extends string>({ options, value, onChange, palette }: SegmentedControlProps<T>) {
  return (
    <View style={[styles.track, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={({ pressed }) => [
              styles.segment,
              active && [styles.segmentActive, { backgroundColor: palette.accent }],
              pressed && !active && { opacity: 0.6 },
            ]}
            onPress={() => {
              if (!active) {
                haptics.select();
                onChange(option.value);
              }
            }}
          >
            {option.icon && (
              <Ionicons name={option.icon} size={15} color={active ? '#FFFFFF' : palette.textMuted} />
            )}
            <Text style={[styles.label, { color: active ? '#FFFFFF' : palette.textMuted }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: Radius.pill,
    borderWidth: 1,
    padding: 4,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.pill,
  },
  segmentActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    ...Type.caption,
    fontSize: 14,
  },
});

export default SegmentedControl;
