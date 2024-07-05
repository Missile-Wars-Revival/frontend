import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useUserName } from "../util/fetchusernameglobal";
import * as SecureStore from 'expo-secure-store';
import axios from "axios";
import axiosInstance from "../api/axios-instance";
import { removeFriend } from "../api/remove-friend";

interface Friend {
  username: string;
  // Add other properties as needed
}

const fireMissile = (username: string) => {
  // Placeholder for firing missile logic
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const error = null; // Placeholder for error state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const router = useRouter();

  // Fetch username from secure storage
  const userNAME = useUserName(); //logged in user

  const handleCogPress = (friendUsername: string) => {
    setSelectedFriend(friendUsername);
    setModalVisible(true);
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
        setFriends(response.data.friends);
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
            Alert.alert("Error", "Authentication token not found. Please login again.");
            return; 
        }
        const response = await removeFriend(token, friendUsername);
        if (response.message === "Friend removed successfully") {
            // Assuming the server sends a response status OK on successful friend removal
            Alert.alert("Success", "Friend successfully removed.");
            setModalVisible(false)
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

  return (
    <View style={{ padding: 20, paddingTop: 60 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'blue',
          }}
          onPress={() => router.navigate("/add-friends")}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>+</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20 }}>Friends</Text>
        <TouchableOpacity
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'gray',
          }}
          onPress={() => router.navigate("/notifications")}
        >
          <Text style={{ fontSize: 20, color: 'white' }}>🔔</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text>{error}</Text>
      ) : friends.length === 0 ? (
        <Text>No friends found</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.username}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text>{item.username}</Text>
              <TouchableOpacity
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'gray',
                }}
                onPress={() => handleCogPress(item.username)}
              >
                <Text>⚙️</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 }}>
            <Text>Remove {selectedFriend}?</Text>
            <TouchableOpacity
              style={{ marginTop: 10, padding: 10, backgroundColor: 'red', borderRadius: 5 }}
              onPress={() => handleRemoveFriend(selectedFriend)}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>Remove</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginTop: 10, padding: 10, backgroundColor: 'gray', borderRadius: 5 }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default FriendsPage;