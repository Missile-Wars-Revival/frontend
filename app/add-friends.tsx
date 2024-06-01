
//Not working


import React, { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Input } from "../components/ui/input";
import { searchOtherPlayersData } from "../api/getplayerlocations";
import { addFriend } from "../api/add-friend"; // Import the addFriend function
import { removeFriend } from "../api/remove-friend";
import { router } from "expo-router";
import { getCredentials } from "../util/logincache";



const QuickAddPage: React.FC = () => {
  const [userNAME, setUsername] = useState("");

  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await getCredentials();
      if (credentials) {
        setUsername(credentials.username);
      } else {
        console.log('Credentials not found, please log in');
        // Optionally redirect to login page
        router.navigate("/login");
      }
    };

    fetchCredentials();
  }, []);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [playersData, setPlayersData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);
    } catch (error) {
      console.log("Error fetching location:", error);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      searchOtherPlayersData(searchTerm).then((data) => {
        setPlayersData(data);
        setLoading(false);
      });
    }
  }, [userLocation, searchTerm]);

  const handleAddFriend = async (friendUsername: string) => {
    try {
      // Call the addFriend function from the hook
      await addFriend(userNAME, "password", friendUsername);
      // Optionally, update UI or show success message
      console.log(`Friend ${friendUsername} added successfully`);
    } catch (error) {
      // Handle errors, show alerts, etc.
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    try {
      await removeFriend(userNAME, "password", friendUsername);
      console.log(`Friend ${friendUsername} removed successfully`);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between mb-[10px]">
      <Text className="text-[16px] flex-1">{item.username}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="bg-green-600 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => handleAddFriend(item.username)}
        >
          <Text className="font-[13px] text-white">+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => handleRemoveFriend(item.username)}
        >
          <Text className="font-[13px] text-white">x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 p-[20px]">
      <Input
        className="h-[40px] border border-gray-500 mb-[20px] px-[10px]"
        placeholder="Search for friends..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text>Loading...</Text>
      ) : playersData.length === 0 ? (
        <Text className="text-[16px] text-center">
          No players found near you
        </Text>
      ) : (
        <>
          <Text className="text-[20px] pb-[10px]">Player's Nearby:</Text>
          <FlatList
            data={playersData}
            renderItem={renderItem}
            keyExtractor={(item) => item.username}
          />
        </>
      )}
    </View>
  );
};

export default QuickAddPage;
