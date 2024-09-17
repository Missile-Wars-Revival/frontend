import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, SafeAreaView, Modal, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDatabase, ref, onValue, push, set, get, update, serverTimestamp, increment } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as SecureStore from "expo-secure-store";
import { generateUID } from '../../util/uidGenerator';
import FastImage from 'react-native-fast-image';
import * as FileSystem from 'expo-file-system';

type Message = {
  id: string;
  senderUsername: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  delivered: boolean;
  read: boolean;
  readTimestamp?: number;
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [friendUsername, setFriendUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const flatListRef = useRef<FlatList>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [otherParticipant, setOtherParticipant] = useState('');
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (!id || !username) return;

    const db = getDatabase();
    const conversationRef = ref(db, `conversations/${id}`);

    const unsubscribe = onValue(conversationRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        //console.log('Conversation data:', data);

        // Handle participants
        let participantsArray: string[] = data.participantsArray || [];
        if (typeof data.participants === 'string') {
          participantsArray = data.participants.split(',');
        } else if (Array.isArray(data.participants)) {
          participantsArray = data.participants;
        } else if (Array.isArray(data.participantsArray)) {
          participantsArray = data.participantsArray;
        }

        const other = participantsArray.find((p: string) => p !== username);
        setOtherParticipant(other || '');

        // Handle messages
        if (data.messages) {
          const messageList = Object.entries(data.messages).map(([key, value]: [string, any]) => ({
            id: key,
            ...value,
          }));
          setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
          
          // Calculate unread count
          const unreadMessages = messageList.filter(msg => 
            msg.senderUsername !== username && !msg.read
          );
          setUnreadCount(unreadMessages.length);
          
          // Mark messages as read
          if (other) {
            markMessagesAsRead(messageList, other);
          }

          // Scroll to bottom after setting messages
          setTimeout(() => scrollToBottom(), 100);
        }
      } else {
        console.error('No data found for conversation');
        Alert.alert('Error', 'Could not load conversation data');
      }
    });

    return () => unsubscribe();
  }, [id, username]);

  // Add this new function to scroll to bottom
  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const handleSendMessage = async () => {
    if (!username || (!message.trim() && !selectedImage)) return;

    const db = getDatabase();
    let imageUrl = '';

    if (selectedImage) {
      imageUrl = await uploadImage(selectedImage);
      setSelectedImage(null);
    }

    const messageText = message.trim();
    const timestamp = serverTimestamp();

    const messageData = {
      text: messageText,
      imageUrl,
      timestamp,
      senderUsername: username,
      delivered: false,
      read: false,
    };

    const newMessageRef = push(ref(db, `conversations/${id}/messages`));
    await set(newMessageRef, messageData);

    // Update the lastMessage in the conversation
    const lastMessageData = {
      text: imageUrl ? 'Sent an image' : messageText,
      timestamp,
      senderId: username,
      isRead: false,
    };

    await update(ref(db, `conversations/${id}`), {
      lastMessage: lastMessageData,
    });

    setMessage('');
  };

  const handleAttachImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    if (!username) return '';

    const response = await fetch(uri);
    const blob = await response.blob();

    const storage = getStorage();
    const imageRef = storageRef(storage, `chat_images/${Date.now()}.jpg`);

    try {
      const uploadTask = uploadBytesResumable(imageRef, blob);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed', 
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setImageUploadProgress(progress);
          },
          (error: any) => {
            console.error("Upload failed:", error);
            Alert.alert("Error", "Failed to upload image");
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(imageRef);
            setImageUploadProgress(0);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image");
      return '';
    }
  };

  const sendImageMessage = async (imageUrl: string) => {
    if (!username) return;

    const db = getDatabase();
    const messageData = {
      text: '',
      imageUrl,
      timestamp: serverTimestamp(),
      senderUsername: username,
      delivered: false,
      read: false,
    };

    await push(ref(db, `conversations/${id}/messages`), messageData);
  };

  const handleImagePress = (imageUrl: string) => {
    setFullScreenImage(imageUrl);
  };

  const handleSaveImage = async () => {
    if (fullScreenImage) {
      try {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission required', 'Sorry, we need permission to save images.');
          return;
        }

        // First, download the image to local file system
        const fileUri = FileSystem.documentDirectory + "temp_image.jpg";
        await FileSystem.downloadAsync(fullScreenImage, fileUri);

        // Then, save the local file to media library
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        
        if (asset) {
          await MediaLibrary.createAlbumAsync('ChatApp', asset, false);
          Alert.alert('Success', 'Image saved to gallery!');
        } else {
          throw new Error('Asset creation failed');
        }

        // Clean up the temporary file
        await FileSystem.deleteAsync(fileUri);

      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error', `Failed to save the image:`);
      }
    }
  };

  const markMessageAsDelivered = async (messageId: string) => {
    const db = getDatabase();
    await set(ref(db, `conversations/${id}/messages/${messageId}/delivered`), true);
  };

  const markMessagesAsRead = async (messageList: Message[], otherParticipant: string) => {
    if (!username || !otherParticipant) return;
    const db = getDatabase();
    const unreadMessages = messageList.filter(msg => 
      msg.senderUsername === otherParticipant && !msg.read
    );
    
    if (unreadMessages.length === 0) return;

    const updates: { [key: string]: any } = {};
    unreadMessages.forEach(msg => {
      updates[`conversations/${id}/messages/${msg.id}/read`] = true;
      updates[`conversations/${id}/messages/${msg.id}/readTimestamp`] = serverTimestamp();
    });

    // Add this line to mark the mostRecentMessage as read
    updates[`conversations/${id}/lastMessage/isRead`] = true;

    await update(ref(db), updates);
    setUnreadCount(0); // Reset unread count after marking messages as read
  };

  const renderMessageItem = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderUsername === username;
    return (
      <View style={[
        styles.messageItem,
        isOwnMessage ? styles.sentMessage : styles.receivedMessage,
        isDarkMode && (isOwnMessage ? styles.sentMessageDark : styles.receivedMessageDark)
      ]}>
        {item.imageUrl && (
          <TouchableOpacity onPress={() => handleImagePress(item.imageUrl!)}>
            <FastImage source={{ uri: item.imageUrl }} style={styles.messageImage} />
          </TouchableOpacity>
        )}
        <Text style={[styles.senderUsername, isDarkMode && styles.senderUsernameDark]}>{item.senderUsername}</Text>
        {item.text && <Text style={[styles.messageText, isDarkMode && styles.messageTextDark]}>{item.text}</Text>}
        {isOwnMessage && (
          <View style={styles.messageStatus}>
            {item.delivered && <Ionicons name="checkmark" size={16} color={isDarkMode ? "#B0B0B0" : "#4a5568"} />}
            {item.read && <Ionicons name="checkmark-done" size={16} color={isDarkMode ? "#B0B0B0" : "#4a5568"} />}
          </View>
        )}
      </View>
    );
  }, [username, isDarkMode]);

  const renderHeader = () => (
    <View style={[styles.header, isDarkMode && styles.headerDark]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, isDarkMode && styles.headerTitleDark]}>
        {otherParticipant || 'Chat'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      {renderHeader()}
      {/* You can display the unread count somewhere in your UI if needed */}
      {unreadCount > 0 && (
        <Text style={styles.unreadCount}>{unreadCount} unread messages</Text>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          )}
          <TouchableOpacity onPress={handleAttachImage} style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={isDarkMode ? "#B0B0B0" : "#4a5568"} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={isDarkMode ? "#B0B0B0" : "#4a5568"}
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color={isDarkMode ? "#B0B0B0" : "#4a5568"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.fullScreenImageContainer}>
          <FastImage source={{ uri: fullScreenImage ?? undefined }} style={styles.fullScreenImage} />
          <TouchableOpacity style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveImage}>
            <Ionicons name="download" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </Modal>
      {imageUploadProgress > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${imageUploadProgress}%` }]} />
        </View>
      )}
    </SafeAreaView>
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
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  inputContainerDark: {
    backgroundColor: '#2C2C2C',
    borderTopColor: '#3D3D3D',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    color: '#000000',
  },
  inputDark: {
    backgroundColor: '#3D3D3D',
    color: '#FFFFFF',
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
  sentMessageDark: {
    backgroundColor: '#0B93F6',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
  },
  receivedMessageDark: {
    backgroundColor: '#262D31',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    flexWrap: 'wrap',
  },
  messageTextDark: {
    color: '#FFFFFF',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
  },
  senderUsername: {
    fontSize: 14,
    marginBottom: 5,
    color: '#4a5568',
  },
  senderUsernameDark: {
    color: '#B0B0B0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#FFFFFF',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
    borderBottomColor: '#3D3D3D',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    color: '#000000',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  imagePreviewContainer: {
    position: 'absolute',
    bottom: 70,
    left: 10,
    right: 10,
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '80%',
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
  },
  saveButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
  },
  messageStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  progressBarContainer: {
    height: 5,
    backgroundColor: '#e0e0e0',
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  selectedImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 5,
  },
  unreadCount: {
    textAlign: 'center',
    padding: 5,
    backgroundColor: '#e0e0e0',
    color: '#333',
  },
});