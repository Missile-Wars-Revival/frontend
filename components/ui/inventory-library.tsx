import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { AnimatedEntrance } from './AnimatedEntrance';
import { PressableScale } from './PressableScale';
import { ItemStatsPopup } from './item-stats-popup';
import { getPalette, Gradients, Radius, Spacing, Type, cardShadow } from './theme';

type GradientColors = readonly [string, string, ...string[]];

export type InventoryLibraryItem = {
  type: string;
  quantity: number;
};

type InventoryLibraryShellProps = {
  title: string;
  subtitle?: string;
  accentColors?: GradientColors;
  isDark: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export function InventoryLibraryShell({
  title,
  subtitle,
  accentColors = Gradients.brand,
  isDark,
  onClose,
  children,
}: InventoryLibraryShellProps) {
  const c = getPalette(isDark);

  return (
    <View style={[styles.shell, { backgroundColor: c.surface }]}>
      <LinearGradient colors={accentColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
        <PressableScale haptic="select" onPress={onClose} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </PressableScale>
      </LinearGradient>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

type InventoryItemListProps = {
  items: InventoryLibraryItem[];
  isDark: boolean;
  getImageSource: (name: string) => unknown;
  onSelect: (type: string) => void;
  scrollable?: boolean;
};

export function InventoryItemList({
  items,
  isDark,
  getImageSource,
  onSelect,
  scrollable = true,
}: InventoryItemListProps) {
  const c = getPalette(isDark);
  const [statsItem, setStatsItem] = useState<string | null>(null);

  const renderCard = (item: InventoryLibraryItem, index: number) => (
    <AnimatedEntrance key={`${item.type}-${index}`} index={index} stagger={30} style={styles.cardWrap}>
      <PressableScale
        haptic="select"
        onPress={() => onSelect(item.type)}
        onLongPress={() => setStatsItem(item.type)}
        style={[styles.card, { backgroundColor: c.surfaceAlt, borderColor: c.border }, cardShadow(isDark)]}
      >
        <View style={[styles.qtyBadge, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.qtyBadgeText, { color: c.accent }]}>×{item.quantity}</Text>
        </View>
        <View style={[styles.cardImageWell, { backgroundColor: c.surface }]}>
          <Image
            source={getImageSource(item.type) as number}
            style={styles.cardImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
        <Text style={[styles.cardName, { color: c.text }]} numberOfLines={1}>
          {item.type}
        </Text>
        <Text style={[styles.cardQty, { color: c.textMuted }]}>
          {item.quantity} in inventory
        </Text>
      </PressableScale>
    </AnimatedEntrance>
  );

  const grid = <View style={styles.grid}>{items.map(renderCard)}</View>;
  // Nested inside the sheet's Modal on purpose: a nested RN Modal presents on
  // top of the open sheet on iOS, while a sibling one would be queued.
  const statsPopup = <ItemStatsPopup itemName={statsItem} onClose={() => setStatsItem(null)} />;

  if (!scrollable) {
    return (
      <>
        {grid}
        {statsPopup}
      </>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.gridScroll}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
      >
        {grid}
      </ScrollView>
      {statsPopup}
    </>
  );
}

type InventoryEmptyStateProps = {
  isDark: boolean;
  message?: string;
  onGoToShop: () => void;
};

export function InventoryEmptyState({
  isDark,
  message = 'No items in your inventory',
  onGoToShop,
}: InventoryEmptyStateProps) {
  const c = getPalette(isDark);

  return (
    <AnimatedEntrance style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: c.surfaceAlt }, cardShadow(isDark)]}>
        <Ionicons name="cube-outline" size={36} color={c.accent} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{message}</Text>
      <Text style={[styles.emptySub, { color: c.textMuted }]}>
        Stock up in the store to deploy on the map.
      </Text>
      <PressableScale haptic="tap" onPress={onGoToShop} style={styles.shopCta}>
        <LinearGradient colors={Gradients.brand} style={styles.shopCtaFill}>
          <Ionicons name="storefront" size={18} color="#fff" />
          <Text style={styles.shopCtaText}>Go to Store</Text>
        </LinearGradient>
      </PressableScale>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  // Content-sized so the sheet can hug its contents (fitToContents).
  shell: {
    flexShrink: 1,
    minHeight: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  headerText: { flex: 1 },
  headerTitle: {
    color: '#fff',
    ...Type.title,
    fontSize: 18,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    ...Type.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flexShrink: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  gridScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  gridContent: {
    paddingBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.md,
  },
  cardWrap: {
    width: '48.5%',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  qtyBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  qtyBadgeText: {
    ...Type.micro,
  },
  cardImageWell: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  cardImage: {
    width: 54,
    height: 54,
  },
  cardName: {
    ...Type.headline,
    fontSize: 15,
    textAlign: 'center',
  },
  cardQty: {
    ...Type.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  emptyWrap: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Type.headline,
    fontSize: 17,
  },
  emptySub: {
    ...Type.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  shopCta: {
    marginTop: Spacing.xl,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  shopCtaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  shopCtaText: {
    color: '#fff',
    ...Type.button,
    fontSize: 16,
  },
});
