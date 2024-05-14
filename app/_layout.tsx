import { Stack } from "expo-router";
import React, { createContext } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import useWebhook from "../hooks/api/webhook";


export const SocketContext = createContext('websocket');


export default function RootLayout() {
  const queryClient = new QueryClient();
  const data = useWebhook();
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
