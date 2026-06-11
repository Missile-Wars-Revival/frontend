import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, useColorScheme, PanResponder, Animated, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack, useFocusEffect } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getDatabase, ref, onValue, get, remove, off } from 'firebase/database';
import * as SecureStore from "expo-secure-store";
import useFetchFriends from '../../../hooks/websockets/friendshook';
import { markMessageNotificationAsRead } from '../../../api/notifications';
import { notificationEmitter } from '../../../components/Notifications/useNotifications';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { PressableScale } from '../../../components/ui/PressableScale';
import { haptics } from '../../../components/ui/haptics';
import { getPalette, Gradients, Radius, Spacing, Type, cardShadow } from '../../../components/ui/theme';

const DEFAULT_IMAGE = require('../../../assets/mapassets/Female_Avatar_PNG.png');

type Conversation = {
  id: string;
  participants: string;
  participantsArray: string[];
  lastMessage: {
    text: string;
    timestamp: number;
    senderId: string;
    isRead: boolean;
  };
  unreadCount: number;
  otherParticipant: string;
};

const ConversationList = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const friends = useFetchFriends();

  const panRefs = useRef<{ [key: string]: Animated.ValueXY }>({});
  const isOpenRefs = useRef<{ [key: string]: boolean }>({});

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate('/friends');
    }
  }, [router]);

  const closeSwipe = useCallback((id: string) => {
    if (panRefs.current[id]) {
      Animated.spring(panRefs.current[id], {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
      isOpenRefs.current[id] = false;
    }
  }, []);

  useEffect(() => {
    const fetchUsername = async () => {
      const fetchedUsername = await SecureStore.getItemAsync("username");
      setUsername(fetchedUsername);
    };
    void fetchUsername();
  }, []);

  useEffect(() => {
    markMessageNotificationAsRead()
      .then(() => notificationEmitter.emit('notificationsUpdated', { type: 'chat' }))
      .catch(() => undefined);
  }, []);

  const refreshConversations = useCallback(() => {
    if (!username) return;

    const db = getDatabase();
    const userConversationsRef = ref(db, `users/${username}/conversations`);

    get(userConversationsRef).then((snapshot) => {
      const userConversationsData = snapshot.val();
      if (userConversationsData) {
        const conversationsArray: Conversation[] = [];
        Object.keys(userConversationsData).forEach((convId) => {
          const convRef = ref(db, `conversations/${convId}`);
          get(convRef).then((convSnapshot) => {
            const convData = convSnapshot.val();
            if (convData && convData.participantsArray) {
              const otherParticipant = convData.participantsArray.find((p: string) => p !== username) || '';
              const lastMessage = convData.lastMessage || { text: '', timestamp: 0, senderId: '', isRead: true };

              let unreadCount = 0;
              if (convData.messages) {
                unreadCount = Object.values(convData.messages).filter((msg: any) =>
                  msg.senderUsername !== username && msg.read === false
                ).length;
              }

              const conversation: Conversation = {
                id: convId,
                participants: convData.participants,
                participantsArray: convData.participantsArray,
                lastMessage,
                unreadCount,
                otherParticipant
              };
              const index = conversationsArray.findIndex(conv => conv.id === convId);
              if (index !== -1) {
                conversationsArray[index] = conversation;
              } else {
                conversationsArray.push(conversation);
              }
              setConversations([...conversationsArray]);
            }
          });
        });
      }
    });
  }, [username]);

  useFocusEffect(
    useCallback(() => {
      if (username) {
        refreshConversations();
      }
    }, [username, refreshConversations])
  );

  useEffect(() => {
    if (!username) return;

    const db = getDatabase();
    const userConversationsRef = ref(db, `users/${username}/conversations`);

    const handleConversations = (snapshot: any) => {
      const userConversationsData = snapshot.val();
      if (userConversationsData) {
        const conversationsArray: Conversation[] = [];
        Object.keys(userConversationsData).forEach((convId) => {
          const convRef = ref(db, `conversations/${convId}`);
          onValue(convRef, (convSnapshot) => {
            const convData = convSnapshot.val();
            if (convData && convData.participantsArray) {
              const otherParticipant = convData.participantsArray.find((p: string) => p !== username) || '';
              const lastMessage = convData.lastMessage || { text: '', timestamp: 0, senderId: '', isRead: true };

              let unreadCount = 0;
              if (convData.messages) {
                unreadCount = Object.values(convData.messages).filter((msg: any) =>
                  msg.senderUsername !== username && msg.read === false
                ).length;
              }

              const conversation: Conversation = {
                id: convId,
                participants: convData.participants,
                participantsArray: convData.participantsArray,
                lastMessage,
                unreadCount,
                otherParticipant
              };
              const index = conversationsArray.findIndex(conv => conv.id === convId);
              if (index !== -1) {
                conversationsArray[index] = conversation;
              } else {
                conversationsArray.push(conversation);
              }
              setConversations([...conversationsArray]);
            }
          });
        });
      }
    };

    onValue(userConversationsRef, handleConversations);

    return () => {
      off(userConversationsRef);
    };
  }, [username]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  }, [conversations]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!username) return;

    haptics.warning();
    const db = getDatabase();
    const userConversationRef = ref(db, `users/${username}/conversations/${conversationId}`);

    try {
      await remove(userConversationRef);
      setConversations(prevConversations =>
        prevConversations.filter(conv => conv.id !== conversationId)
      );
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }, [username]);

  const renderConversationItem = useCallback(({ item, index }: { item: Conversation; index: number }) => {
    const otherParticipant = friends.find(friend => friend.username === item.otherParticipant);
    const avatarUri = otherParticipant?.profileImageUrl ?? null;
    const displayName = item.otherParticipant || otherParticipant?.username || 'Unknown';
    const isUnread = item.unreadCount > 0;
    const rowStyle = StyleSheet.flatten([
      styles.conversationItem,
      { backgroundColor: c.surface },
      cardShadow(isDarkMode),
      isUnread && { borderColor: c.accent, borderWidth: 1.5, backgroundColor: c.accentSoft },
    ]);

    if (!panRefs.current[item.id]) {
      panRefs.current[item.id] = new Animated.ValueXY();
      isOpenRefs.current[item.id] = false;
    }

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dx < 0,
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(-88, gestureState.dx);
        panRefs.current[item.id]?.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(panRefs.current[item.id] ?? new Animated.ValueXY(), {
            toValue: { x: -88, y: 0 },
            useNativeDriver: false,
          }).start();
          isOpenRefs.current[item.id] = true;
        } else if (panRefs.current[item.id]) {
          closeSwipe(item.id);
        }
      },
    });

    return (
      <AnimatedEntrance index={index}>
        <Animated.View
          style={[
            styles.conversationItemContainer,
            { transform: [{ translateX: panRefs.current[item.id]?.x ?? 0 }] },
          ]}
          {...panResponder.panHandlers}
        >
          <PressableScale
            haptic="warning"
            onPress={() => deleteConversation(item.id)}
            style={[styles.deleteButton, { backgroundColor: c.danger }]}
          >
            <Ionicons name="trash-bin" size={22} color="#fff" />
          </PressableScale>

          <PressableScale
            haptic="select"
            onPress={() => {
              if (isOpenRefs.current[item.id]) {
                closeSwipe(item.id);
                return;
              }
              router.push({ pathname: '/chat/[id]', params: { id: item.id } });
            }}
            style={rowStyle}
            accessibilityLabel={`Conversation with ${displayName}`}
          >
            <Image
              source={avatarUri ? { uri: avatarUri } : DEFAULT_IMAGE}
              style={[styles.avatar, { borderColor: c.border }]}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
            <View style={styles.textContainer}>
              <View style={styles.nameAndTimeContainer}>
                <Text
                  style={[
                    styles.name,
                    { color: isUnread ? c.text : c.text },
                    isUnread && { fontWeight: '800' },
                  ]}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Text style={[styles.timestamp, { color: c.textFaint }]}>
                  {formatTimestamp(item.lastMessage.timestamp)}
                </Text>
              </View>
              <Text
                style={[
                  styles.lastMessage,
                  { color: isUnread ? c.text : c.textMuted },
                  isUnread && { fontWeight: '700' },
                ]}
                numberOfLines={1}
              >
                {item.lastMessage.text || 'No messages yet'}
              </Text>
            </View>
            {isUnread && (
              <View style={[styles.unreadIndicator, { backgroundColor: c.accent }]}>
                <Text style={styles.unreadCount}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </PressableScale>
        </Animated.View>
      </AnimatedEntrance>
    );
  }, [friends, isDarkMode, c, deleteConversation, closeSwipe, router]);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

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
          <Text style={styles.headerEyebrow}>Inbox</Text>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <PressableScale
          haptic="tap"
          onPress={() => router.push('/friendslist')}
          style={styles.composeBtn}
          accessibilityLabel="Create new message"
        >
          <Ionicons name="create-outline" size={22} color="#fff" />
        </PressableScale>
      </LinearGradient>

      <FlatList
        data={sortedConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refreshConversations}
        refreshing={false}
        ListEmptyComponent={
          <AnimatedEntrance style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
              <Ionicons name="chatbubbles-outline" size={36} color={c.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No messages yet</Text>
            <Text style={[styles.emptySub, { color: c.textMuted }]}>
              Start a conversation from your friends list.
            </Text>
            <PressableScale
              haptic="tap"
              onPress={() => router.push('/friendslist')}
              style={styles.emptyCta}
            >
              <LinearGradient colors={Gradients.brand} style={styles.emptyCtaFill}>
                <Ionicons name="create-outline" size={18} color="#fff" />
                <Text style={styles.emptyCtaText}>New message</Text>
              </LinearGradient>
            </PressableScale>
          </AnimatedEntrance>
        }
        ListFooterComponent={
          username === null ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color={c.accent} />
            </View>
          ) : null
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
  composeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
    flexGrow: 1,
  },
  conversationItemContainer: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: -88,
    bottom: 0,
    width: 80,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameAndTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  name: {
    ...Type.headline,
    flex: 1,
  },
  timestamp: {
    ...Type.micro,
    fontWeight: '600',
  },
  lastMessage: {
    ...Type.body,
  },
  unreadIndicator: {
    borderRadius: Radius.pill,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    ...Type.micro,
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
  emptyTitle: {
    ...Type.title,
    fontSize: 18,
  },
  emptySub: {
    ...Type.body,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  emptyCta: {
    marginTop: Spacing.xl,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  emptyCtaFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.pill,
  },
  emptyCtaText: {
    color: '#fff',
    ...Type.button,
    fontSize: 16,
  },
  loadingWrap: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
});

export default ConversationList;
