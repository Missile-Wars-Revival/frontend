import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Friend } from "../types/types";

const fireMissile = (username: string) => {
  //fireing missile logic
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([
    //fetch friends from backend for user
    { username: "Alice" },
    { username: "Bob" },
    { username: "Charlie" },
  ]);

  const navigation = useNavigation();

  const navigateToAddFriends = () => {
    navigation.navigate("addfriends" as never); // Navigate to 'AddFriends' page
  };
  return (
    <View className="p-[20px]">
      <View className="flex-row justify-between mb-[20px]">
        {/* Plus button */}
        <TouchableOpacity
          className="w-[30px] h-[30px] rounded-[15px] flex justify-center items-center bg-blue-400"
          onPress={navigateToAddFriends}
        >
          <Text className="text-[20px] leading-none text-white">+</Text>
        </TouchableOpacity>

        {/* Bell icon */}
        <TouchableOpacity>
          <Text className="text-[24px]">🔔</Text>
        </TouchableOpacity>
      </View>

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
          </View>
        )}
      />
    </View>
  );
};

export default FriendsPage;
