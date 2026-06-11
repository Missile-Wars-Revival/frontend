import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import * as SecureStore from 'expo-secure-store';
import { addFriend } from '../../../api/friends';
import { getuserprofile } from '../../../api/getprofile';
import useFetchFriends from '../../../hooks/websockets/friendshook';
import { Avatar } from '../../../components/ui/Avatar';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { PressableScale } from '../../../components/ui/PressableScale';
import { getPalette, Gradients, Radius, Spacing, cardShadow, floatingAboveTabBar } from '../../../components/ui/theme';

const badgeImages = {
  Founder: require('../../../assets/icons/founder.png'),
  Staff: require('../../../assets/icons/staff.png'),
  Early: require('../../../assets/icons/earlysupporter.png'),
  Bronze: require('../../../assets/leagues/bronze.png'),
  Silver: require('../../../assets/leagues/silver.png'),
  Gold: require('../../../assets/leagues/gold.png'),
  Diamond: require('../../../assets/leagues/diamond.png'),
  Legend: require('../../../assets/leagues/legend.png'),
};

export interface Statistics {
  badges: string[];
  numDeaths: number;
  numKills: number;
  numLootPlaced: number;
  numLandminesPlaced: number;
  numMissilesPlaced: number;
  numLootPickups: number;
  league: string;
}

interface MutualFriend {
  username: string;
  profileImageUrl: string | null;
}

interface UserProfile {
  username: string;
  rankpoints: number;
  profileImageUrl: string | null;
  mutualFriends: MutualFriend[];
  statistics: Statistics;
}

interface ApiResponse {
  success: boolean;
  userProfile: UserProfile;
}

const STAT_META: { key: keyof Statistics; label: string; icon: any; colors: readonly [string, string] }[] = [
  { key: 'numKills', label: 'Kills', icon: 'flame', colors: Gradients.fire },
  { key: 'numDeaths', label: 'Deaths', icon: 'skull', colors: ['#94A3B8', '#475569'] },
  { key: 'numMissilesPlaced', label: 'Missiles', icon: 'rocket', colors: ['#6D5BF8', '#9B5BF0'] },
  { key: 'numLandminesPlaced', label: 'Landmines', icon: 'warning', colors: Gradients.gold },
  { key: 'numLootPlaced', label: 'Loot Placed', icon: 'cube', colors: ['#38BDF8', '#0EA5E9'] },
  { key: 'numLootPickups', label: 'Loot Pickups', icon: 'gift', colors: Gradients.success },
];

