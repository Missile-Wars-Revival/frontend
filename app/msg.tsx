import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, useColorScheme } from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, get } from 'firebase/database';
import * as SecureStore from "expo-secure-store";
import useFetchFriends from '../hooks/websockets/friendshook';
import { fetchAndCacheImage } from '../util/imagecache';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

// Updated Conversation type
type Conversation = {
    id: string;
    participants: string[];
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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [username, setUsername] = useState<string | null>(null);
  const friends = useFetchFriends(); // WS

  useEffect(() => {
    const fetchUsername = async () => {
      const fetchedUsername = await SecureStore.getItemAsync("username");
      setUsername(fetchedUsername);
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    if (!username) return;

    const db = getDatabase();
    const userConversationsRef = ref(db, `users/${username}/conversations`);

    const unsubscribe = onValue(userConversationsRef, async (snapshot) => {
      const userConversationsData = snapshot.val();
      if (userConversationsData) {
        const conversationPromises = Object.keys(userConversationsData).map(async (convId) => {
          const convRef = ref(db, `conversations/${convId}`);
          const convSnapshot = await get(convRef);
          const convData = convSnapshot.val();

          if (convData) {
            const otherParticipant = convData.participants.find((p: string) => p !== username) || '';
            return {
              id: convId,
              participants: convData.participants,
              lastMessage: convData.lastMessage || { text: '', timestamp: 0, senderId: '', isRead: true },
              unreadCount: convData.unreadCount || 0,
              otherParticipant
            };
          }
          return null;
        });

        const resolvedConversations = (await Promise.all(conversationPromises))
          .filter((conv): conv is Conversation => conv !== null);
        setConversations(resolvedConversations);
      }
    });

    return () => unsubscribe();
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

  const renderConversationItem = useCallback(({ item }: { item: Conversation }) => {
    const otherParticipant = friends.find(friend => friend.username === item.otherParticipant);
    const avatarUri = avatarUris[item.otherParticipant];

    return (
      <Link href={{ pathname: '/chat/[id]', params: { id: item.id } }} asChild>
        <TouchableOpacity 
          style={[styles.conversationItem, isDarkMode && styles.conversationItemDark]}
          accessibilityLabel={`Conversation with ${otherParticipant?.username || 'Unknown'}`}
        >
          <View style={styles.avatarContainer}>
            <Image 
              source={avatarUri ? { uri: avatarUri } : DEFAULT_IMAGE} 
              style={styles.avatar} 
            />
            <View style={styles.textContainer}>
              <View style={styles.nameAndTimeContainer}>
                <Text style={[styles.name, isDarkMode && styles.textDark]} numberOfLines={1}>
                  {otherParticipant?.username || 'Unknown'}
                </Text>
                <Text style={[styles.timestamp, isDarkMode && styles.timestampDark]}>
                  {formatTimestamp(item.lastMessage.timestamp)}
                </Text>
              </View>
              <Text style={[
                styles.lastMessage, 
                isDarkMode && (item.lastMessage.isRead ? styles.lastMessageReadDark : styles.lastMessageUnreadDark)
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
    );
  }, [username, friends, isDarkMode, avatarUris]);

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
          <Ionicons name="create-outline" size={24} color={isDarkMode ? "#FFFFFF" : "#4a5568"} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sortedConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
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
    color: '#8E8E93', // Gray for light mode (both read and unread)
  },
  lastMessageReadDark: {
    color: '#8E8E93', // Gray for read messages in dark mode
  },
  lastMessageUnreadDark: {
    color: '#FFFFFF', // White for unread messages in dark mode
    fontWeight: '600', // Optional: make unread messages bold
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  timestampDark: {
    color: '#8E8E93',
  },
  textDark: {
    color: '#FFFFFF',
  },
  unreadIndicator: {
    backgroundColor: '#34B7F1',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ConversationList;
