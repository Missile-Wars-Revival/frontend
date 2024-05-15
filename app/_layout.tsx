import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { createContext } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import useWebSocket from "../hooks/api/websocket";


export const SocketContext = createContext('websocket');


export default function RootLayout() {
  const queryClient = new QueryClient();
  const data = useWebSocket();
  return (
    <QueryClientProvider client={queryClient}>
      <SocketContext.Provider value={data}>
        <RootLayoutNav />
      </SocketContext.Provider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {

  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="map" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="add-friends" />
      </Stack>
    </SafeAreaProvider>
  );
}
