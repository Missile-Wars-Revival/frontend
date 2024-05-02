import React, { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Input } from "../components/ui/input";
import { userNAME } from "../temp/login";
import { Player } from "../types/types";
import { searchOtherPlayersData } from "../api/getplayerlocations"; // Import searchOtherPlayersData for searches....

const QuickAddPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [playersData, setPlayersData] = useState<Player[]>([]);
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

  const addFriend = async (friendUsername: string) => {
    // Implement addFriend functionality
  };

  const removeFriend = async (friendUsername: string) => {
    // Implement removeFriend functionality
  };

  const renderItem = ({ item }: { item: Player }) => (
    <View className="flex-row items-center justify-between mb-[10px]">
      <Text className="text-[16px] flex-1">{item.username}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="bg-green-600 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => addFriend(item.username)}
        >
          <Text className="font-[13px] text-white">+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="bg-red-500 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => removeFriend(item.username)}
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
