import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, push, set, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from "expo-secure-store";
import { generateUID } from '../../util/uidGenerator';

type Message = {
  id: string;
  senderUsername: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsernameAndGenerateUID = async () => {
      const fetchedToken = await SecureStore.getItemAsync("token");
      const fetchedUsername = await SecureStore.getItemAsync("username");
      if (fetchedToken) {
        const generatedUID = await generateUID(fetchedToken);
        setUid(generatedUID);
      }
      if (fetchedUsername) {
        setUsername(fetchedUsername);
      }
    };
    fetchUsernameAndGenerateUID();
  }, []);

  useEffect(() => {
    if (!id) return;

    const db = getDatabase();
    const messagesRef = ref(db, `conversations/${id}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const messageList = Object.entries(data).map(([messageId, msg]: [string, any]) => ({
          id: messageId,
          ...msg,
        }));
        setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return () => unsubscribe();
  }, [id]);

  const handleSendMessage = async () => {
    if (!username || (!message.trim() && !image)) return;

    const db = getDatabase();
    const storage = getStorage();

    // Check if users exist and create if not
    await ensureUsersExist(db, username, id as string);

    let imageUrl = null;
    if (image) {
      const imageRef = storageRef(storage, `images/${id}/${Date.now()}.jpg`);
      const response = await fetch(image);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      imageUrl = await getDownloadURL(imageRef);
    }

    const messageData = {
      text: message,
      timestamp: Date.now(),
      senderUsername: username,
      imageUrl,
    };

    // Add message to the conversation's messages
    await push(ref(db, `conversations/${id}/messages`), messageData);

    // Update last message in conversation
    await set(ref(db, `conversations/${id}/lastMessage`), messageData);

    setMessage('');
    setImage(null);
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets?.[0]?.uri ?? null);
    }
  };

  const renderMessageItem = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderUsername === username;
    return (
      <View style={[styles.messageItem, isOwnMessage ? styles.sentMessage : styles.receivedMessage]}>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
        )}
        <Text style={styles.senderUsername}>{item.senderUsername}</Text>
        <Text style={styles.messageText}>{item.text}</Text>
      </View>
    );
  }, [username]);

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messageList}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={handleAttachImage} style={styles.attachButton}>
          <Ionicons name="attach" size={24} color="#4a5568" />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          placeholderTextColor="#4a5568"
        />
        <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="#4a5568" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const ensureUsersExist = async (db: any, currentUsername: string, conversationId: string) => {
  const usersRef = ref(db, 'users');
  
  // Check current user
  const currentUserRef = ref(db, `users/${currentUsername}`);
  const currentUserSnapshot = await get(currentUserRef);
  
  if (!currentUserSnapshot.exists()) {
    await set(currentUserRef, { conversations: { [conversationId]: true } });
  } else {
    const userData = currentUserSnapshot.val();
    if (!userData.conversations || !userData.conversations[conversationId]) {
      await set(ref(db, `users/${currentUsername}/conversations/${conversationId}`), true);
    }
  }

  // Get the conversation data to find the friend's username
  const conversationRef = ref(db, `conversations/${conversationId}`);
  const conversationSnapshot = await get(conversationRef);
  
  if (!conversationSnapshot.exists()) {
    console.error('Conversation not found');
    return;
  }

  const conversationData = conversationSnapshot.val();
  const participants = conversationData.participants || [];
  const friendUsername = participants.find((participant: string) => participant !== currentUsername);

  if (!friendUsername) {
    console.error('Friend username not found in conversation participants');
    return;
  }

  // Check friend
  const friendUserRef = ref(db, `users/${friendUsername}`);
  const friendUserSnapshot = await get(friendUserRef);

  if (!friendUserSnapshot.exists()) {
    await set(friendUserRef, { conversations: { [conversationId]: true } });
  } else {
    const friendData = friendUserSnapshot.val();
    if (!friendData.conversations || !friendData.conversations[conversationId]) {
      await set(ref(db, `users/${friendUsername}/conversations/${conversationId}`), true);
    }
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  messageList: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
  },
  attachButton: {
    padding: 10,
  },
  sendButton: {
    padding: 10,
  },
  messageItem: {
    padding: 10,
    marginVertical: 5,
    maxWidth: '80%',
    borderRadius: 10,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  senderUsername: {
    fontSize: 16,
    marginBottom: 5,
  },
});