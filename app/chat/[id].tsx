import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, FlatList, TextInput, Pressable, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, Modal, Alert, Animated, Linking, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import { getDatabase, ref, onValue, push, set, get, update, serverTimestamp, increment } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as SecureStore from "expo-secure-store";
import { generateUID } from '../../util/uidGenerator';
import { File, Paths } from 'expo-file-system';
import useFetchInventory from '../../hooks/websockets/inventoryhook';
import { receiveItem, removeItem } from '../../api/add-item';
import { notificationEmitter } from '../../components/Notifications/useNotifications';
import ItemCollectAnimation from '../../components/Animations/itemCollect';
import { getImages } from '../../api/store';
import { getPalette, Type, cardShadow, type ThemePalette } from '../../components/ui/theme';

type Message = {
  id: string;
  senderUsername: string;
  text: string;
  imageUrl?: string;
  timestamp: number;
  delivered: boolean;
  read: boolean;
  isNotified: boolean;
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
    <Pressable onPress={handlePress} style={[linkStyles.preview, { backgroundColor: `${getColor()}20` }]}>
      <Ionicons name={getIconName()} size={50} color={getColor()} />
      <Text style={[linkStyles.text, { color: getColor() }]} numberOfLines={1} ellipsizeMode="tail">
        {data.url}
      </Text>
    </Pressable>
  );
};

