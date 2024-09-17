import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert, RefreshControl, Image, TextInput, StyleSheet, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { useUserName } from "../util/fetchusernameglobal";
import * as SecureStore from 'expo-secure-store';
import { removeFriend } from "../api/friends";
import { MissileLibrary } from "../components/Missile/missile";
import { searchFriendsAdded } from "../api/getplayerlocations";
import { fetchAndCacheImage } from "../util/imagecache";
import { useNotifications, notificationEmitter } from "../components/Notifications/useNotifications";
import useFetchFriends from "../hooks/websockets/friendshook";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getlocActive } from "../api/locActive";
import { Ionicons } from '@expo/vector-icons'; 

interface Friend {
  username: string;
  profileImageUrl: string;
}

const FriendsPage: React.FC = () => {
  const friends = useFetchFriends() //WS
  const [loading, setLoading] = useState(false);
  const error = null;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const userNAME = useUserName();
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { unreadCount: initialUnreadCount } = useNotifications();
  const [localUnreadCount, setLocalUnreadCount] = useState(initialUnreadCount);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const colorScheme = useColorScheme();
  const [locActive, setLocActive] = useState<boolean>(true);
  const isDarkMode = colorScheme === 'dark';

  const handleUnreadCountUpdate = useCallback((count: number) => {
    setLocalUnreadCount(count);
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
			  const isAliveStatus = JSON.parse(isAliveStatusString);
	
			  setIsAlive(isAliveStatus.isAlive);
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
      // Fetch immediately on component mount
      fetchLocActiveStatus();
      // Set up interval to fetch every 30 seconds (adjust as needed)
      const intervalId = setInterval(fetchLocActiveStatus, 30000);
  
      // Clean up interval on component unmount
      return () => {
        clearInterval(intervalId);
      };
    }, []);
    
    const fetchLocActiveStatus = async () => {
      try {
        const status = await getlocActive();
        setLocActive(status);
      } catch (error) {
        console.error("Failed to fetch locActive status:", error);
      } finally {
      }
    };

  const handleRemPress = (friendUsername: string) => {
    setSelectedFriend(friendUsername);
    setModalVisible(true);
  };

  const fireMissile = (username: string) => {
    setSelectedPlayer(username);
    setShowMissileLibrary(true);
    console.log(`Firing missile for friend with username: ${username}`);
  };


  const handleRemoveFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found');
        return; 
      }
      const response = await removeFriend(token, friendUsername);
      if (response.message === "Friend removed successfully") {
        Alert.alert("Success", "Friend successfully removed.");
        setModalVisible(false);
      } else {
        const result = await response.json();
        Alert.alert("Error", result.message || "Failed to remove friend.");
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert("Error", "An unexpected error occurred while removing the friend.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setRefreshing(false);
  };

  const navigateToUserProfile = (username: string) => {
    router.navigate({
      pathname: "/user-profile",
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
      const currentUserUsername = await SecureStore.getItemAsync("username");
      
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        setFilteredFriends([]);
        return;
      }

      const result = await searchFriendsAdded(text);
      
      const filteredResult = result.filter(friend => friend.username !== currentUserUsername);
      
      const filteredResultWithImages = await Promise.all(
        filteredResult.map(async (friend) => ({
          ...friend,
          profileImageUrl: await fetchAndCacheImage(friend.username),
        }))
      );
      
      setFilteredFriends(filteredResultWithImages);
    } catch (error) {
      console.error("Failed to search for friends:", error);
      setFilteredFriends([]);
    }
  };

  const renderFriendItem = ({ item }: { item: Friend }) => (
    <View style={[styles.friendItem, isDarkMode && styles.friendItemDark]}>
      <TouchableOpacity 
        style={styles.friendInfo}
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={{ uri: item.profileImageUrl }}
          style={styles.friendImage}
        />
        <Text style={[styles.friendName, isDarkMode && styles.friendNameDark]}>{item.username}</Text>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        {isAlive && locActive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.fireButton]}
            onPress={() => fireMissile(item.username)}
          >
            <Text style={styles.actionButtonText}>🚀</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemPress(item.username)}
        >
          <Text style={styles.actionButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResultItem = ({ item }: { item: Friend }) => (
    <View style={[styles.friendItem, isDarkMode && styles.friendItemDark]}>
      <TouchableOpacity 
        style={styles.friendInfo}
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={{ uri: item.profileImageUrl }}
          style={styles.friendImage}
        />
        <Text style={[styles.friendName, isDarkMode && styles.friendNameDark]}>{item.username}</Text>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => handleRemPress(item.username)}
        >
          <Text style={styles.actionButtonText}>X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <TouchableOpacity
          style={[styles.addButton, isDarkMode && styles.addButtonDark]}
          onPress={() => router.navigate("/add-friends")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Friends</Text>
        <TouchableOpacity
          style={[styles.notificationButton, isDarkMode && styles.notificationButtonDark]}
          onPress={() => router.navigate("/notifications")}
        >
          <Text style={styles.notificationButtonText}>🔔</Text>
          {localUnreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{localUnreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.searchInput, isDarkMode && styles.searchInputDark]}
        placeholder="Search friends..."
        placeholderTextColor={isDarkMode ? "#B0B0B0" : "#666"}
        value={searchTerm}
        onChangeText={handleSearch}
      />

      {loading ? (
        <Text style={[styles.centerText, isDarkMode && styles.centerTextDark]}>Loading...</Text>
      ) : error ? (
        <Text style={[styles.centerText, isDarkMode && styles.centerTextDark, styles.errorText]}>{error}</Text>
      ) : isSearchActive ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.username}
          renderItem={renderSearchResultItem}
          ListEmptyComponent={
            <Text style={[styles.centerText, isDarkMode && styles.centerTextDark]}>
              {searchTerm.trim() ? "No friends found" : "Type to search friends"}
            </Text>
          }
        />
      ) : friends.length === 0 ? (
        <Text style={[styles.centerText, isDarkMode && styles.centerTextDark]}>No friends found</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.username}
          renderItem={renderFriendItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#9Bd35A", "#689F38"]}
              tintColor={isDarkMode ? "#FFF" : "#000"}
            />
          }
        />
      )}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Remove Friend</Text>
            <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>
              Are you sure you want to remove {selectedFriend} from your friends list?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, isDarkMode && styles.cancelButtonDark]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButtonModal]}
                onPress={() => handleRemoveFriend(selectedFriend)}
              >
                <Text style={styles.modalButtonText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMissileLibrary}
        onRequestClose={() => setShowMissileLibrary(false)}
      >
        <View style={[styles.missileLibraryContainer, isDarkMode && styles.missileLibraryContainerDark]}>
          <View style={[styles.missileLibraryHeader, isDarkMode && styles.missileLibraryHeaderDark]}>
            <Text style={[styles.missileLibraryTitle, isDarkMode && styles.missileLibraryTitleDark]}>Missile Library</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowMissileLibrary(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          {isAlive && locActive ? (
            <MissileLibrary 
              playerName={selectedPlayer} 
              onMissileFired={() => {
                // Handle missile fired event
                setShowMissileLibrary(false);
              }}
              onClose={() => setShowMissileLibrary(false)}
            />
          ) : (
            <View style={styles.centerText}>
              <Text style={[styles.centerText, isDarkMode && styles.centerTextDark]}>You cannot fire missiles when eliminated.</Text>
            </View>
          )}
        </View>
      </Modal>
      
      <TouchableOpacity
        style={[styles.messageButton, isDarkMode && styles.messageButtonDark]}
        onPress={() => router.navigate("/msg")}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color={isDarkMode ? "#FFF" : "#000"} />
      </TouchableOpacity>
    </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  headerTextDark: {
    color: '#FFF',
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDark: {
    backgroundColor: '#3D3D3D',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#718096',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButtonDark: {
    backgroundColor: '#3D3D3D',
  },
  notificationButtonText: {
    color: '#ffffff',
    fontSize: 20,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#e53e3e',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  searchInputDark: {
    backgroundColor: '#2C2C2C',
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
  errorText: {
    color: '#e53e3e',
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
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  fireButton: {
    backgroundColor: '#e53e3e',
  },
  removeButton: {
    backgroundColor: '#718096',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#2d3748',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#4a5568',
  },
  modalTextDark: {
    color: '#B0B0B0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#cbd5e0',
    marginRight: 10,
  },
  cancelButtonDark: {
    backgroundColor: '#3D3D3D',
  },
  removeButtonModal: {
    backgroundColor: '#e53e3e',
    marginLeft: 10,
  },
  modalButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  missileLibraryContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
  },
  missileLibraryContainerDark: {
    backgroundColor: '#1E1E1E',
    paddingTop: 60,
  },
  missileLibraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f7fafc',
  },
  missileLibraryHeaderDark: {
    backgroundColor: '#2C2C2C',
  },
  missileLibraryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  missileLibraryTitleDark: {
    color: '#FFF',
  },
  doneButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  messageButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  messageButtonDark: {
    backgroundColor: '#3D3D3D',
  },
});

export default FriendsPage;