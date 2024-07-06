import React, { useState, useEffect } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, Keyboard, TouchableWithoutFeedback  } from "react-native";
import { Input } from "../components/ui/input";
import { NearbyPlayersData, searchOtherPlayersData } from "../api/getplayerlocations";
import { addFriend } from "../api/add-friend"; // Import the addFriend function
import { removeFriend } from "../api/remove-friend";
import { router } from "expo-router";
import { getCredentials } from "../util/logincache";
import { getCurrentLocation, location } from "../util/locationreq";
import * as SecureStore from "expo-secure-store";

interface Filterddata {
  username: string,
  latitude: string,
  longitude: string,
}

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
  const [refreshing, setRefreshing] = useState(false);
  const [filteredData, setFilteredData] = useState<Filterddata[]>([]);;
  const [hasInteracted, setHasInteracted] = useState(false); 

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
      console.error('Error adding friend:', error);
      Alert.alert("An unexpected error occurred while adding friend.");
    }
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
        if (!token) {
            console.log('Token not found');
            Alert.alert("Error", "Authentication token not found. Please login again.");
            return; 
        }
        const response = await removeFriend(token, friendUsername);
        if (response.message === "Friend removed successfully") {
            // Assuming the server sends a response status OK on successful friend removal
            Alert.alert("Success", "Friend successfully removed.");
        } else {
            // If the response is not OK, parse the response for error messages
            const result = await response.json();
            Alert.alert("Error", result.message || "Failed to remove friend.");
        }
    } catch (error) {
        // Catch any other errors here
        console.error('Error removing friend:', error);
        Alert.alert("Error", "An unexpected error occurred while removing the friend.");
    }
  };
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
        setHasInteracted(false);
        setFilteredData([]);
        return;
    }
    
    try {
        const currentUserUsername = await SecureStore.getItemAsync("username");
        
        if (currentUserUsername === null) {
            console.error("No username found in secure storage.");
            setFilteredData([]);
            setHasInteracted(false);  
            return;
        }

        const result = await searchOtherPlayersData(text, currentUserUsername);
        
        const filteredResult = result.filter(player => player.username !== currentUserUsername);
        
        setFilteredData(filteredResult);
        setHasInteracted(true);
    } catch (error) {
        console.error("Failed to search for players:", error);
        setFilteredData([]);
    }
};

  const handleDismiss = () => {
    setHasInteracted(false);
    Keyboard.dismiss();  
  };

  const quickaddItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center justify-between mb-[10px]">
      <Text className="text-[16px] flex-1">{item.username}</Text>
      <View className="flex-row items-center">
        <TouchableOpacity
          className="bg-green-600 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => handleAddFriend(item.username)}
        >
          <Text className="font-[13px] text-white">+</Text>
        </TouchableOpacity>
        {/* Commented out as rmeoving friend in quick add not needed yet */}
        {/* <TouchableOpacity
          className="bg-red-500 p-[10px] rounded-[5px] w-[35px] h-[35px] justify-center items-center mr-[10px]"
          onPress={() => handleRemoveFriend(item.username)}
        >
          <Text className="font-[13px] text-white">x</Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );

  const searchitem = ({ item }: { item: any }) => (
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
    <TouchableWithoutFeedback onPress={handleDismiss}>
    <View style={{ flex: 1, padding: 20, paddingTop: 50 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: -25 }}>
        <Text style={{ fontSize: 20 }}>Add Friends</Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            width: 60,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'blue',
          }}
          onPress={() => router.navigate("/friends")}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>Back</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingLeft: 10 }}
        placeholder="Search for friends..."
        value={searchTerm}
        onChangeText={handleSearch}
      />
      {hasInteracted && (
      <FlatList
        data={filteredData}
        renderItem={searchitem}
        keyExtractor={item => item.username}
        style={{ marginBottom: 10 }}
      />
    )}
      {loading ? (
        <Text>Loading...</Text>
      ) : playersData.length === 0 ? (
        <Text style={{ fontSize: 16, textAlign: 'center' }}>
          No players found near you
        </Text>
      ) : (
        <>
          <Text style={{ fontSize: 20, paddingBottom: 10 }}>Player's Nearby:</Text>
          <FlatList
            data={playersData}
            renderItem={quickaddItem}
            keyExtractor={(item) => item.username}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#9Bd35A", "#689F38"]} // Customize color
              />
            }
          />
        </>
      )}
    </View>
    </TouchableWithoutFeedback>
  );
};

export default QuickAddPage;
