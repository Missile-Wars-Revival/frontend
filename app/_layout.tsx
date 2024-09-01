import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import SplashScreen from './splashscreen';
import { FontAwesome } from '@expo/vector-icons';
import { ProximityCheckNotif } from "../components/Collision/collision";
import useWebSocket, { } from "../hooks/websockets/websockets"; 
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps } from "../util/Context/countdown";
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import CountdownTimer from '../components/countdown';
import { useCountdown } from '../util/Context/countdown';

// RootLayout component
export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Configuration or other code that should run on component mount
    Purchases.setDebugLogsEnabled(true);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: "appl_DhhCcaRAelpsFMqaQCjiKcUWNcR" });
    } else {
      Purchases.configure({ apiKey: "your_android_api_key" });
    }
  }, []);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
    const { data, missiledata, landminedata, lootdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket } = useWebSocket();

    return (
      <WebSocketContext.Provider value={{ data, missiledata, landminedata, lootdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket }}>
        {children}
      </WebSocketContext.Provider>
    );
  };

  const CountdownProvider: React.FC<CountdownProviderProps> = ({ children }) => {
    const [countdownIsActive, setCountdownIsActive] = useState(false);

    const startCountdown = () => setCountdownIsActive(true);
    const stopCountdown = () => setCountdownIsActive(false);

    return (
      <CountdownContext.Provider value={{ countdownIsActive, startCountdown, stopCountdown }}>
        {children}
      </CountdownContext.Provider>
    );
  };


  return (
    <QueryClientProvider client={queryClient}>
      <CountdownProvider>
        <WebSocketProvider>
          <RootLayoutNav />
        </WebSocketProvider>
      </CountdownProvider>
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
    switch (route) {
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
    //<View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.0)', height: 100, alignItems: 'center' }}>
    //   {['/', '/store','/league', '/friends', '/profile'].map((tab, index) => (
    // 
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
            backgroundColor: 'rgba(0, 0, 0, 0.1)', 
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10  
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
          <Text style={{ color: 'grey', fontSize: 10, marginTop: -4 }}>
            {getDisplayName(tab)}
          </Text>
        </TouchableOpacity>
      ))}
      <ProximityCheckNotif />
    </View>
  );
}


function RootLayoutNav() {
  const pathname = usePathname();
  const hideNavBarRoutes = ['/login', '/register', '/add-friends'];
  const { countdownIsActive, stopCountdown } = useCountdown();

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: true }} />
          <Stack.Screen name="league" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="store" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="friends" options={{ headerShown: false }} />
          <Stack.Screen name="add-friends" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="user-profile" options={{ headerShown: false }} />
          <Stack.Screen name="settings" options={{ headerShown: false }} />
        </Stack>
        {countdownIsActive && (
          <View style={styles.countdownContainer}>
            <CountdownTimer duration={30} onExpire={stopCountdown} />
          </View>
        )}
        {!hideNavBarRoutes.includes(pathname) && <NavBar />}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  countdownContainer: {
    position: 'absolute',
    bottom: 90, // Adjust this value based on your navbar height
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000, // Ensure it's above other components
  },
});