import { Stack } from 'expo-router';
import React from 'react';

export default function FriendsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Sub-screens slide in from the right; popping with router.back()
        // reverses the same animation back out to the right.
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="add-friends" />
      <Stack.Screen name="msg" />
      <Stack.Screen name="user-profile" />
    </Stack>
  );
}
