import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import SplashScreen from './splashscreen'; 

export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutNav />
    </QueryClientProvider>
  );
}

function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState(pathname);

  const handlePress = (tab: string) => {
    if (selectedTab !== tab) {
      setSelectedTab(tab);
      router.push(tab);
    }
  };

  return (
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'white', height: 60 }}>
      <TouchableOpacity 
        onPress={() => handlePress('/')} 
        disabled={selectedTab === '/'}
      >
        <Text style={{ paddingVertical: 20, color: selectedTab === '/' ? 'blue' : 'black' }}>Map</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handlePress('/store')} 
        disabled={selectedTab === '/store'}
      >
        <Text style={{ paddingVertical: 20, color: selectedTab === '/store' ? 'blue' : 'black' }}>Store</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handlePress('/friends')} 
        disabled={selectedTab === '/friends'}
      >
        <Text style={{ paddingVertical: 20, color: selectedTab === '/friends' ? 'blue' : 'black' }}>Friends</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => handlePress('/profile')} 
        disabled={selectedTab === '/profile'}
      >
        <Text style={{ paddingVertical: 20, color: selectedTab === '/profile' ? 'blue' : 'black' }}>Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

function RootLayoutNav() {
  const pathname = usePathname();
  const hideNavBarRoutes = ['/login', '/register', '/add-friends'];

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="store" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="friends" options={{ headerShown: false }} />
          <Stack.Screen name="add-friends" />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
        </Stack>
        {!hideNavBarRoutes.includes(pathname) && <NavBar />}
      </View>
    </SafeAreaProvider>
  );
}