import { Text, SafeAreaView } from "react-native";
import React from "react";
import { Link } from "expo-router";

export default function Index() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center">
      <Text className="text-2xl text-green-700">Index</Text>
      <Text>Welcome to Missile Wars</Text>
      <Text>Let the Missles fly!</Text>
      <Text> </Text>
      <Text> </Text>
      <Link href="/login" className="text-blue-500">
        Login Page
      </Link>
      <Link href="/map" className="text-blue-500">
        Map Page
      </Link>
      <Link href="/friends" className="text-blue-500">
        Friends Page
      </Link>
      <Link href="/register" className="text-blue-500">
        Click here for: register
      </Link>
    </SafeAreaView>
  );
}
