import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getImages, getWeaponTypes } from '../../api/store';
import { getPalette, Radius, Spacing, cardShadow } from './theme';

const fallbackImage = require('../../assets/logo.png');

export type ItemStats = {
  name: string;
  type: 'Missiles' | 'Landmines' | 'Other';
  price: number;
  description?: string;
  speed?: number;
  radius?: number;
  damage?: number;
  fallout?: number;
  duration?: number;
};

// Weapon stats rarely change within a session, so fetch once and share the
// promise between every popup instance (inventory sheet, profile, …).
let statsCache: Promise<Record<string, ItemStats>> | null = null;

function loadItemStats(): Promise<Record<string, ItemStats>> {
  if (!statsCache) {
    statsCache = getWeaponTypes()
      .then(({ missileTypes, landmineTypes, otherTypes }) => {
        const map: Record<string, ItemStats> = {};
        missileTypes.forEach((m: any) => {
          map[m.name] = {
            name: m.name, type: 'Missiles', price: m.price, description: m.description,
            speed: m.speed, radius: m.radius, damage: m.damage, fallout: m.fallout,
          };
        });
        landmineTypes.forEach((l: any) => {
          map[l.name] = {
            name: l.name, type: 'Landmines', price: l.price, description: l.description,
            damage: l.damage, duration: l.duration,
          };
        });
        otherTypes.forEach((o: any) => {
          map[o.name] = {
            name: o.name, type: 'Other', price: o.price, description: o.description,
            duration: o.duration, radius: o.radius,
          };
        });
        return map;
      })
      .catch((error) => {
        console.error('Failed to load item stats:', error);
        statsCache = null;
        return {};
      });
  }
  return statsCache;
}

function formatDuration(minutes: number | undefined): string {
  if (minutes === undefined) return 'N/A';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours === 0) return `${remainingMinutes} mins`;
  if (remainingMinutes === 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} mins`;
}

type ItemStatsPopupProps = {
  /** Item name to show stats for; null hides the popup. */
  itemName: string | null;
  onClose: () => void;
};

/**
 * Read-only version of the store's product-detail card, opened by holding an
 * inventory item. Safe to nest inside an open RN Modal (it presents on top).
 */
export function ItemStatsPopup({ itemName, onClose }: ItemStatsPopupProps) {
  const isDark = useColorScheme() === 'dark';
  const c = getPalette(isDark);
  const [stats, setStats] = useState<Record<string, ItemStats>>({});
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => fallbackImage);

  useEffect(() => {
    let cancelled = false;
    loadItemStats().then((loaded) => {
      if (!cancelled) setStats(loaded);
    });
    getImages().then((imageGetter) => {
      if (!cancelled) setGetImageForProduct(() => imageGetter);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!itemName) return null;

  const item = stats[itemName];

  const renderStatRow = (icon: React.ComponentProps<typeof Ionicons>['name'], label: string, value: string) => (
    <View style={styles.statRow} key={label}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={c.accent} />
      </View>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: c.surface }, cardShadow(isDark)]}
        >
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <View style={[styles.imageWrap, { backgroundColor: c.surfaceAlt }]}>
              <Image
                source={getImageForProduct(itemName) || fallbackImage}
                style={styles.image}
                contentFit="contain"
                cachePolicy="memory-disk"
              />
            </View>
            <Text style={[styles.title, { color: c.text }]}>{itemName}</Text>
            {item ? (
              <>
                <View style={styles.chipRow}>
                  <View style={[styles.chip, { backgroundColor: c.surfaceAlt }]}>
                    <Text style={[styles.chipText, { color: c.text }]}>🪙 {item.price}</Text>
                  </View>
                  <View style={[styles.chip, { backgroundColor: c.accentSoft }]}>
                    <Text style={[styles.chipText, { color: c.accent }]}>{item.type}</Text>
                  </View>
                </View>
                {!!item.description && (
                  <Text style={[styles.description, { color: c.textMuted }]}>{item.description}</Text>
                )}
                <View style={[styles.statsCard, { backgroundColor: c.surfaceAlt }]}>
                  {item.type === 'Missiles' && (
                    <>
                      {renderStatRow('speedometer', 'Speed', `${item.speed} m/s`)}
                      {renderStatRow('radio', 'Radius', `${item.radius} m`)}
                      {renderStatRow('cloud', 'Fallout', `${item.fallout} mins`)}
                      {renderStatRow('flash', 'Damage', `${item.damage} / 30s`)}
                    </>
                  )}
                  {item.type === 'Landmines' && (
                    <>
                      {renderStatRow('time', 'Duration', `${item.duration} hours`)}
                      {renderStatRow('flash', 'Damage', `${item.damage}`)}
                    </>
                  )}
                  {item.type === 'Other' && (
                    <>
                      {renderStatRow('time', 'Duration', formatDuration(item.duration))}
                      {renderStatRow('radio', 'Radius', item.radius !== undefined ? `${item.radius} m` : 'N/A')}
                    </>
                  )}
                </View>
              </>
            ) : (
              <Text style={[styles.description, { color: c.textMuted }]}>
                No stats available for this item.
              </Text>
            )}
          </ScrollView>
          <Pressable style={[styles.closeButton, { backgroundColor: c.accent }]} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  imageWrap: {
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  image: {
    width: 92,
    height: 92,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: Radius.pill,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '800',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  statsCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconWrap: {
    width: 26,
    alignItems: 'flex-start',
  },
  statLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  closeButton: {
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
