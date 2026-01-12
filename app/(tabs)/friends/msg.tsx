import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, useColorScheme, PanResponder, Animated, TouchableWithoutFeedback } from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, get, remove, push, set, off } from 'firebase/database';
import * as SecureStore from "expo-secure-store";
import useFetchFriends from '../../../hooks/websockets/friendshook';
import { fetchAndCacheImage } from '../../../util/imagecache';
import { useNotifications } from '../../../components/Notifications/useNotifications';
import { markMessageNotificationAsRead } from '../../../api/notifications';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_IMAGE = require('../../../assets/mapassets/Female_Avatar_PNG.png');

// Updated Conversation type
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
  const { notifications, isLoading, markAsRead, markMessagesAsRead } = useNotifications();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const friends = useFetchFriends(); // WS

  const panRefs = useRef<{ [key: string]: Animated.ValueXY }>({});
  const isOpenRefs = useRef<{ [key: string]: boolean }>({});

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
    fetchUsername();
  }, []);

  useEffect(() => {
    markMessageNotificationAsRead();
  }, []);

  // Add this new effect to refresh conversations when the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (username) {
        refreshConversations();
      }
    }, [username])
  );

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
              
              // Calculate the actual unread count
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
              const index = conversationsArray.findIndex(c => c.id === convId);
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
              const lastMessage = convData.lastMessage || { text: '', timestamp: 0, senderId: '', read: true };
              
              // Calculate the actual unread count
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
              const index = conversationsArray.findIndex(c => c.id === convId);
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

  // Memoize the sorted conversations
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => b.lastMessage.timestamp - a.lastMessage.timestamp);
  }, [conversations]);

  // Move these hooks outside of renderConversationItem
  const [avatarUris, setAvatarUris] = useState<Record<string, string | null>>({});

  useEffect(() => {
    friends.forEach(friend => {
      fetchAndCacheImage(friend.username).then(uri => {
        setAvatarUris(prev => ({ ...prev, [friend.username]: uri }));
      });
    });
  }, [friends]);

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!username) return;

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

  const renderConversationItem = useCallback(({ item }: { item: Conversation }) => {
    const otherParticipant = friends.find(friend => friend.username === item.otherParticipant);
    const avatarUri = avatarUris[item.otherParticipant];

    if (!panRefs.current[item.id]) {
      panRefs.current[item.id] = new Animated.ValueXY();
      isOpenRefs.current[item.id] = false;
    }

    const panResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dx < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(-100, gestureState.dx);
        panRefs.current[item.id]?.setValue({ x: newX, y: 0 });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(panRefs.current[item.id] ?? new Animated.ValueXY(), {
            toValue: { x: -100, y: 0 },
            useNativeDriver: false,
          }).start();
        } else if (panRefs.current[item.id]) {
          closeSwipe(item.id);
        }
      },
    });

    return (
      <Animated.View
        style={[
          styles.conversationItemContainer,
          { transform: [{ translateX: panRefs.current[item.id]?.x ?? 0 }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.deleteButton, { right: -70 }]}
          onPress={() => deleteConversation(item.id)}
        >
          <Ionicons name="trash-bin" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableWithoutFeedback onPress={() => isOpenRefs.current[item.id] ? closeSwipe(item.id) : undefined}>
          <View>
            <Link href={{ pathname: '/chat/[id]', params: { id: item.id } }} asChild>
              <TouchableOpacity 
                style={[
                  styles.conversationItem, 
                  isDarkMode && styles.conversationItemDark,
                  item.unreadCount > 0 && (isDarkMode ? styles.unreadConversationItemDark : styles.unreadConversationItem)
                ]}
                accessibilityLabel={`Conversation with ${otherParticipant?.username || 'Unknown'}`}
              >
                <View style={styles.avatarContainer}>
                  <Image 
                    source={avatarUri ? { uri: avatarUri } : DEFAULT_IMAGE} 
                    style={styles.avatar} 
                  />
                  <View style={styles.textContainer}>
                    <View style={styles.nameAndTimeContainer}>
                      <Text style={[
                        styles.name, 
                        isDarkMode && styles.textDark,
                        item.unreadCount > 0 && (isDarkMode ? styles.unreadTextDark : styles.unreadText)
                      ]} numberOfLines={1}>
                        {otherParticipant?.username || 'Unknown'}
                      </Text>
                      <Text style={[styles.timestamp, isDarkMode && styles.timestampDark]}>
                        {formatTimestamp(item.lastMessage.timestamp)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.lastMessage, 
                      isDarkMode && (item.lastMessage.senderId === username || item.lastMessage.isRead ? styles.lastMessageReadDark : styles.lastMessageUnreadDark),
                      item.unreadCount > 0 && (isDarkMode ? styles.unreadTextDark : styles.unreadText)
                    ]} numberOfLines={1}>
                      {item.lastMessage.text}
                    </Text>
                  </View>
                </View>
                {item.unreadCount > 0 && (
                  <View style={styles.unreadIndicator}>
                    <Text style={styles.unreadCount}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </Link>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    );
  }, [friends, isDarkMode, avatarUris, deleteConversation, closeSwipe, username]);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Messages</Text>
        <TouchableOpacity 
          style={styles.newMessageButton}
          onPress={() => router.push('/friendslist')}
          accessibilityLabel="Create new message"
        >
          <Ionicons name="create-outline" size={24} color={isDarkMode ? "#FFFFFF" : "#FFFFFF"} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshing={false}
        onRefresh={refreshConversations}
      />
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    marginTop: -20,
    marginBottom: 20,
    backgroundColor: '#4a5568',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerTextDark: {
    color: '#FFFFFF',
  },
  newMessageButton: {
    padding: 10,
  },
  list: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'column',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
  },
  conversationItemDark: {
    backgroundColor: '#2C2C2C',
    borderBottomColor: '#3D3D3D',
  },
  avatarContainer: {
    flexDirection: 'row',
    marginLeft: 10,
    alignItems: 'center',
    flex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameAndTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -20,
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 20,
  },
  lastMessage: {
    fontSize: 14,
    color: '#8E8E93',
  },
  lastMessageUnread: {
    fontWeight: 'bold',
    color: '#000000',
  },
  lastMessageReadDark: {
    color: '#8E8E93',
  },
  lastMessageUnreadDark: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    marginRight: 10,
    color: '#8E8E93',
  },
  timestampDark: {
    color: '#8E8E93',
  },
  textDark: {
    color: '#FFFFFF',
  },
  conversationItemContainer: {
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'red',
  },
  unreadConversationItem: {
    backgroundColor: '#E8F5FE',
  },
  unreadConversationItemDark: {
    backgroundColor: '#1E3A5F',
  },
  unreadText: {
    fontWeight: 'bold',
    color: '#000000',
  },
  unreadTextDark: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadIndicator: {
    backgroundColor: '#34B7F1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    top: 10,
    right: 10,
    marginRight: 50,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConversationList;
