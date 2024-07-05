import React, { useState, useEffect, useCallback } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert } from "react-native";
import * as Location from "expo-location";
import { Input } from "../components/ui/input";
import { NearbyPlayersData, searchOtherPlayersData } from "../api/getplayerlocations";
import { addFriend } from "../api/add-friend"; // Import the addFriend function
import { removeFriend } from "../api/remove-friend";
import { router } from "expo-router";
import { getCredentials } from "../util/logincache";
import { getCurrentLocation, location } from "../util/locationreq";
import * as SecureStore from "expo-secure-store";

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
          console.log('Token not found');
          return; 
        }
        addFriend(token, friendUsername)
      } catch (error: any) {
      }

    //add friend here
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    //remove friend here
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
