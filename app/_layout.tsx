import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { ReactNode, createContext, useContext, useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import SplashScreen from './splashscreen'; 
import { FontAwesome } from '@expo/vector-icons';
import { ProximityCheckNotif } from "../components/Notifications/entitynotifications";
import useWebSocket, {  } from "../hooks/api/websockets";
import { WebSocketMessage } from "middle-earth";

interface WebSocketContextProps {
  data: any;
  sendWebsocket: (data: WebSocketMessage) => void;
}

const WebSocketContext = createContext<WebSocketContextProps | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within a WebSocketProvider");
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { data, sendWebsocket } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ data, sendWebsocket }}>
      {children}
    </WebSocketContext.Provider>
  );
};

// RootLayout component
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
      <WebSocketProvider>
        <RootLayoutNav />
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState(pathname); // Initialize with current pathname

  // Update selectedTab when pathname changes
  useEffect(() => {
    setSelectedTab(pathname);
  }, [pathname]);

  const handlePress = (tab: string) => {
    if (selectedTab !== tab) {
      setSelectedTab(tab);
      router.push(tab);
    }
  };

  const getDisplayName = (route: any) => {
    switch(route) {
      case '/': return 'Map';
      case '/store': return 'Store';
      case '/league': return 'Ranking';
      case '/friends': return 'Friends';
      case '/profile': return 'Profile';
      default: return '';
    }
  };

  return (
    //switch commenting to hide ranking pages
    // <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.0)', height: 100, alignItems: 'center' }}>
    //   {['/', '/store','/league', '/friends', '/profile'].map((tab, index) => (
      <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.0)', height: 90, alignItems: 'center' }}>
          {['/', '/store', '/friends', '/profile'].map((tab, index) => (
        <TouchableOpacity 
          key={index}
          onPress={() => handlePress(tab)} 
          disabled={selectedTab === tab}
          style={{ alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'rgba(0, 0, 0, 0.1)', // Adjust opacity here
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10  // Raises the icon slightly
          }}>
            <FontAwesome 
              name={tab === '/' ? 'map' : 
                    tab === '/store' ? 'shopping-basket' : 
                    tab === '/friends' ? 'users' :
                    tab === '/league' ? 'trophy' : 
                    tab === '/profile' ? 'user' : 
                    'user'}
              color={selectedTab === tab ? 'blue' : 'black'} 
              size={24} 
            />
          </View>
          <Text style={{ color: 'grey', fontSize: 10, marginTop: -4}}>
            {getDisplayName(tab)}
          </Text>
        </TouchableOpacity>
      ))}
      <ProximityCheckNotif/>
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
          <Stack.Screen name="league" options={{ headerShown: false, gestureEnabled: false }} />
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