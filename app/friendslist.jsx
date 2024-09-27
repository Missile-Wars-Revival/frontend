import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, SafeAreaView, useColorScheme, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import useFetchFriends from '../hooks/websockets/friendshook';
import { getDatabase, ref, push, set, update, serverTimestamp, query, orderByChild, equalTo, get } from 'firebase/database';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

const FriendItem = React.memo(({ item, onPress, isDarkMode }) => {
  return (
    <TouchableOpacity 
      style={[styles.friendItem, isDarkMode && styles.friendItemDark]}
      onPress={() => onPress(item.username)}
      accessibilityLabel={`Start chat with ${item.username}`}
    >
      <View style={styles.friendInfo}>
        <Image 
          source={item.profileImageUrl ? { uri: item.profileImageUrl } : DEFAULT_IMAGE} 
          style={styles.friendImage} 
        />
        <Text style={[styles.friendName, isDarkMode && styles.friendNameDark]}>{item.username}</Text>
      </View>
    </TouchableOpacity>
  );
});

const FriendsList = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const friends = useFetchFriends();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      const storedUsername = await SecureStore.getItemAsync('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        Alert.alert("Not Signed In", "Please sign in to view your friends list.");
        router.replace('/login'); // Adjust this path to your login route
      }
    };

    checkAuthentication();
  }, [router]);

  const createNewConversation = useCallback(async (friendUsername) => {
    if (!username) {
      Alert.alert("Not Signed In", "Please sign in to start a conversation.");
      return;
    }

    try {
      const db = getDatabase();
      const participants = [username, friendUsername].sort();
      const participantsString = participants.join(',');

      // Check if a conversation already exists
      const conversationsRef = ref(db, 'conversations');
      const conversationsQuery = query(conversationsRef, orderByChild('participants'), equalTo(participantsString));
      
      const snapshot = await get(conversationsQuery);

      let conversationId;

      if (snapshot.exists()) {
        // Conversation already exists, use the existing one
        conversationId = Object.keys(snapshot.val())[0];
        console.log('Using existing conversation with ID:', conversationId);
      } else {
        // Create a new conversation
        const newConversationRef = push(conversationsRef);
        conversationId = newConversationRef.key;

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
        console.log('New conversation created with ID:', conversationId);
      }

      // Check if the conversation is already in the user's list
      const userConversationsRef = ref(db, `users/${username}/conversations`);
      const userConversationsSnapshot = await get(userConversationsRef);
      const userConversations = userConversationsSnapshot.val() || {};

      const updates = {};

      // Only add to user's list if it's not already there
      if (!userConversations[conversationId]) {
        updates[`users/${username}/conversations/${conversationId}`] = true;
      }

      // Do the same for the friend
      const friendConversationsRef = ref(db, `users/${friendUsername}/conversations`);
      const friendConversationsSnapshot = await get(friendConversationsRef);
      const friendConversations = friendConversationsSnapshot.val() || {};

      if (!friendConversations[conversationId]) {
        updates[`users/${friendUsername}/conversations/${conversationId}`] = true;
      }

      // Only perform the update if there are changes to be made
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }

      // Navigate to the chat screen
      router.push({ pathname: '/chat/[id]', params: { id: conversationId } });
    } catch (error) {
      console.error('Detailed error:', JSON.stringify(error, null, 2));
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      Alert.alert("Error", `Failed to create or find a conversation. Error: ${error.message}`);
    }
  }, [username, router]);

  const renderFriendItem = useCallback(({ item }) => (
    <FriendItem 
      item={item} 
      onPress={createNewConversation} 
      isDarkMode={isDarkMode} 
    />
  ), [createNewConversation, isDarkMode]);

  const memoizedFriends = useMemo(() => friends, [friends]);

  if (!username) {
    return (
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <Text style={[styles.centerText, isDarkMode && styles.centerTextDark]}>
          Please sign in to view your friends list.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Select a Friend</Text>
      </View>
      <FlatList
        data={memoizedFriends}
        renderItem={renderFriendItem}
        keyExtractor={(item) => item.username}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#4a5568',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: -40,
  },
  headerTextDark: {
    color: '#FFF',
  },
  list: {
    flex: 1,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  friendItemDark: {
    backgroundColor: '#2C2C2C',
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  friendImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  friendName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  friendNameDark: {
    color: '#FFF',
  },
  centerText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  centerTextDark: {
    color: '#B0B0B0',
  },
});

export default FriendsList;
