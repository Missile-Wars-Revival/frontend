import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { createContext, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import useWebSocket, { sendWebsocket } from "../hooks/api/websocket";
import * as Location from "expo-location";
import { Types } from "middle-earth";



export const webSocketContext = createContext(null);
export const locationContext = createContext(null);

export default function RootLayout() {

  let [location, setLocation] = useState<Types.GeoLocation>({lat: 0, lon: 0});


  const queryClient = new QueryClient();
  const data = useWebSocket();
  console.log("hi");
  const updateLocation = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
    console.log("Updating location");
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          reject("Permission to access location was denied");
        }

        Location.getCurrentPositionAsync({}).then((location_res) => {
          setLocation({
              lat: location_res.coords.latitude,
              lon: location_res.coords.longitude
          })
          console.log("Location updated", location);
          const msg: Types.WebSocketMsg = {
              messages: [location]
          }
          sendWebsocket(msg).then(() => resolve()).catch((error) => reject(error));
        }).catch((error) => {
          console.error(error);
          reject(error);
        });
    });
  };
  useEffect(() => {

    const interval = setInterval(updateLocation, 2000);
    return () => clearInterval(interval);
  }, [RootLayout, useState]);
  
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
