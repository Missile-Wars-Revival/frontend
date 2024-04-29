import React, { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Input } from "../components/input";

const backendUrl: string = process.env.EXPO_PUBLIC_BACKEND_URL!;
const apiUrl: string = `${backendUrl}:3000/api/`;
import { userNAME } from "../temp/login";
import { Player } from "../types/types";


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
      console.log("Error fetching location:");
    }
  }, []);

  const fetchData = async (
    endpoint: string,
    method: string = "GET",
    data: any = null
  ) => {
    const config: {
      method: string;
      headers: { "Content-Type": string };
      body?: string | null;
    } = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.body = JSON.stringify(data as object);
    }

    try {
      const response = await fetch(apiUrl + endpoint, config);

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`Error fetching data`);
      throw error;
    }
  };

  const fetchOtherPlayersData = async () => {
    try {
      // Check if userLocation is available
      if (!userLocation) {
        console.log("User location is not available");
        setLoading(false);
        return;
      }

      const { latitude, longitude } = userLocation;

      const requestData = {
        username: userNAME, // Assuming userNAME is available from the state or props
        latitude: latitude,
        longitude: longitude,
      };

      const data = await fetchData("nearby", "POST", requestData);

      if (data && data.nearbyUsers) {
        const recentPlayersData = data.nearbyUsers.filter((player: Player) => {
          const playerTime = new Date(player.updatedAt).getTime();
          const currentTime = new Date().getTime();
          const twoWeeksInMillis = 2 * 7 * 24 * 60 * 60 * 1000;
          return currentTime - playerTime <= twoWeeksInMillis;
        });

        setPlayersData(recentPlayersData);
        setLoading(false);
      } else {
        console.log("No nearby users found");
        setPlayersData([]);
        setLoading(false);
      }
    } catch (error) {
      console.log("Error fetching other players data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchOtherPlayersData();
    }
  }, [userLocation]);

  const addFriend = async (friendUsername: string) => {
    
  };

  const removeFriend = async (friendUsername: string) => {
    
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
