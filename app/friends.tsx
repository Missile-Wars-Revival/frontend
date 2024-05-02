import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";
import { useFetchFriends } from "../api/friends"
import { userNAME } from "../temp/login"

const fireMissile = (username: string) => {
  //firing missile logic
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage: React.FC = () => {
  const { friends, loading, error } = useFetchFriends(userNAME);

  // Always display the bell icon and plus button
  return (
    <View className="p-[20px]">
      <View className="flex-row justify-between mb-[20px]">
        {/* Plus button */}
        <TouchableOpacity
          className="w-[30px] h-[px] rounded-[15px] flex justify-center items-center bg-blue-400"
          onPress={() => router.navigate("/add-friends")}
        >
          <Text className="text-[20px] leading-none text-white">+</Text>
        </TouchableOpacity>
  
        {/* Bell icon with navigation */}
        <TouchableOpacity onPress={() => router.navigate("/notifications")}>
          <Text className="text-[24px]">🔔</Text>
        </TouchableOpacity>
      </View>

      {/* Display loading text if loading */}
      {loading && <Text>Loading...</Text>}

      {/* Display error text if error */}
      {error && <Text>{error}</Text>}

      {/* Display friends list if no loading or error */}
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
            </View>
          )}
        />
      )}
    </View>
  );
};

export default FriendsPage;
