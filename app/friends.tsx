import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { useRouter } from "expo-router";
import { getCredentials } from "../util/logincache";

const fireMissile = (username: string) => {
  // Placeholder for firing missile logic
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage: React.FC = () => {
  const [userNAME, setUsername] = useState("");
  const friends: ArrayLike<any> | null | undefined = []; // Placeholder for friends list
  const loading = false; // Placeholder for loading state
  const error = null; // Placeholder for error state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");
  const router = useRouter();

  // Fetch username from secure storage
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

  const handleCogPress = (friendUsername: string) => {
    setSelectedFriend(friendUsername);
    setModalVisible(true);
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    // Placeholder for remove friend logic
    console.log(`Friend ${friendUsername} removed successfully`);
    setModalVisible(false);
    // try {
    //   await removeFriend(userNAME, "password", friendUsername);
    //   console.log(`Friend ${friendUsername} removed successfully`);
    //   setModalVisible(false);
    // } catch (error) {
    //   console.error("Error removing friend:", error);
    // }
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
        <Text>Error loading friends</Text>
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
