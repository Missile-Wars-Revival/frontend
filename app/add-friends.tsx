import React, { useState, useEffect } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, Keyboard, TouchableWithoutFeedback, SafeAreaView, Image } from "react-native";
import { NearbyPlayersData, searchOtherPlayersData } from "../api/getplayerlocations";
import { addFriend, removeFriend } from "../api/friends";
import { router } from "expo-router";
import { getCurrentLocation, location } from "../util/locationreq";
import * as SecureStore from "expo-secure-store";
import { Ionicons } from '@expo/vector-icons';
import { fetchAndCacheImage } from "../util/imagecache";
interface Filterddata {
  username: string,
  latitude: string,
  longitude: string,
  profileImageUrl: string | null;
}

const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png");

const QuickAddPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredData, setFilteredData] = useState<Filterddata[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      const username = await SecureStore.getItemAsync("username");
      if (username) {
      } else {
        console.log('Credentials not found, please log in');
        // Optionally redirect to login page
        router.navigate("/login");
      }
    };

    fetchCredentials();
  }, []);

  const fetchLocation = async () => {
    const location: location = await getCurrentLocation();
    setUserLocation(location)
    }

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      setLoading(true);
      NearbyPlayersData(userLocation.latitude, userLocation.longitude)
        .then(data => {
          setPlayersData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch players:", error);
          setLoading(false);
        });
    }
  }, [userLocation]);

  const handleAddFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found')
        return; 
      }
      const result = await addFriend(token, friendUsername);
      // Assuming successful addition if no errors thrown and possibly checking a status or message
      if (result.message === "Friend added successfully") {
      // Update UI state to reflect the new friend status
      setPlayersData(prevData => 
        prevData.map(player =>
          player.username === friendUsername ? { ...player, isFriend: "You are already friends with this person." } : player
        )
      );
        Alert.alert("Success", "Friend added successfully!");
      } else {
        // Handle any other messages or default case
        Alert.alert("Error", result.message || "Failed to add friend.");
      }
    } catch (error) {
      // Handle any errors thrown from the addFriend function
      console.warn('Error adding friend:', error);
      Alert.alert("This player is already your friend!");
    }
  };

  // const handleRemoveFriend = async (friendUsername: string) => {
  //   const token = await SecureStore.getItemAsync("token");
  //   try {
  //       if (!token) {
  //           console.log('Token not found');
  //           return; 
  //       }
  //       const response = await removeFriend(token, friendUsername);
  //       if (response.message === "Friend removed successfully") {
  //           // Assuming the server sends a response status OK on successful friend removal
  //           Alert.alert("Success", "Friend successfully removed.");
  //       } else {
  //           // If the response is not OK, parse the response for error messages
  //           const result = await response.json();
  //           Alert.alert("Error", result.message || "Failed to remove friend.");
  //       }
  //   } catch (error) {
  //       // Catch any other errors here
  //       console.error('Error removing friend:', error);
  //       Alert.alert("Error", "An unexpected error occurred while removing the friend.");
  //   }
  // };
  const onRefresh = async () => {
    setRefreshing(true);
    if (userLocation) {
      setLoading(true);
      NearbyPlayersData(userLocation.latitude, userLocation.longitude)
        .then(data => {
          setPlayersData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Failed to fetch players:", error);
          setLoading(false);
        });
    }
    setRefreshing(false);
  };

  const handleSearch = async (text: string) => {
    setSearchTerm(text);
    if (!text.trim()) {
      setFilteredData([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    try {
      const currentUserUsername = await SecureStore.getItemAsync("username");
      
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        setFilteredData([]);
        setIsSearching(false);
        return;
      }

      const result = await searchOtherPlayersData(text);
      
      const filteredResult = result.filter(player => player.username !== currentUserUsername);
      
      const filteredResultWithImages = await Promise.all(
        filteredResult.map(async (player) => ({
          ...player,
          profileImageUrl: await fetchAndCacheImage(player.username),
        }))
      );
      
      setFilteredData(filteredResultWithImages);
    } catch (error) {
      console.error("Failed to search for players:", error);
      setFilteredData([]);
    }
  };

  const navigateToUserProfile = (username: string) => {
    router.push({
      pathname: "/user-profile",
      params: { username }
    });
  };

  const renderPlayerItem = ({ item }: { item: Filterddata }) => (
    <View className="flex-row items-center justify-between mb-4 bg-white p-4 rounded-lg shadow">
      <TouchableOpacity 
        className="flex-row flex-1 items-center"
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image
          source={item.profileImageUrl ? { uri: item.profileImageUrl } : resizedplayerimage}
          className="w-12 h-12 rounded-full"
        />
        <Text className="flex-1 text-lg font-semibold ml-4">{item.username}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        className="bg-green-600 p-2 rounded-full w-10 h-10 justify-center items-center"
        onPress={() => handleAddFriend(item.username)}
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView className="flex-1 bg-gray-100">
        <View className="flex-1 px-4 pt-6">
          <View className="flex-row justify-between items-center mb-6">
            <TouchableOpacity
              className="bg-blue-500 p-2 rounded-full"
              onPress={() => router.push("/friends")}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-800">Add Friends</Text>
            <View className="w-10" /> 
          </View>
          
          <TextInput
            className="bg-white border border-gray-300 rounded-lg px-4 py-2 mb-4"
            placeholder="Search for friends..."
            autoCorrect={false}
            autoCapitalize="none"
            value={searchTerm}
            onChangeText={handleSearch}
          />
          
          {isSearching && (
            <View className="mb-4">
              <Text className="text-xl font-semibold mb-2 text-gray-800">Search Results:</Text>
              <FlatList
                data={filteredData}
                renderItem={renderPlayerItem}
                keyExtractor={item => item.username}
                ListEmptyComponent={
                  <Text className="text-center text-gray-600">No players found</Text>
                }
              />
            </View>
          )}
          
          {!isSearching && (
            <>
              {loading ? (
                <Text className="text-lg text-center text-gray-600">Loading...</Text>
              ) : playersData.length === 0 ? (
                <Text className="text-lg text-center text-gray-600">
                  No players found near you
                </Text>
              ) : (
                <>
                  <Text className="text-xl font-semibold mb-4 text-gray-800">Players Nearby:</Text>
                  <FlatList
                    data={playersData}
                    renderItem={renderPlayerItem}
                    keyExtractor={(item) => item.username}
                    refreshControl={
                      <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#4A5568"]}
                      />
                    }
                  />
                </>
              )}
            </>
          )}
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default QuickAddPage;