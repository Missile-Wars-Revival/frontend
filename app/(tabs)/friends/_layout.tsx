import { Stack } from 'expo-router';
import React from 'react';

export default function FriendsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="add-friends" />
      <Stack.Screen name="msg" />
    </Stack>
  );
}