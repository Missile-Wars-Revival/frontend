import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert, RefreshControl, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useUserName } from "../util/fetchusernameglobal";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import axiosInstance from "../api/axios-instance";
import { removeFriend } from "../api/friends";
import { MissileLibrary } from "../components/Missile/missile";
import { searchFriendsAdded } from "../api/getplayerlocations";
import { fetchAndCacheImage } from "../util/imagecache";

interface Friend {
  username: string;
  profileImageUrl: string;
}

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
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

  const handleRemPress = (friendUsername: string) => {
    setSelectedFriend(friendUsername);
    setModalVisible(true);
  };

  const fireMissile = (username: string) => {
    setSelectedPlayer(username);
    setShowMissileLibrary(true);
    console.log(`Firing missile for friend with username: ${username}`);
  };

  const fetchFriends = async () => {
    setLoading(true);
    const token = await SecureStore.getItemAsync("token");
  
    if (!token) {
      console.log('Token not found');
      setLoading(false);
      return;
    }
  
    try {
      const response = await axiosInstance.get('/api/friends', {
        params: { token } 
      });
  
      if (response.data && response.data.friends) {
        const friendsWithImages = await Promise.all(
          response.data.friends.map(async (friend: Friend) => ({
            ...friend,
            profileImageUrl: await fetchAndCacheImage(friend.username),
          }))
        );
        setFriends(friendsWithImages);
      } else {
        console.log('No friends data found');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Axios error:', error.message);
      } else {
        console.error('Error fetching friends:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFriends();
  }, [userNAME]);

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
        fetchFriends(); // Refresh the friends list
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
    await fetchFriends();
    setRefreshing(false);
  };

  const navigateToUserProfile = (username: string) => {
    router.push({
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
    <View className="flex-row justify-between items-center bg-white p-4 mb-2 rounded-lg shadow">
      <TouchableOpacity 
        className="flex-row flex-1 items-center"
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={{ uri: item.profileImageUrl }}
          className="w-12 h-12 rounded-full"
        />
        <Text className="flex-1 text-lg font-semibold ml-4">{item.username}</Text>
      </TouchableOpacity>
      <View className="flex-row">
        <TouchableOpacity
          className="bg-red-500 w-10 h-10 rounded-full justify-center items-center mr-2"
          onPress={() => fireMissile(item.username)}
        >
          <Text className="text-white text-xl">🚀</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 w-10 h-10 rounded-full justify-center items-center"
          onPress={() => handleRemPress(item.username)}
        >
          <Text className="text-white text-xl">X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSearchResultItem = ({ item }: { item: Friend }) => (
    <View className="flex-row justify-between items-center bg-white p-4 mb-2 rounded-lg shadow">
      <TouchableOpacity 
        className="flex-row flex-1 items-center"
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={{ uri: item.profileImageUrl }}
          className="w-12 h-12 rounded-full"
        />
        <Text className="flex-1 text-lg font-semibold ml-4">{item.username}</Text>
      </TouchableOpacity>
      <View className="flex-row">
        <TouchableOpacity
          className="bg-red-500 w-10 h-10 rounded-full justify-center items-center"
          onPress={() => handleRemPress(item.username)}
        >
          <Text className="text-white text-xl">X</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4 pt-12">
      <View className="flex-row justify-between items-center mb-4">
        <TouchableOpacity
          className="w-10 h-10 bg-blue-500 rounded-full justify-center items-center"
          onPress={() => router.push("/add-friends")}
        >
          <Text className="text-white text-xl">+</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Friends</Text>
        <TouchableOpacity
          className="w-10 h-10 bg-gray-400 rounded-full justify-center items-center"
          onPress={() => router.push("/notifications")}
        >
          <Text className="text-white text-xl">🔔</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        className="bg-white p-2 rounded-lg mb-4"
        placeholder="Search friends..."
        value={searchTerm}
        onChangeText={handleSearch}
      />

      {loading ? (
        <Text className="text-center text-gray-600">Loading...</Text>
      ) : error ? (
        <Text className="text-center text-red-500">{error}</Text>
      ) : isSearchActive ? (
        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.username}
          renderItem={renderSearchResultItem}
          ListEmptyComponent={
            <Text className="text-center text-gray-600">
              {searchTerm.trim() ? "No friends found" : "Type to search friends"}
            </Text>
          }
        />
      ) : friends.length === 0 ? (
        <Text className="text-center text-gray-600">No friends found</Text>
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
            />
          }
        />
      )}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-6 rounded-lg w-4/5">
            <Text className="text-xl mb-4">Remove {selectedFriend}?</Text>
            <TouchableOpacity
              className="bg-red-500 p-3 rounded-md mb-2"
              onPress={() => handleRemoveFriend(selectedFriend)}
            >
              <Text className="text-white text-center font-bold">Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-300 p-3 rounded-md"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-center font-bold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMissileLibrary}
        onRequestClose={() => setShowMissileLibrary(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white rounded-lg w-11/12 max-h-3/4">
            <MissileLibrary 
              playerName={selectedPlayer} 
              onMissileFired={() => {
                // Handle missile fired event
                setShowMissileLibrary(false);
              }}
              onClose={() => setShowMissileLibrary(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default FriendsPage;