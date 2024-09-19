import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, SafeAreaView, Modal, Alert, Animated, Linking } from 'react-native';
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
import useFetchInventory from '../../hooks/websockets/inventoryhook';
import { itemimages } from '../profile';
import { receiveItem, removeItem } from '../../api/add-item';

type Message = {
  id: string;
  senderUsername: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  delivered: boolean;
  read: boolean;
  readTimestamp?: number;
  inventoryItem?: InventoryMessageItem;
};

type InventoryItem = { name: string; quantity: number; id: string };

type InventoryMessageItem = {
  id: string;
  name: string;
  quantity: number;
  messageId: string;
  senderUsername: string;
};

type LinkPreviewData = {
  url: string;
  type: 'instagram' | 'snapchat' | 'x' | 'other';
};

// Add this function to parse URLs
const parseUrls = (text: string): LinkPreviewData[] => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);

  if (!matches) return [];

  return matches.map(url => {
    if (url.includes('instagram.com')) return { url, type: 'instagram' };
    if (url.includes('snapchat.com')) return { url, type: 'snapchat' };
    if (url.includes('x.com') || url.includes('twitter.com')) return { url, type: 'x' };
    return { url, type: 'other' };
  });
};

// Add this function to strip URLs from the text
const stripUrls = (text: string): string => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '').trim();
};

