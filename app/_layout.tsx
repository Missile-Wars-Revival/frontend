import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { useEffect, useState, useCallback } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, StyleSheet, AppStateStatus } from 'react-native';
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
import { AuthProvider } from "../util/Context/authcontext";
import { useNotifications, notificationEmitter } from "../components/Notifications/useNotifications";
import { AppState } from 'react-native';

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

// RootLayout component
export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { fetchNotifications } = useNotifications();

  const configurePurchases = useCallback(async () => {
    try {
      Purchases.setDebugLogsEnabled(true);
      if (Platform.OS === 'ios') {
        await Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE || '' });
      } else if (Platform.OS === 'android') {
        await Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE || '' });
      }
    } catch (error) {
      console.error('Failed to initialize Purchases:', error);
    }
  }, []);

  const [lastAppState, setLastAppState] = useState<AppStateStatus>(AppState.currentState);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (lastAppState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      fetchNotifications();
    }
    setLastAppState(nextAppState);
  };

  useEffect(() => {
    configurePurchases();
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [lastAppState]);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <CountdownProvider>
        <WebSocketProvider>
          <RootLayoutNav />
        </WebSocketProvider>
      </CountdownProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function NavBar({ unreadCount }: { unreadCount: number }) {
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
    //switch commenting to hide ranking page
    <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255, 255, 255, 0.0)', height: 90, alignItems: 'center' }}>
      {[
        '/', 
      '/store', 
      //'/league', 
      '/friends', 
      '/profile'
    ].map((tab, index) => (
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
            {tab === '/friends' && unreadCount > 0 && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: 'red',
                borderRadius: 10,
                width: 20,
                height: 20,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontSize: 12 }}>{unreadCount}</Text>
              </View>
            )}
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
  const [unreadCount, setUnreadCount] = useState(0);
  const { unreadCount: initialUnreadCount, fetchNotifications } = useNotifications();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);

    const handleUnreadCountUpdated = (count: number) => {
      setUnreadCount(count);
    };

    notificationEmitter.on('unreadCountUpdated', handleUnreadCountUpdated);

    // Set up interval to check for notifications every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // 30 seconds

    // Check for notifications when the app comes to the foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchNotifications();
      }
    });

    return () => {
      notificationEmitter.off('unreadCountUpdated', handleUnreadCountUpdated);
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [initialUnreadCount, fetchNotifications]);

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
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
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
        {!hideNavBarRoutes.includes(pathname) && <NavBar unreadCount={unreadCount} />}
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