// Link previews take their colour from the link type, not the theme.
const linkStyles = StyleSheet.create({
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
  },
  text: {
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
});

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = React.useMemo(() => getStyles(palette, isDarkMode), [palette, isDarkMode]);
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
  const [slideAnimation] = useState(() => new Animated.Value(0));
  const [isUploading, setIsUploading] = useState(false);
  const [collectingItem, setCollectingItem] = useState<InventoryMessageItem | null>(null);
  const [inputHeight, setInputHeight] = useState(40);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

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
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  const scrollToBottom = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  const markMessagesAsRead = useCallback(async (messageList: Message[], otherParticipant: string) => {
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
  }, [username, id]);

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

          // Update unread chat count
          notificationEmitter.emit('unreadCountUpdated', { 
            count: 0, // We don't know the count of other notifications here
            chatCount: unreadMessages.length 
          });

          // Scroll to bottom after setting messages
          setTimeout(() => scrollToBottom(), 100);
        }
      } else {
        console.error('No data found for conversation');
        Alert.alert('Error', 'Could not load conversation data');
      }
    });

    return () => unsubscribe();
  }, [id, username, markMessagesAsRead, scrollToBottom]);

  const handleAttachPress = () => {
    Keyboard.dismiss(); // Add this line to hide the keyboard
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
        { transform: [{ translateY }] }
      ]}>
        <View style={styles.attachMenuHeader}>
          <Text style={styles.attachMenuTitle}>Attach</Text>
          <Pressable onPress={hideAttachMenu}>
            <Ionicons name="close" size={24} color={palette.text} />
          </Pressable>
        </View>
        <View style={styles.attachMenuOptions}>
          <Pressable style={styles.attachOption} onPress={() => {
            hideAttachMenu();
            setShowInventoryMenu(true);
          }}>
            <View style={styles.attachOptionIcon}>
              <Ionicons name="cube" size={30} color="#fff" />
            </View>
            <Text style={styles.attachOptionText}>Inventory Item</Text>
          </Pressable>
          <Pressable style={styles.attachOption} onPress={() => {
            hideAttachMenu();
            pickImage();
          }}>
            <View style={[styles.attachOptionIcon, { backgroundColor: palette.success }]}>
              <Ionicons name="image" size={30} color="#fff" />
            </View>
            <Text style={styles.attachOptionText}>Image</Text>
          </Pressable>
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
      isNotified: false,
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
      isNotified: false,
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

        // First, download the image to the local file system (SDK 54+ File API)
        const destination = new File(Paths.document, `temp_image_${Date.now()}.jpg`);
        const downloaded = await File.downloadFileAsync(fullScreenImage, destination);

        // Then, save the local file to the media library (SDK 54+ class-based API)
        const asset = await MediaLibrary.Asset.create(downloaded.uri);

        if (asset) {
          // Add to the "ChatApp" album, creating it if it doesn't exist yet.
          const existingAlbum = await MediaLibrary.Album.get('ChatApp');
          if (existingAlbum) {
            await existingAlbum.add(asset);
          } else {
            await MediaLibrary.Album.create('ChatApp', [asset], false);
          }
          Alert.alert('Success', 'Image saved to gallery!');
        } else {
          Alert.alert('Error', 'Failed to save the image.');
          downloaded.delete();
          return;
        }

        // Clean up the temporary file
        downloaded.delete();

      } catch (error) {
        console.error('Error saving image:', error);
        Alert.alert('Error', `Failed to save the image:`);
      }
    }
  };

  const handleCollectItem = useCallback(async (item: InventoryMessageItem) => {
    if (!username || item.senderUsername === username) return;

    setCollectingItem(item);

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
  }, [username, id]);

  const handleAnimationComplete = () => {
    setCollectingItem(null);
  };

  const renderMessageItem = useCallback(({ item }: { item: Message }) => {
    const isOwnMessage = item.senderUsername === username;
    const linkPreviews = parseUrls(item.text);
    const strippedText = stripUrls(item.text);

    return (
      <View style={[
        styles.messageItem,
        isOwnMessage ? styles.sentMessage : styles.receivedMessage,
        linkPreviews.length > 0 && styles.messageWithEmbed,
      ]}>
        <Text style={styles.senderUsername}>{item.senderUsername}</Text>
        {strippedText && (
          <Text style={styles.messageText}>{strippedText}</Text>
        )}
        {linkPreviews.map((preview, index) => (
          <LinkPreview key={index} data={preview} />
        ))}
        {item.imageUrl && (
          <Pressable onPress={() => handleImagePress(item.imageUrl!)}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.messageImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={200}
            />
          </Pressable>
        )}
        {item.inventoryItem && (
          <Pressable
            style={styles.inventoryMessageItem}
            onPress={() => !isOwnMessage && item.inventoryItem && handleCollectItem({
              id: item.inventoryItem.id,
              name: item.inventoryItem.name,
              quantity: item.inventoryItem.quantity,
              messageId: item.id,
              senderUsername: item.senderUsername
            })}
          >
            <Image
              source={getImageForProduct(item.inventoryItem.name)}
              style={styles.inventoryMessageItemImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
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
          </Pressable>
        )}
        {isOwnMessage && (
          <View style={styles.messageStatus}>
            {item.delivered && <Ionicons name="checkmark" size={16} color={palette.textMuted} />}
            {item.read && <Ionicons name="checkmark-done" size={16} color={palette.textMuted} />}
          </View>
        )}
      </View>
    );
  }, [username, isDarkMode, getImageForProduct, handleCollectItem]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color={palette.text} />
      </Pressable>
      <Text style={styles.headerTitle}>
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
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow all media types, including GIFs
      allowsEditing: false, // Set to false to preserve GIF animation
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {unreadCount > 0 && (
        <Text style={styles.unreadCount}>{unreadCount} unread messages</Text>
      )}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={[
            styles.messageListContent,
            { paddingBottom: keyboardHeight }
          ]}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />
        {selectedInventoryItem && (
          <View style={styles.selectedInventoryItemContainer}>
            <Image
              source={getImageForProduct(selectedInventoryItem.name)}
              style={styles.selectedInventoryItemImage}
              contentFit="contain"
              cachePolicy="memory-disk"
            />
            <View style={styles.selectedInventoryItemInfo}>
              <Text style={styles.selectedInventoryItemName} numberOfLines={1}>
                {selectedInventoryItem.name}
              </Text>
              <Text style={styles.selectedInventoryItemQuantity}>
                {selectedInventoryItem.quantity} left in inventory
              </Text>
              <View style={styles.quantityControls}>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  <Ionicons name="remove" size={18} color={palette.text} />
                </Pressable>
                <Text style={styles.quantityText}>
                  Send: {itemQuantity}
                </Text>
                <Pressable
                  style={styles.quantityButton}
                  onPress={() => setItemQuantity(Math.min(selectedInventoryItem.quantity, itemQuantity + 1))}
                >
                  <Ionicons name="add" size={18} color={palette.text} />
                </Pressable>
              </View>
            </View>
            <Pressable
              style={styles.removeSelectedItem}
              onPress={() => {
                setSelectedInventoryItem(null);
                setItemQuantity(1);
              }}
            >
              <Ionicons name="close-circle" size={24} color={palette.danger} />
            </Pressable>
          </View>
        )}
        {showInventoryMenu && (
          <View style={styles.inventoryMenuContainer}>
            <FlatList
              data={inventory.filter(item => item.quantity > 0)}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelectInventoryItem(item)}
                  style={styles.inventoryItem}
                  disabled={item.quantity === 0}
                >
                  <Image
                    source={getImageForProduct(item.name)}
                    style={styles.inventoryItemImage}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                  />
                  <Text style={styles.inventoryItemName}>{item.name}</Text>
                  <Text style={styles.inventoryItemQuantity}>
                    {item.quantity} left
                  </Text>
                </Pressable>
              )}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.inventoryListContent}
            />
          </View>
        )}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
          )}
          <Pressable onPress={handleAttachPress} style={styles.attachButton}>
            <Ionicons name="attach" size={24} color={palette.textMuted} />
          </Pressable>
          <TextInput
            style={[
              styles.input,
              { height: Math.max(40, inputHeight) }
            ]}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={palette.textMuted}
            multiline
            onContentSizeChange={(event) =>
              setInputHeight(event.nativeEvent.contentSize.height)
            }
          />
          <Pressable onPress={handleSendMessage} style={styles.sendButton} disabled={isUploading}>
            <Ionicons name="send" size={24} color={isUploading ? palette.textFaint : palette.accent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={!!fullScreenImage} transparent={true} onRequestClose={() => setFullScreenImage(null)}>
        <View style={styles.fullScreenImageContainer}>
          <Image
            source={{ uri: fullScreenImage ?? undefined }}
            style={styles.fullScreenImage}
            contentFit="contain"
            cachePolicy="memory-disk"
          />
          <Pressable style={styles.closeButton} onPress={() => setFullScreenImage(null)}>
            <Ionicons name="close" size={30} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSaveImage}>
            <Ionicons name="download" size={30} color="#FFFFFF" />
          </Pressable>
        </View>
      </Modal>
      {imageUploadProgress > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${imageUploadProgress}%` }]} />
        </View>
      )}
      {isAttachMenuVisible && renderAttachMenu()}
      {collectingItem && (
        <ItemCollectAnimation
          itemName={collectingItem.name}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (palette: ThemePalette, isDarkMode: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
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
    backgroundColor: palette.surface,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: palette.surfaceAlt,
    borderRadius: 20,
    color: palette.text,
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
    backgroundColor: palette.accentSoft,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: palette.surface,
  },
  messageText: {
    fontSize: 16,
    color: palette.text,
    flexWrap: 'wrap',
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
    color: palette.textMuted,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    backgroundColor: palette.surface,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    ...Type.title,
    marginLeft: 10,
    color: palette.text,
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
    backgroundColor: palette.surfaceAlt,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: palette.success,
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
    backgroundColor: palette.surfaceAlt,
    color: palette.textMuted,
  },
  inventoryMenuContainer: {
    backgroundColor: palette.bg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  inventoryListContent: {
    paddingHorizontal: 5,
  },
  inventoryItem: {
    alignItems: 'center',
    marginHorizontal: 15,
    padding: 10,
    backgroundColor: palette.surface,
    borderRadius: 12,
    ...cardShadow(isDarkMode),
    minWidth: 80,
  },
  inventoryItemImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginBottom: 8,
  },
  inventoryItemName: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
    color: palette.text,
  },
  inventoryItemQuantity: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: '500',
  },
  inventoryMessageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
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
    color: palette.text,
    flex: 1,
    marginRight: 5,
  },
  inventoryMessageItemQuantity: {
    fontSize: 14,
    color: palette.text,
    fontWeight: 'bold',
  },
  collectText: {
    fontSize: 12,
    color: palette.accent,
    marginLeft: 5,
  },
  selectedInventoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedInventoryItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    padding: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: palette.border,
  },
  selectedInventoryItemImage: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  selectedInventoryItemInfo: {
    flex: 1,
  },
  selectedInventoryItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: palette.text,
    marginBottom: 4,
  },
  selectedInventoryItemQuantity: {
    fontSize: 12,
    color: palette.textMuted,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    backgroundColor: palette.surface,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginHorizontal: 12,
    color: palette.text,
  },
  removeSelectedItem: {
    marginLeft: 8,
  },
  quantityInput: {
    width: 40,
    marginLeft: 5,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 5,
    textAlign: 'center',
  },
  attachMenuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    ...cardShadow(isDarkMode),
  },
  attachMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  attachMenuTitle: {
    ...Type.title,
    color: palette.text,
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
    backgroundColor: palette.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  attachOptionText: {
    fontSize: 14,
    color: palette.text,
  },
});