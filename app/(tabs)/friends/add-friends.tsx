import React, { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, Alert, RefreshControl, TextInput, Keyboard, Pressable, useColorScheme, StyleSheet, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { NearbyPlayersData, searchOtherPlayersData } from "../../../api/getplayerlocations";
import { addFriend } from "../../../api/friends";
import { router } from "expo-router";
import { getCurrentLocation, location } from "../../../util/locationreq";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "../../../util/Context/authcontext";
import Ionicons from '@react-native-vector-icons/ionicons';
import { Avatar } from "../../../components/ui/Avatar";
import FriendAddedAnimation from "../../../components/Animations/FriendAddedAnimation";
import { AnimatedEntrance } from "../../../components/ui/AnimatedEntrance";
import { PressableScale } from "../../../components/ui/PressableScale";
import { haptics } from "../../../components/ui/haptics";
import { getPalette, Gradients, Radius, Spacing, cardShadow } from "../../../components/ui/theme";

interface Filterddata {
  username: string,
  latitude: string,
  longitude: string,
  profileImageUrl: string | null;
  isFriend?: string;
}

const EmptyState = ({ icon, label, c, isDarkMode }: { icon: any; label: string; c: ReturnType<typeof getPalette>; isDarkMode: boolean }) => (
  <AnimatedEntrance style={styles.emptyWrap}>
    <View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
      <Ionicons name={icon} size={36} color={c.accent} />
    </View>
    <Text style={[styles.emptyText, { color: c.textMuted }]}>{label}</Text>
  </AnimatedEntrance>
);

const QuickAddPage: React.FC = () => {
  const { signOut } = useAuth();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredData, setFilteredData] = useState<Filterddata[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);

  useEffect(() => {
    const fetchCredentials = async () => {
      const username = await SecureStore.getItemAsync("username");
      if (!username) {
        console.log('Credentials not found, please log in');
        // signOut relaunches the app shell back to splash → onboarding → login.
        await signOut();
      }
    };
    fetchCredentials();
  }, [signOut]);

  const fetchPlayers = useCallback((latitude: number, longitude: number) => {
    NearbyPlayersData(latitude, longitude)
      .then(data => {
        setPlayersData(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Failed to fetch players:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const loadInitialLocation = async () => {
      const loc: location = await getCurrentLocation();
      setUserLocation(loc);
    };
    loadInitialLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchPlayers(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation, fetchPlayers]);

  const handleAddFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found');
        return;
      }
      const result = await addFriend(token, friendUsername);
      if (result.message === "Friend added successfully") {
        haptics.success();
        setPlayersData(prevData =>
          prevData.map(player =>
            player.username === friendUsername ? { ...player, isFriend: "You are already friends with this person." } : player
          )
        );
        setFilteredData(prevData =>
          prevData.map(player =>
            player.username === friendUsername ? { ...player, isFriend: "You are already friends with this person." } : player
          )
        );
        setShowAnimation(true);
      } else {
        haptics.error();
        Alert.alert("Error", result.message || "Failed to add friend.");
      }
    } catch (error) {
      console.warn('Error adding friend:', error);
      haptics.warning();
      Alert.alert("This player is already your friend!");
    }
  };

  const onRefresh = async () => {
    haptics.soft();
    setRefreshing(true);
    if (userLocation) {
      setLoading(true);
      fetchPlayers(userLocation.latitude, userLocation.longitude);
    }
    setRefreshing(false);
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const currentUserUsername = await SecureStore.getItemAsync("username");
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        setFilteredData([]);
        setIsSearching(false);
        return;
      }
      const result = await searchOtherPlayersData(text);
      // profileImageUrl is resolved server-side and already present on each
      // result. Skip blank usernames defensively — ghost accounts rendered as
      // empty rows before the server-side filter existed.
      const filteredResult = result.filter(
        player => player.username && player.username !== currentUserUsername
      );
      setFilteredData(filteredResult);
    } catch (error) {
      console.error("Failed to search for players:", error);
      setFilteredData([]);
    }
  };

  const navigateToUserProfile = (username: string) => {
    haptics.select();
    router.navigate({
      pathname: "/profile/user-profile",
      params: { username }
    });
  };

  const renderPlayerItem = ({ item, index }: { item: Filterddata; index: number }) => {
    const alreadyFriend = !!item.isFriend;
    return (
      <AnimatedEntrance index={index}>
        <View style={[styles.playerItem, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
          <PressableScale
            haptic="select"
            style={styles.playerInfo}
            onPress={() => navigateToUserProfile(item.username)}
          >
            <Avatar
              uri={item.profileImageUrl}
              style={styles.playerImage}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.playerText}>
              <Text style={[styles.playerName, { color: c.text }]} numberOfLines={1}>{item.username}</Text>
              <Text style={[styles.playerSub, { color: c.textFaint }]} numberOfLines={1}>
                {alreadyFriend ? 'Already friends' : 'Tap to view profile'}
              </Text>
            </View>
          </PressableScale>
          {alreadyFriend ? (
            <View style={[styles.addedBtn, { backgroundColor: c.surfaceAlt }]}>
              <Ionicons name="checkmark" size={20} color="#22C55E" />
            </View>
          ) : (
            <PressableScale haptic="none" style={styles.addBtn} onPress={() => handleAddFriend(item.username)}>
              <LinearGradient colors={Gradients.success} style={styles.addBtnFill}>
                <Ionicons name="person-add" size={18} color="#fff" />
              </LinearGradient>
            </PressableScale>
          )}
        </View>
      </AnimatedEntrance>
    );
  };

  return (
    <Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <LinearGradient
          colors={isDarkMode ? ['#241B45', '#15172B'] : Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <PressableScale
              haptic="select"
              style={styles.backBtn}
              onPress={() => (router.canGoBack() ? router.back() : router.navigate("/friends"))}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </PressableScale>
            <Text style={styles.headerTitle}>Add Friends</Text>
            <View style={styles.backBtnPlaceholder} />
          </View>

          <View style={styles.searchWrap}>
            <BlurView
              intensity={isDarkMode ? 30 : 50}
              tint={isDarkMode ? 'dark' : 'light'}
              style={styles.searchBlur}
            >
              <Ionicons name="search" size={18} color="rgba(255,255,255,0.85)" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username..."
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCorrect={false}
                autoCapitalize="none"
                value={searchTerm}
                onChangeText={handleSearch}
              />
              {searchTerm.length > 0 && (
                <PressableScale haptic="soft" onPress={() => handleSearch("")} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.85)" />
                </PressableScale>
              )}
            </BlurView>
          </View>
        </LinearGradient>

        {isSearching ? (
          <FlatList
            data={filteredData}
            renderItem={renderPlayerItem}
            keyExtractor={item => item.username}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Search results</Text>
            }
            ListEmptyComponent={<EmptyState icon="search" label="No players found" c={c} isDarkMode={isDarkMode} />}
          />
        ) : loading ? (
          <View style={styles.emptyWrap}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={[styles.emptyText, { color: c.textMuted, marginTop: Spacing.md }]}>
              Finding players nearby...
            </Text>
          </View>
        ) : (
          <FlatList
            data={playersData}
            renderItem={renderPlayerItem}
            keyExtractor={(item) => item.username}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.nearbyHeader}>
                <Ionicons name="location" size={16} color={c.accent} />
                <Text style={[styles.sectionTitle, { color: c.textMuted, marginBottom: 0 }]}>
                  Players nearby
                </Text>
              </View>
            }
            ListEmptyComponent={<EmptyState icon="navigate-circle" label="No players found near you" c={c} isDarkMode={isDarkMode} />}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[c.accent]}
                tintColor={c.accent}
              />
            }
          />
        )}

        {showAnimation && (
          <FriendAddedAnimation
            onAnimationComplete={() => {
              setShowAnimation(false);
              Alert.alert("Success", "Friend added successfully!");
            }}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  // Invisible spacer that keeps the title centred opposite the back button.
  backBtnPlaceholder: { width: 44, height: 44 },
  searchWrap: { marginTop: Spacing.lg, borderRadius: Radius.pill, overflow: 'hidden' },
  searchBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    height: 50,
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },
  clearBtn: { padding: 2 },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  nearbyHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  playerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  playerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  playerImage: { width: 52, height: 52, borderRadius: 26, marginRight: Spacing.md },
  playerText: { flex: 1 },
  playerName: { fontSize: 16, fontWeight: '700' },
  playerSub: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  // borderRadius on the gradient itself: overflow clipping on the wrapper is
  // unreliable on Android, which left the button looking square.
  addBtnFill: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 22 },
  addedBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.xxl * 2, paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyText: { fontSize: 15, textAlign: 'center' },
});

export default QuickAddPage;
