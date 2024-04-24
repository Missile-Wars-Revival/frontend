import { Text, SafeAreaView } from "react-native";
import React from "react";
import { Link } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Text className="text-2xl text-green-700">Home Page (index)</Text>
      <Link href="/Map" className="text-blue-500">
        Click here for: Map
      </Link>
      <Link href="/friends" className="text-blue-500">
        Click here for: friends
      </Link>
    </SafeAreaView>
  );
}