import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Modal, Alert, TextInput, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from '@react-native-vector-icons/ionicons';
import FriendsList from "../../../components/Friends/FriendsList";
import { useRouter } from "expo-router";
import { removeFriend } from "../../../api/friends";
import { MissileLibrary } from "../../../components/Missile/missile";
import { searchFriendsAdded } from "../../../api/getplayerlocations";
import { useNotifications, notificationEmitter } from "../../../components/Notifications/useNotifications";
import useFetchFriends from "../../../hooks/websockets/friendshook";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getlocActive } from "../../../api/locationOptions";
import { AnimatedEntrance } from "../../../components/ui/AnimatedEntrance";
import { PressableScale } from "../../../components/ui/PressableScale";
import { haptics } from "../../../components/ui/haptics";
import { getPalette, Gradients, Radius, Spacing, cardShadow, floatingAboveTabBar } from "../../../components/ui/theme";
import { getSecureItemSafely } from "../../../util/secure-store";

const DEV_OFFLINE_TOKEN = "dev-offline-token";

interface Friend {
  username: string;
  profileImageUrl: string | null;
}

const FriendsPage: React.FC = () => {
  const friends = useFetchFriends() //WS
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const router = useRouter();
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { unreadCount: initialUnreadCount, unreadChatCount: initialUnreadChatCount } = useNotifications();
  const [localUnreadCount, setLocalUnreadCount] = useState(initialUnreadCount);
  const [localUnreadChatCount, setLocalUnreadChatCount] = useState(initialUnreadChatCount);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const colorScheme = useColorScheme();
  const [locActive, setLocActive] = useState<boolean>(true);
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);
  const insets = useSafeAreaInsets();
  const [canShowChatFab, setCanShowChatFab] = useState(false);

  const handleUnreadCountUpdate = useCallback(({ count, chatCount }: { count: number, chatCount: number }) => {
    setLocalUnreadCount(count);
    setLocalUnreadChatCount(chatCount);
  }, []);

  useEffect(() => {
    notificationEmitter.on('unreadCountUpdated', handleUnreadCountUpdate);
    return () => {
      notificationEmitter.off('unreadCountUpdated', handleUnreadCountUpdate);
    };
  }, [handleUnreadCountUpdate]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isAliveStatusString = await AsyncStorage.getItem('isAlive');
        if (isAliveStatusString) {
          const parsed = JSON.parse(isAliveStatusString);
          const alive = typeof parsed === 'boolean' ? parsed : parsed?.isAlive ?? true;
          setIsAlive(alive);
        } else {
          setIsAlive(true); // Default to true if no status is found
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    const fetchLocActiveStatus = async () => {
      try {
        const status = await getlocActive();
        setLocActive(status != null ? Boolean(status) : true);
      } catch (error) {
        console.error("Failed to fetch locActive status:", error);
      }
    };
    fetchLocActiveStatus();
    const intervalId = setInterval(fetchLocActiveStatus, 30000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const checkChatAccess = async () => {
      const [firebaseUID, token] = await Promise.all([
        getSecureItemSafely("firebaseUID"),
        getSecureItemSafely("token"),
      ]);
      const isDevAccount = __DEV__ && token === DEV_OFFLINE_TOKEN;
      setCanShowChatFab(!!firebaseUID || isDevAccount);
    };
    void checkChatAccess();
  }, []);

  const handleRemPress = (friendUsername: string) => {
    haptics.warning();
    setSelectedFriend(friendUsername);
    setModalVisible(true);
  };

  const fireMissile = (username: string) => {
    haptics.tap();
    setSelectedPlayer(username);
    setShowMissileLibrary(true);
  };

  // The launch animation plays at the app root (triggerGameEffect inside
  // MissileLibrary), so all this has to do is dismiss the library.
  const handleMissileFired = () => {
    setShowMissileLibrary(false);
    setSelectedPlayer("");
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    const token = await getSecureItemSafely("token");
    try {
      if (!token) {
        console.log('Token not found');
        return;
      }
      const response = await removeFriend(token, friendUsername);
      if (response.message === "Friend removed successfully") {
        haptics.success();
        Alert.alert("Success", "Friend successfully removed.");
        setModalVisible(false);
      } else {
        Alert.alert("Error", response?.message || "Failed to remove friend.");
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      haptics.error();
      Alert.alert("Error", "An unexpected error occurred while removing the friend.");
    }
  };

  const navigateToUserProfile = (username: string) => {
    router.navigate({
      pathname: "/friends/user-profile",
      params: { username }
    });
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setFilteredFriends([]);
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);
    try {
      const currentUserUsername = await getSecureItemSafely("username");
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        setFilteredFriends([]);
        return;
      }
      const result = await searchFriendsAdded(text);
      // profileImageUrl is resolved server-side and already present on each result.
      const filteredResult = result.filter(friend => friend.username !== currentUserUsername);
      setFilteredFriends(filteredResult);
    } catch (error) {
      console.error("Failed to search for friends:", error);
      setFilteredFriends([]);
    }
  };

  const listFriends = isSearchActive ? filteredFriends : friends;
  const showEmpty = isSearchActive
    ? filteredFriends.length === 0
    : friends.length === 0;
  const unreadBadgeLabel = localUnreadCount > 99 ? '99+' : localUnreadCount.toString();

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <LinearGradient
        colors={isDarkMode ? ['#241B45', '#15172B'] : Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerEyebrow}>Your squad</Text>
            <Text style={styles.headerTitle}>Friends</Text>
            <Text style={styles.headerCount}>
              {friends.length} {friends.length === 1 ? 'ally' : 'allies'}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <PressableScale
              haptic="tap"
              onPress={() => router.navigate("/friends/notifications")}
              style={styles.headerIconBtn}
            >
              <Ionicons name="notifications" size={22} color="#fff" />
              {localUnreadCount > 0 && (
                <View style={[styles.badge, unreadBadgeLabel.length > 2 && styles.badgeWide]}>
                  <Text style={styles.badgeText} numberOfLines={1} adjustsFontSizeToFit>
                    {unreadBadgeLabel}
                  </Text>
                </View>
              )}
            </PressableScale>
            <PressableScale
              haptic="tap"
              onPress={() => router.navigate("/friends/add-friends")}
              style={styles.headerIconBtn}
            >
              <Ionicons name="person-add" size={20} color="#fff" />
            </PressableScale>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchWrap}>
          <BlurView
            intensity={isDarkMode ? 30 : 50}
            tint={isDarkMode ? 'dark' : 'light'}
            style={styles.searchBlur}
          >
            <Ionicons name="search" size={18} color="rgba(255,255,255,0.85)" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search friends..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={searchTerm}
              onChangeText={handleSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchTerm.length > 0 && (
              <PressableScale haptic="soft" onPress={() => handleSearch("")} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.85)" />
              </PressableScale>
            )}
          </BlurView>
        </View>
      </LinearGradient>

      {showEmpty ? (
        <AnimatedEntrance style={styles.emptyWrap}>
          <View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
            <Ionicons
              name={isSearchActive ? "search" : "people"}
              size={40}
              color={c.accent}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: c.text }]}>
            {isSearchActive
              ? (searchTerm.trim() ? "No friends found" : "Type to search friends")
              : "No friends yet"}
          </Text>
          {!isSearchActive && (
            <>
              <Text style={[styles.emptySub, { color: c.textMuted }]}>
                Add players nearby to build your squad.
              </Text>
              <PressableScale
                haptic="tap"
                onPress={() => router.navigate("/friends/add-friends")}
                style={styles.emptyCta}
              >
                <LinearGradient colors={Gradients.brand} style={styles.emptyCtaFill}>
                  <Ionicons name="person-add" size={18} color="#fff" />
                  <Text style={styles.emptyCtaText}>Add friends</Text>
                </LinearGradient>
              </PressableScale>
            </>
          )}
        </AnimatedEntrance>
      ) : (
        <FriendsList
          friends={listFriends}
          isDarkMode={isDarkMode}
          showFire={!isSearchActive && isAlive && locActive}
          onProfilePress={navigateToUserProfile}
          onFirePress={fireMissile}
          onRemovePress={handleRemPress}
        />
      )}

      {/* Remove friend confirmation */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <AnimatedEntrance fromScale={0.92} style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <View style={[styles.modalIcon, { backgroundColor: 'rgba(225,29,72,0.12)' }]}>
              <Ionicons name="person-remove" size={26} color="#E11D48" />
            </View>
            <Text style={[styles.modalTitle, { color: c.text }]}>Remove Friend</Text>
            <Text style={[styles.modalText, { color: c.textMuted }]}>
              Are you sure you want to remove {selectedFriend} from your friends list?
            </Text>
            <View style={styles.modalButtons}>
              <PressableScale
                haptic="select"
                onPress={() => setModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: c.surfaceAlt }]}
              >
                <Text style={[styles.modalBtnText, { color: c.text }]}>Cancel</Text>
              </PressableScale>
              <PressableScale
                haptic="heavy"
                onPress={() => handleRemoveFriend(selectedFriend)}
                style={styles.modalBtn}
              >
                <LinearGradient colors={Gradients.danger} style={styles.modalBtnFill}>
                  <Text style={[styles.modalBtnText, { color: '#fff' }]}>Remove</Text>
                </LinearGradient>
              </PressableScale>
            </View>
          </AnimatedEntrance>
        </View>
      </Modal>

      {/* Missile library */}
      <Modal
        animationType="slide"
        transparent
        visible={showMissileLibrary}
        onRequestClose={() => setShowMissileLibrary(false)}
      >
        <View style={[styles.missileContainer, { backgroundColor: c.bg }]}>
          <LinearGradient colors={Gradients.fire} style={styles.missileHeader}>
            <Text style={styles.missileTitle}>Missile Library</Text>
            <PressableScale haptic="select" onPress={() => setShowMissileLibrary(false)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Done</Text>
            </PressableScale>
          </LinearGradient>
          {isAlive && locActive ? (
            <MissileLibrary
              playerName={selectedPlayer}
              onMissileFired={handleMissileFired}
              onClose={() => setShowMissileLibrary(false)}
            />
          ) : (
            <View style={styles.missileEmpty}>
              <Ionicons name="skull" size={40} color={c.textMuted} />
              <Text style={[styles.emptySub, { color: c.textMuted, marginTop: Spacing.md }]}>
                You cannot fire missiles when eliminated.
              </Text>
            </View>
          )}
        </View>
      </Modal>

      {canShowChatFab && (
        <PressableScale
          haptic="tap"
          onPress={() => router.navigate("/friends/msg")}
          style={[styles.fab, { bottom: floatingAboveTabBar(insets.bottom, Spacing.xs) }]}
        >
          <LinearGradient colors={Gradients.brand} style={styles.fabFill}>
            <Ionicons name="chatbubble-ellipses" size={26} color="#fff" />
          </LinearGradient>
          {localUnreadChatCount > 0 && (
            <View style={styles.chatBadge}>
              <Text style={styles.badgeText}>
                {localUnreadChatCount > 99 ? '99+' : localUnreadChatCount}
              </Text>
            </View>
          )}
        </PressableScale>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 2 },
  headerCount: { color: 'rgba(255,255,255,0.85)', fontSize: 14, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  headerIconBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    // No overflow clipping: the unread badge hangs outside the circle.
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: '#F5365C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeWide: {
    minWidth: 30,
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center' },
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
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { fontSize: 15, textAlign: 'center', marginTop: Spacing.sm },
  emptyCta: { marginTop: Spacing.xl, borderRadius: Radius.pill, overflow: 'hidden' },
  emptyCtaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    // borderRadius on the gradient itself: wrapper overflow clipping is
    // unreliable on Android.
    borderRadius: Radius.pill,
  },
  emptyCtaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: Spacing.sm },
  modalText: { fontSize: 15, textAlign: 'center', lineHeight: 21, marginBottom: Spacing.xl },
  modalButtons: { flexDirection: 'row', gap: Spacing.md, width: '100%' },
  modalBtn: { flex: 1, borderRadius: Radius.pill, overflow: 'hidden' },
  modalBtnFill: { paddingVertical: Spacing.md, alignItems: 'center' },
  modalBtnText: { fontSize: 16, fontWeight: '700', paddingVertical: Spacing.md, textAlign: 'center' },
  missileContainer: { flex: 1, paddingTop: 50 },
  missileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  missileTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  doneBtnText: { color: '#fff', fontWeight: '700' },
  missileEmpty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  fab: {
    position: 'absolute',
    left: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 10,
    shadowColor: '#5B5BF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabFill: { flex: 1, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  chatBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 22,
    height: 22,
    paddingHorizontal: 5,
    borderRadius: 11,
    backgroundColor: '#F5365C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default FriendsPage;
