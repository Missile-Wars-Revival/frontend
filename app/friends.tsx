import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, Modal } from "react-native";
import { router } from "expo-router";
import { useFetchFriends } from "../api/friends";
import { userNAME } from "../temp/login";
import { removeFriend } from "../api/remove-friend";

const fireMissile = (username: string) => {
  //firing missile logic
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage: React.FC = () => {
  const { friends, loading, error } = useFetchFriends(userNAME);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState("");

  const handleCogPress = (username: string) => {
    setSelectedFriend(username);
    setModalVisible(true);
  };

  const handleRemoveFriend = async (friendUsername: string) => {
    try {
      await removeFriend(userNAME, "password", friendUsername);
      console.log(`Friend ${friendUsername} removed successfully`);
      setModalVisible(false);
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  return (
    <View className="p-[20px]">
      <View className="flex-row justify-between mb-[20px]">
        <TouchableOpacity
          className="w-[30px] h-[px] rounded-[15px] flex justify-center items-center bg-blue-400"
          onPress={() => router.navigate("/add-friends")}
        >
          <Text className="text-[20px] leading-none text-white">+</Text>
        </TouchableOpacity>
  
        <TouchableOpacity onPress={() => router.navigate("/notifications")}>
          <Text className="text-[24px]">🔔</Text>
        </TouchableOpacity>
      </View>

      {loading && <Text>Loading...</Text>}
      {error && <Text>{error}</Text>}
      
      {!loading && !error && (
        <FlatList
          data={friends}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <View className="flex-row justify-between items-center p-2.5 border-b border-gray-300">
              <Text>{item.username}</Text>
              <TouchableOpacity
                className="bg-red-500 p-[5px] rounded-[5px]"
                onPress={() => fireMissile(item.username)}
              >
                <Text className="text-white">Fire Missile</Text>
              </TouchableOpacity>
              <TouchableOpacity
  style={{ padding: 5, borderRadius: 5 }}
  onPress={() => handleCogPress(item.username)}
>
  <Text style={{ color: 'white' }}>⚙️</Text>
</TouchableOpacity>
            </View>
          )}
        />
      )}
<Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
    <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10 }}>
      <TouchableOpacity 
        onPress={() => handleRemoveFriend(selectedFriend)} 
        style={{ padding: 15, marginBottom: 10, borderRadius: 8, backgroundColor: 'red' }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Remove Friend</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => setModalVisible(false)} 
        style={{ padding: 15, borderRadius: 8, backgroundColor: 'gray' }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default FriendsPage;
