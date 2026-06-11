import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import AnimatedEntrance from '../ui/AnimatedEntrance';
import PressableScale from '../ui/PressableScale';
import { getPalette, Gradients, Radius, Spacing, cardShadow } from '../ui/theme';

export interface FriendListItem {
  username: string;
  profileImageUrl: string | null;
}

export interface FriendsListProps {
  friends: FriendListItem[];
  isDarkMode: boolean;
  /** Whether the "fire missile" action should be available (player alive + location active). */
  showFire: boolean;
  onProfilePress: (username: string) => void;
  onFirePress: (username: string) => void;
  onRemovePress: (username: string) => void;
}

const DEFAULT_IMAGE = require('../../assets/mapassets/Female_Avatar_PNG.png');

/**
 * Default (web / fallback) implementation. Native platforms use the SwiftUI
 * (`.ios.tsx`) and Jetpack Compose (`.android.tsx`) variants resolved by Metro.
 *
 * Rows animate in with a staggered spring (react-native-ease) and every action
 * is a haptic-backed PressableScale.
 */
export default function FriendsList({
  friends,
  isDarkMode,
  showFire,
  onProfilePress,
  onFirePress,
  onRemovePress,
}: FriendsListProps) {
  const c = getPalette(isDarkMode);

  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.username}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <AnimatedEntrance index={index}>
          <PressableScale
            haptic="select"
            onPress={() => onProfilePress(item.username)}
            style={[styles.row, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}
          >
            <View style={styles.info}>
              <View style={styles.avatarWrap}>
                <Image
                  source={item.profileImageUrl ? { uri: item.profileImageUrl } : DEFAULT_IMAGE}
                  style={styles.avatar}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={200}
                />
                <View style={[styles.onlineDot, { borderColor: c.surface }]} />
              </View>
              <View style={styles.nameWrap}>
                <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
                  {item.username}
                </Text>
                <Text style={[styles.subtitle, { color: c.textFaint }]} numberOfLines={1}>
                  Tap to message
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              {showFire && (
                <PressableScale
                  haptic="none"
                  onPress={() => onFirePress(item.username)}
                  style={styles.iconBtn}
                >
                  <LinearGradient colors={Gradients.fire} style={styles.iconBtnFill}>
                    <Ionicons name="rocket" size={18} color="#fff" />
                  </LinearGradient>
                </PressableScale>
              )}
              <PressableScale
                haptic="none"
                onPress={() => onRemovePress(item.username)}
                style={[styles.iconBtn, styles.removeBtn, { backgroundColor: c.surfaceAlt }]}
              >
                <Ionicons name="person-remove" size={16} color={c.textMuted} />
              </PressableScale>
            </View>
          </PressableScale>
        </AnimatedEntrance>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl * 3,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarWrap: { position: 'relative', marginRight: Spacing.md },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2.5,
  },
  nameWrap: { flex: 1 },
  name: { fontSize: 17, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconBtn: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  iconBtnFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  removeBtn: { justifyContent: 'center', alignItems: 'center' },
});