// Add this component for link previews
const LinkPreview = ({ data }: { data: LinkPreviewData }) => {
  const handlePress = () => {
    Linking.openURL(data.url);
  };

  const getIconName = () => {
    switch (data.type) {
      case 'instagram': return 'logo-instagram';
      case 'snapchat': return 'logo-snapchat';
      case 'x': return 'logo-twitter';
      default: return 'link';
    }
  };

  const getColor = () => {
    switch (data.type) {
      case 'instagram': return '#E1306C';
      case 'snapchat': return '#FFFC00';
      case 'x': return '#1DA1F2';
      default: return '#007AFF';
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.linkPreview, { backgroundColor: `${getColor()}20` }]}>
      <Ionicons name={getIconName()} size={50} color={getColor()} />
      <Text style={[styles.linkPreviewText, { color: getColor() }]} numberOfLines={1} ellipsizeMode="tail">
        {data.url}
      </Text>
    </TouchableOpacity>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
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
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [showInventoryMenu, setShowInventoryMenu] = useState(false);
  const [isAttachMenuVisible, setIsAttachMenuVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const [isUploading, setIsUploading] = useState(false);

  const inventory = useFetchInventory();

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

  const handleAttachPress = () => {
    setIsAttachMenuVisible(true);
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideAttachMenu = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setIsAttachMenuVisible(false));
  };

  const renderAttachMenu = () => {
    const translateY = slideAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [300, 0],
    });

    return (
      <Animated.View style={[
        styles.attachMenuContainer,
        isDarkMode && styles.attachMenuContainerDark,
        { transform: [{ translateY }] }
      ]}>
        <View style={styles.attachMenuHeader}>
          <Text style={[styles.attachMenuTitle, isDarkMode && styles.attachMenuTitleDark]}>Attach</Text>
          <TouchableOpacity onPress={hideAttachMenu}>
            <Ionicons name="close" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>
        </View>
        <View style={styles.attachMenuOptions}>
          <TouchableOpacity style={styles.attachOption} onPress={() => {
            hideAttachMenu();
            setShowInventoryMenu(true);
          }}>
            <View style={styles.attachOptionIcon}>
              <Ionicons name="cube" size={30} color="#fff" />
            </View>
            <Text style={[styles.attachOptionText, isDarkMode && styles.attachOptionTextDark]}>Inventory Item</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachOption} onPress={() => {
            hideAttachMenu();
            pickImage();
          }}>
            <View style={[styles.attachOptionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="image" size={30} color="#fff" />
            </View>
            <Text style={[styles.attachOptionText, isDarkMode && styles.attachOptionTextDark]}>Image</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  const handleSelectInventoryItem = (item: InventoryItem) => {
    setSelectedInventoryItem(item);
    setItemQuantity(1); // Initialize with 1
    setShowInventoryMenu(false);
  };

  const handleQuantityChange = (text: string) => {
    const quantity = parseInt(text) || 1;
    if (selectedInventoryItem) {
      setItemQuantity(Math.min(quantity, selectedInventoryItem.quantity));
    }
  };

  const handleSendMessage = async () => {
    if (!username || (!message.trim() && !selectedImage && !selectedInventoryItem) || isUploading) return; // Check isUploading

    const db = getDatabase();
    let imageUrl = '';

    if (selectedImage) {
      setIsUploading(true); // Set isUploading to true
      imageUrl = await uploadImage(selectedImage);
      setSelectedImage(null);
      setIsUploading(false); // Set isUploading to false after upload
    }

    let messageText = message.trim();
    let inventoryItemData = null;

    if (selectedInventoryItem) {
      // Ensure the quantity doesn't exceed the user's inventory
      const actualQuantity = Math.min(itemQuantity, selectedInventoryItem.quantity);
      messageText = `Sent ${actualQuantity} ${selectedInventoryItem.name}`;
      inventoryItemData = {
        id: selectedInventoryItem.id,
        name: selectedInventoryItem.name,
        quantity: actualQuantity,
      };

      // Update the user's inventory
      const userInventoryRef = ref(db, `users/${username}/inventory/${selectedInventoryItem.id}`);
      await update(userInventoryRef, {
        quantity: increment(-actualQuantity)
      });
    }

    const timestamp = serverTimestamp();

    const messageData: any = {
      text: messageText,
      timestamp,
      senderUsername: username,
      delivered: false,
      read: false,
    };

    if (imageUrl) {
      messageData.imageUrl = imageUrl;
    }

    if (inventoryItemData) {
      messageData.inventoryItem = inventoryItemData;
      removeItem(inventoryItemData.name, inventoryItemData.quantity);
    }

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
    setSelectedInventoryItem(null);
    setItemQuantity(1);
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

  const handleCollectItem = async (item: InventoryMessageItem) => {
    if (!username || item.senderUsername === username) return; // Prevent sender from collecting their own item

    const db = getDatabase();

    receiveItem(item.name, item.quantity);

    // Remove the item from the message
    const messageRef = ref(db, `conversations/${id}/messages/${item.messageId}`);
    await update(messageRef, {
      inventoryItem: null
    });

    // Refresh the messages
    const messagesRef = ref(db, `conversations/${id}/messages`);
    const messagesSnapshot = await get(messagesRef);
    if (messagesSnapshot.exists()) {
      const messageList = Object.entries(messagesSnapshot.val()).map(([key, value]: [string, any]) => ({
        id: key,
        ...value,
      }));
      setMessages(messageList.sort((a, b) => a.timestamp - b.timestamp));
    }
  };

  const renderMessageItem = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderUsername === username;
    const linkPreviews = parseUrls(item.text);
    const strippedText = stripUrls(item.text);

    return (
      <View style={[
        styles.messageItem,
        isOwnMessage ? styles.sentMessage : styles.receivedMessage,
        isDarkMode && (isOwnMessage ? styles.sentMessageDark : styles.receivedMessageDark),
        linkPreviews.length > 0 && styles.messageWithEmbed,
      ]}>
        <Text style={[styles.senderUsername, isDarkMode && styles.senderUsernameDark]}>{item.senderUsername}</Text>
        {strippedText && (
          <Text style={[styles.messageText, isDarkMode && styles.messageTextDark]}>{strippedText}</Text>
        )}
        {linkPreviews.map((preview, index) => (
          <LinkPreview key={index} data={preview} />
        ))}
        {item.imageUrl && (
          <TouchableOpacity onPress={() => handleImagePress(item.imageUrl!)}>
            <FastImage source={{ uri: item.imageUrl }} style={styles.messageImage} />
          </TouchableOpacity>
        )}
        {item.inventoryItem && (
          <TouchableOpacity
            style={styles.inventoryMessageItem}
            onPress={() => !isOwnMessage && item.inventoryItem && handleCollectItem({
              id: item.inventoryItem.id,
              name: item.inventoryItem.name,
              quantity: item.inventoryItem.quantity,
              messageId: item.id,
              senderUsername: item.senderUsername
            })}
          >
            <Image source={itemimages[item.inventoryItem.name]} style={styles.inventoryMessageItemImage} />
            <View style={styles.inventoryMessageItemContent}>
              <Text style={styles.inventoryMessageItemText} numberOfLines={1} ellipsizeMode="tail">
                {item.inventoryItem.name}
              </Text>
              <Text style={styles.inventoryMessageItemQuantity}>
                x{item.inventoryItem.quantity}
              </Text>
            </View>
            {!isOwnMessage && (
              <Text style={styles.collectText}>Tap to collect</Text>
            )}
          </TouchableOpacity>
        )}
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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Adjusted from 90 to 60
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
        {showInventoryMenu && (
          <View style={[styles.inventoryMenuContainer, isDarkMode && styles.inventoryMenuContainerDark]}>
            <FlatList
              data={inventory}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleSelectInventoryItem(item)} style={[styles.inventoryItem, isDarkMode && styles.inventoryItemDark]}>
                  <Image source={itemimages[item.name]} style={styles.inventoryItemImage} />
                  <Text style={[styles.inventoryItemName, isDarkMode && styles.inventoryItemNameDark]}>{item.name}</Text>
                  <Text style={[styles.inventoryItemQuantity, isDarkMode && styles.inventoryItemQuantityDark]}>x{item.quantity}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        )}
        <View style={[styles.inputContainer, isDarkMode && styles.inputContainerDark]}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
          )}
          {selectedInventoryItem && (
            <View style={styles.selectedInventoryItem}>
              <Text>{selectedInventoryItem.name} x {itemQuantity}</Text>
              <TextInput
                style={styles.quantityInput}
                value={itemQuantity.toString()}
                onChangeText={handleQuantityChange}
                keyboardType="numeric"
              />
            </View>
          )}
          <TouchableOpacity onPress={handleAttachPress} style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={isDarkMode ? "#B0B0B0" : "#4a5568"} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, isDarkMode && styles.inputDark]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={isDarkMode ? "#B0B0B0" : "#4a5568"}
          />
          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton} disabled={isUploading}>
            <Ionicons name="send" size={24} color={isUploading ? "#B0B0B0" : (isDarkMode ? "#B0B0B0" : "#4a5568")} />
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
      {isAttachMenuVisible && renderAttachMenu()}
    </SafeAreaView>
  );
}

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
  messageWithEmbed: {
    maxWidth: '90%', // Make messages with embeds larger
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  sentMessageDark: {
    backgroundColor: '#005C4B', // Darker green for sent messages in dark mode
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
  inventoryMenuContainer: {
    backgroundColor: '#f0f2f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 10,
  },
  inventoryMenuContainerDark: {
    backgroundColor: '#2C2C2C',
    borderTopColor: '#3D3D3D',
  },
  inventoryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  inventoryItemDark: {
    backgroundColor: '#3D3D3D', // Add a dark mode background color
  },
  inventoryItemImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  inventoryItemName: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  inventoryItemNameDark: {
    color: '#FFFFFF',
  },
  inventoryItemQuantity: {
    fontSize: 10,
    color: '#666',
  },
  inventoryItemQuantityDark: {
    color: '#B0B0B0',
  },
  inventoryMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(240, 240, 240, 0.5)',
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
  inventoryMessageItemImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 5,
  },
  inventoryMessageItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inventoryMessageItemText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 5,
  },
  inventoryMessageItemQuantity: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  collectText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 5,
  },
  selectedInventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  quantityInput: {
    width: 40,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    textAlign: 'center',
  },
  attachMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  attachMenuContainerDark: {
    backgroundColor: '#2C2C2C', // Adjust this color as needed
  },
  attachMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  attachMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  attachMenuTitleDark: {
    color: '#FFFFFF',
  },
  attachMenuOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  attachOption: {
    alignItems: 'center',
  },
  attachOptionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachOptionText: {
    fontSize: 14,
  },
  attachOptionTextDark: {
    fontSize: 14,
    color: '#FFFFFF', // or any other color suitable for dark mode
  },
  linkPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  linkPreviewText: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
});