const UserProfilePage: React.FC = () => {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const friends = useFetchFriends();
  const isDarkMode = useColorScheme() === 'dark';
  const c = getPalette(isDarkMode);
  const insets = useSafeAreaInsets();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [addedAsFriend, setAddedAsFriend] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isFriend = useMemo(
    () => addedAsFriend || Boolean(username && friends.some((friend) => friend.username === username)),
    [addedAsFriend, friends, username],
  );

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/friends');
    }
  }, [router]);

  const fetchUserProfile = useCallback(async () => {
    if (!username) return;
    try {
      setIsLoading(true);
      const response = await getuserprofile(username) as ApiResponse;
      if (response.success && response.userProfile) {
        setAddedAsFriend(false);
        setUserProfile(response.userProfile);
      } else {
        console.error('Failed to fetch user profile: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user profile', error);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchUserProfile();
  }, [fetchUserProfile]);

  const handleAddFriend = async () => {
    const token = await SecureStore.getItemAsync('token');
    if (!token || !userProfile) return;

    try {
      const result = await addFriend(token, userProfile.username);
      if (result.message === 'Friend added successfully') {
        setAddedAsFriend(true);
        Alert.alert('Success', 'Friend added successfully!');
      } else {
        Alert.alert('Error', result.message || 'Failed to add friend.');
      }
    } catch (error) {
      console.warn('Error adding friend:', error);
      Alert.alert('This player is already your friend!');
    }
  };

  const renderBadge = (badge: string) => {
    const badgeKey = Object.keys(badgeImages).find(key => badge.toLowerCase().includes(key.toLowerCase()));
    if (!badgeKey) return null;

    return (
      <PressableScale key={badge} haptic="select" style={styles.badge} onPress={() => setSelectedBadge(badge)}>
        <Image source={badgeImages[badgeKey as keyof typeof badgeImages]} style={styles.badgeImage} contentFit="contain" />
      </PressableScale>
    );
  };

  if (!username) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <Text style={[styles.muted, { color: c.textMuted }]}>No username provided</Text>
      </View>
    );
  }

  if (isLoading || !userProfile) {
    return (
      <View style={[styles.centered, { backgroundColor: c.bg }]}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: floatingAboveTabBar(insets.bottom, Spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={isDarkMode ? ['#241B45', '#15172B'] : Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <PressableScale haptic="select" onPress={goBack} style={styles.iconBtn}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </PressableScale>
            <Text style={styles.heroHeading}>Friend Profile</Text>
            <View style={styles.iconBtnPlaceholder} />
          </View>

          <AnimatedEntrance fromScale={0.92} style={styles.heroBody}>
            <Avatar uri={userProfile.profileImageUrl} style={styles.avatar} transition={250} />
            <Text style={styles.heroName} numberOfLines={1}>{userProfile.username}</Text>
            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Ionicons name="medal" size={14} color="#FFD56B" />
                <Text style={styles.pillText}>{userProfile.rankpoints} RP</Text>
              </View>
              {!!userProfile.statistics.league && (
                <View style={styles.pill}>
                  <Ionicons name="ribbon" size={14} color="#fff" />
                  <Text style={styles.pillText}>{userProfile.statistics.league}</Text>
                </View>
              )}
            </View>
            {!isFriend && (
              <PressableScale haptic="tap" style={styles.addFriendBtn} onPress={handleAddFriend}>
                <LinearGradient colors={Gradients.success} style={styles.addFriendFill}>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.addFriendText}>Add Friend</Text>
                </LinearGradient>
              </PressableScale>
            )}
          </AnimatedEntrance>
        </LinearGradient>

        <AnimatedEntrance index={0} style={[styles.card, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Badges</Text>
          <View style={styles.badgesList}>
            {userProfile.statistics.badges?.length ? (
              userProfile.statistics.badges.map(renderBadge)
            ) : (
              <Text style={[styles.muted, { color: c.textMuted }]}>No badges yet</Text>
            )}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={1} style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: c.text }]}>Statistics</Text>
          <View style={styles.statsGrid}>
            {STAT_META.map((s) => (
              <View key={s.key} style={[styles.statCard, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
                <LinearGradient colors={s.colors} style={styles.statIcon}>
                  <Ionicons name={s.icon} size={18} color="#fff" />
                </LinearGradient>
                <Text style={[styles.statValue, { color: c.text }]}>{userProfile.statistics[s.key] as number}</Text>
                <Text style={[styles.statLabel, { color: c.textMuted }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance index={2} style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: c.text }]}>Mutual Friends</Text>
          {userProfile.mutualFriends?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContent}>
              {userProfile.mutualFriends.map((friend) => (
                <View key={friend.username} style={styles.friendItem}>
                  <Avatar uri={friend.profileImageUrl} style={[styles.friendImage, { borderColor: c.surface }]} />
                  <Text style={[styles.friendName, { color: c.textMuted }]} numberOfLines={1}>{friend.username}</Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No mutual friends</Text>
          )}
        </AnimatedEntrance>
      </ScrollView>

      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: c.overlay }]} onPress={() => setSelectedBadge(null)}>
          <AnimatedEntrance fromScale={0.9} style={[styles.badgeModal, { backgroundColor: c.surface }]}>
            {(() => {
              const key = selectedBadge && Object.keys(badgeImages).find(k => selectedBadge.toLowerCase().includes(k.toLowerCase()));
              return key ? <Image source={badgeImages[key as keyof typeof badgeImages]} style={styles.badgeModalImage} /> : null;
            })()}
            <Text style={[styles.badgeModalText, { color: c.text }]}>{selectedBadge}</Text>
          </AnimatedEntrance>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: Spacing.xxl * 2 },
  hero: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroHeading: { color: '#fff', fontSize: 20, fontWeight: '800' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBtnPlaceholder: { width: 44, height: 44 },
  heroBody: { alignItems: 'center', marginTop: Spacing.lg },
  avatar: { width: 112, height: 112, borderRadius: 56, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  heroName: { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: Spacing.md },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  addFriendBtn: { marginTop: Spacing.lg, borderRadius: Radius.pill, overflow: 'hidden' },
  addFriendFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  addFriendText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionWrap: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md, textAlign: 'center' },
  sectionHeading: { fontSize: 19, fontWeight: '800', marginBottom: Spacing.md },
  muted: { fontSize: 14, textAlign: 'center' },
  badgesList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: Spacing.md },
  badge: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  badgeImage: { width: '100%', height: '100%' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  statCard: {
    width: '30.8%',
    minWidth: 96,
    flexGrow: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  sliderContent: { gap: Spacing.md, paddingVertical: Spacing.xs, paddingRight: Spacing.lg },
  friendItem: { width: 76, alignItems: 'center' },
  friendImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
  friendName: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  badgeModal: { borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' },
  badgeModalImage: { width: 80, height: 80, resizeMode: 'contain', marginBottom: Spacing.md },
  badgeModalText: { fontSize: 18, fontWeight: '700' },
});

export default UserProfilePage;
