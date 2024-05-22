import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { createContext, useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import useWebSocket, { updateLocation } from "../hooks/api/websocket";


export const webSocketContext = createContext(null);

export default function RootLayout() {

  const queryClient = new QueryClient();
  const data = useWebSocket();
  console.log("hi");

  useEffect(() => {

    const interval = setInterval(updateLocation, 2000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <webSocketContext.Provider value={data}>
        <RootLayoutNav />
      </webSocketContext.Provider>
    </QueryClientProvider>
  );
}

function RootLayoutNav() {
  
  return (
    <SafeAreaProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="map" />
        <Stack.Screen name="friends" />
        <Stack.Screen name="add-friends" />
      </Stack>
    </SafeAreaProvider>
  );
}
