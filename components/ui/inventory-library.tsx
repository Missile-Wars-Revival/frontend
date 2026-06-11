import React from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { AnimatedEntrance } from './AnimatedEntrance';
import { PressableScale } from './PressableScale';
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
      <View style={[styles.footer, { borderTopColor: c.border }]}>
        <PressableScale haptic="select" onPress={onClose} style={styles.doneBtn}>
          <Text style={[styles.doneText, { color: c.textMuted }]}>Done</Text>
        </PressableScale>
      </View>
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

  const renderItem = ({ item, index }: { item: InventoryLibraryItem; index: number }) => (
    <AnimatedEntrance index={index}>
      <PressableScale
        haptic="select"
        onPress={() => onSelect(item.type)}
        style={[styles.itemRow, { backgroundColor: c.surfaceAlt }, cardShadow(isDark)]}
      >
        <View style={[styles.itemImageWrap, { backgroundColor: c.surface }]}>
          <Image
            source={getImageSource(item.type) as number}
            style={styles.itemImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
        </View>
        <View style={styles.itemText}>
          <Text style={[styles.itemName, { color: c.text }]} numberOfLines={1}>
            {item.type}
          </Text>
          <Text style={[styles.itemQty, { color: c.textMuted }]}>
            {item.quantity} in inventory
          </Text>
        </View>
        <View style={[styles.qtyPill, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.qtyPillText, { color: c.accent }]}>×{item.quantity}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.textFaint} />
      </PressableScale>
    </AnimatedEntrance>
  );

  if (!scrollable) {
    return (
      <View style={styles.listContent}>
        {items.map((item, index) => (
          <React.Fragment key={`${item.type}-${index}`}>
            {renderItem({ item, index })}
          </React.Fragment>
        ))}
      </View>
    );
  }

  if (items.length > 8) {
    return (
      <FlatList
        data={items}
        keyExtractor={(item, index) => `${item.type}-${index}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {items.map((item, index) => (
        <React.Fragment key={`${item.type}-${index}`}>
          {renderItem({ item, index })}
        </React.Fragment>
      ))}
    </ScrollView>
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
  shell: {
    flex: 1,
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
    flex: 1,
    minHeight: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'flex-end',
  },
  doneBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  doneText: {
    ...Type.button,
    fontSize: 16,
  },
  listContent: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  itemImageWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImage: {
    width: 36,
    height: 36,
  },
  itemText: {
    flex: 1,
  },
  itemName: {
    ...Type.headline,
  },
  itemQty: {
    ...Type.caption,
    fontWeight: '500',
    marginTop: 2,
  },
  qtyPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  qtyPillText: {
    ...Type.micro,
  },
  emptyWrap: {
    flex: 1,
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