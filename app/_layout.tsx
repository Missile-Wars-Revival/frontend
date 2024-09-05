import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useMemo } from "react";
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
import { AuthProvider } from "../util/Context/authcontext";
import { useNotifications, notificationEmitter } from "../components/Notifications/useNotifications";
import { getselfprofile } from "../api/getprofile";
import { ApiResponse } from "./profile";
import * as SecureStore from "expo-secure-store";
import { AppState, AppStateStatus } from 'react-native';

const NavBarItem = React.memo(({ tab, selectedTab, unreadCount, onPress }: {
  tab: string;
  selectedTab: string;
  unreadCount: number;
  onPress: () => void;
}) => {
  const getDisplayName = useCallback((route: string) => {
    switch (route) {
      case '/': return 'Map';
      case '/store': return 'Store';
      case '/league': return 'League';
      case '/friends': return 'Friends';
      case '/profile': return 'Profile';
      default: return '';
    }
  }, []);

  const iconName = useMemo(() => {
    switch (tab) {
      case '/': return 'map';
      case '/store': return 'shopping-basket';
      case '/league': return 'trophy';
      case '/friends': return 'users';
      case '/profile': return 'user';
      default: return 'user';
    }
  }, [tab]);

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={selectedTab === tab}
      style={styles.navItem}
    >
      <View style={styles.iconContainer}>
        <FontAwesome
          name={iconName}
          color={selectedTab === tab ? 'blue' : 'black'}
          size={24}
        />
        {tab === '/friends' && unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
      <Text style={styles.navText}>
        {getDisplayName(tab)}
      </Text>
    </TouchableOpacity>
  );
});

function NavBar({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState(pathname);

  useEffect(() => {
    setSelectedTab(pathname);
    fetchUserStatistics();
  }, [pathname]);

  const handlePress = useCallback((tab: string) => {
    if (selectedTab !== tab) {
      setSelectedTab(tab);
      router.push(tab);
    }
  }, [selectedTab, router]);

  const fetchUserStatistics = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) throw new Error("Not signed in");
      const response = await getselfprofile() as ApiResponse;
      if (response.success && response.userProfile) {
        await SecureStore.setItem("email", response.userProfile.email);
      } else {
        console.error('Failed to fetch user statistics: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user statistics', error);
    }
  }, []);

  const tabs = useMemo(() => [
    '/', 
    '/store', 
    //'/league', 
    '/friends', 
    '/profile'], []);

  return (
    <View style={styles.navContainer}>
      {tabs.map((tab) => (
        <NavBarItem
          key={tab}
          tab={tab}
          selectedTab={selectedTab}
          unreadCount={unreadCount}
          onPress={() => handlePress(tab)}
        />
      ))}
      <ProximityCheckNotif />
    </View>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.0)',
    height: 90,
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  navText: {
    color: 'grey',
    fontSize: 10,
    marginTop: -4,
  },
  countdownContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
});

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

export default function RootLayout() {
  const queryClient = new QueryClient();
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    Purchases.setDebugLogsEnabled(true);
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: "appl_DhhCcaRAelpsFMqaQCjiKcUWNcR" });
    } else {
      Purchases.configure({ apiKey: "your_android_api_key" });
    }

    let appStateTimeout: NodeJS.Timeout | null = null;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // Clear any existing timeout
        if (appStateTimeout) {
          clearTimeout(appStateTimeout);
        }

        // Set a new timeout
        appStateTimeout = setTimeout(() => {
          // Invalidate all queries
          queryClient.invalidateQueries();

          // Force a re-render of the current route
          if (pathname) {
            router.replace(pathname);
          }

          // Optionally, you can add a full app reload here if the above doesn't solve the issue
          // DevSettings.reload();
        }, 100); // Small delay to ensure the app is fully active
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
      if (appStateTimeout) {
        clearTimeout(appStateTimeout);
      }
    };
  }, [queryClient, router, pathname]);

  const handleSplashFinish = () => {
    setIsSplashVisible(false);
  };

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

function RootLayoutNav() {
  const pathname = usePathname();
  const hideNavBarRoutes = ['/login', '/register', '/add-friends', '/user-profile', '/settings', '/notifications'];
  const { countdownIsActive, stopCountdown } = useCountdown();
  const [unreadCount, setUnreadCount] = useState(0);
  const { unreadCount: initialUnreadCount } = useNotifications();

  useEffect(() => {
    setUnreadCount(initialUnreadCount);

    const handleUnreadCountUpdated = (count: number) => {
      setUnreadCount(count);
    };

    notificationEmitter.on('unreadCountUpdated', handleUnreadCountUpdated);

    return () => {
      notificationEmitter.off('unreadCountUpdated', handleUnreadCountUpdated);
    };
  }, [initialUnreadCount]);

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