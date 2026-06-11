import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, useColorScheme, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import useFetchFriends from '../hooks/websockets/friendshook';
import { Friend } from '../types/types';
import { getDatabase, ref, push, set, update, serverTimestamp, query, orderByChild, equalTo, get } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../util/Context/authcontext';
import { Avatar } from '../components/ui/Avatar';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';
import { PressableScale } from '../components/ui/PressableScale';
import { haptics } from '../components/ui/haptics';
import { getPalette, Gradients, Radius, Spacing, Type, cardShadow } from '../components/ui/theme';

const FriendItem = React.memo(function FriendItem({
  item,
  index,
  onPress,
  isDarkMode,
}: {
  item: Friend;
  index: number;
  onPress: (username: string) => void;
  isDarkMode: boolean;
}) {
  const c = getPalette(isDarkMode);

  return (
    <AnimatedEntrance index={index}>
      <PressableScale
        haptic="select"
        onPress={() => onPress(item.username)}
        style={[styles.friendItem, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}
        accessibilityLabel={`Start chat with ${item.username}`}
      >
        <Avatar uri={item.profileImageUrl} style={[styles.friendImage, { borderColor: c.border }]} contentFit="cover" />
        <View style={styles.friendText}>
          <Text style={[styles.friendName, { color: c.text }]} numberOfLines={1}>
            {item.username}
          </Text>
          <Text style={[styles.friendSub, { color: c.textMuted }]}>Tap to start chatting</Text>
        </View>
        <View style={[styles.chatIcon, { backgroundColor: c.accentSoft }]}>
          <Ionicons name="chatbubble-ellipses" size={18} color={c.accent} />
        </View>
      </PressableScale>
    </AnimatedEntrance>
  );
});

const FriendsList = () => {
  const router = useRouter();
  const { signOut } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);
  const friends = useFetchFriends();
  const [username, setUsername] = useState<string | null>(null);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/friends/msg');
    }
  }, [router]);

  useEffect(() => {
    const checkAuthentication = async () => {
      const storedUsername = await SecureStore.getItemAsync('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        Alert.alert("Not Signed In", "Please sign in to view your friends list.");
        // signOut relaunches the app shell back to splash → onboarding → login.
        await signOut();
      }
    };

    void checkAuthentication();
  }, [router, signOut]);

  const createNewConversation = useCallback(async (friendUsername: string) => {
    if (!username) {
      Alert.alert("Not Signed In", "Please sign in to start a conversation.");
      return;
    }

    const currentUser = username;

    try {
      haptics.tap();
      const db = getDatabase();
      const participants = [currentUser, friendUsername].sort();
      const participantsString = participants.join(',');

      const conversationsRef = ref(db, 'conversations');
      const conversationsQuery = query(conversationsRef, orderByChild('participants'), equalTo(participantsString));

      const snapshot = await get(conversationsQuery);

      let conversationId: string;

      if (snapshot.exists()) {
        const existingId = Object.keys(snapshot.val() || {})[0];
        conversationId = existingId || '';
      } else {
        const newConversationRef = push(conversationsRef);
        conversationId = newConversationRef.key!;

        const conversationData = {
          participants: participantsString,
          participantsArray: participants,
          createdAt: serverTimestamp(),
          lastMessage: {
            text: '',
            timestamp: serverTimestamp(),
            senderId: '',
            isRead: true
          },
          unreadCount: 0
        };

        await set(newConversationRef, conversationData);
      }

      const userConversationsRef = ref(db, `users/${currentUser}/conversations`);
      const userConversationsSnapshot = await get(userConversationsRef);
      const userConversations = userConversationsSnapshot.val() || {};

      const updates: Record<string, boolean> = {};

      if (!userConversations[conversationId]) {
        updates[`users/${currentUser}/conversations/${conversationId}`] = true;
      }

      const friendConversationsRef = ref(db, `users/${friendUsername}/conversations`);
      const friendConversationsSnapshot = await get(friendConversationsRef);
      const friendConversations = friendConversationsSnapshot.val() || {};

      if (!friendConversations[conversationId]) {
        updates[`users/${friendUsername}/conversations/${conversationId}`] = true;
      }

      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }

      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (err: unknown) {
      console.error('Failed to create conversation:', err);
      const error = err as Error & { code?: string };
      Alert.alert("Error", `Failed to create or find a conversation. Error: ${error.message || String(err)}`);
    }
  }, [username, router]);

  const renderFriendItem = useCallback(({ item, index }: { item: Friend; index: number }) => (
    <FriendItem
      item={item}
      index={index}
      onPress={createNewConversation}
      isDarkMode={isDarkMode}
    />
  ), [createNewConversation, isDarkMode]);

  const memoizedFriends = useMemo(() => friends, [friends]);

  if (!username) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        <Text style={[styles.centerText, { color: c.textMuted }]}>
          Please sign in to view your friends list.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <LinearGradient
        colors={isDarkMode ? ['#241B45', '#15172B'] : Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <PressableScale haptic="select" onPress={goBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </PressableScale>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>New chat</Text>
          <Text style={styles.headerTitle}>Select a Friend</Text>
        </View>
        <View style={styles.backBtn} />
      </LinearGradient>

      <FlatList
        data={memoizedFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.username}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AnimatedEntrance style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
              <Ionicons name="people-outline" size={36} color={c.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No friends yet</Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>
              Add friends first, then come back to start a chat.
            </Text>
          </AnimatedEntrance>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    flexGrow: 1,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  friendImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  friendText: { flex: 1 },
  friendName: { ...Type.headline },
  friendSub: { ...Type.caption, fontWeight: '500', marginTop: 2 },
  chatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 3,
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
  emptyTitle: { ...Type.title, fontSize: 18 },
  emptySub: { ...Type.body, textAlign: 'center', marginTop: Spacing.sm },
  centerText: {
    textAlign: 'center',
    marginTop: Spacing.xl,
    ...Type.body,
  },
});

export default FriendsList;