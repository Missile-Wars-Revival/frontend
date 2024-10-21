import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, StyleSheet, AppStateStatus, AppState, Platform } from 'react-native';
import { useRouter, usePathname, useRootNavigationState, Stack } from 'expo-router';
import SplashScreen from './splashscreen';
import { FontAwesome } from '@expo/vector-icons';
import useWebSocket, { } from "../hooks/websockets/websockets";
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps } from "../util/Context/countdown";
import CountdownTimer from '../components/countdown';
import { useCountdown } from '../util/Context/countdown';
import { AuthProvider } from "../util/Context/authcontext";
import { useNotifications, notificationEmitter } from "../components/Notifications/useNotifications";
import { useColorScheme } from 'react-native';
import { Notification } from "./notifications";
import PermissionsCheck from '../components/PermissionsCheck';
import Purchases from 'react-native-purchases';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { LandmineProvider } from '../util/Context/landminecontext';
import { getCurrentLocation, getlocation } from '../util/locationreq';
import { WebSocketMessage, WSMsg } from 'middle-earth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PermissionsScreen from './PermissionsScreen';
import { OnboardingProvider } from '../util/Context/onboardingContext';

const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { data, missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, leaguesData, sendWebsocket } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ data, missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, leaguesData, sendWebsocket }}>
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
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const router = useRouter();
  const BACKGROUND_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds

  const configurePurchases = useCallback(async () => {
    try {
      console.log('Configuring RevenueCat...');
      Purchases.setDebugLogsEnabled(true); // Enable debug logs

      let apiKey;
      if (Platform.OS === 'ios') {
        apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_APPLE; // iOS API Key
      } else if (Platform.OS === 'android') {
        apiKey = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_GOOGLE; // Android API Key
      }

      if (!apiKey) {
        throw new Error('RevenueCat API key is not set'); // Error if API key is missing
      }

      await Purchases.configure({ apiKey }); // Configure Purchases
      console.log('RevenueCat configured successfully');

      const customerInfo = await Purchases.getCustomerInfo(); // Fetch customer info
      // console.log('Customer Info:', customerInfo); // Uncomment for debugging

    } catch (error) {
      console.error('Failed to initialize Purchases:', error); // Log initialization errors
    }
  }, []);

  const checkAdFreeStatus = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const adFreeStatus = customerInfo.entitlements.active['ad_free'] !== undefined;
      console.log('Ad-free status:', adFreeStatus);
      await AsyncStorage.setItem('isAdFree', JSON.stringify(adFreeStatus));
    } catch (error) {
      console.error('Error checking ad-free status:', error);
    }
  };

  const isConfigured = useRef(false);

  useEffect(() => {
    if (!isConfigured.current) {
      console.log('Calling configurePurchases...');
      configurePurchases();
      checkAdFreeStatus();
      isConfigured.current = true;
    }
  }, []);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const value = await AsyncStorage.getItem('alreadyLaunched');
        if (value === null) {
          await AsyncStorage.setItem('alreadyLaunched', 'true');
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        console.error('Error checking first launch:', error);
      }
    };

    checkFirstLaunch();
  }, []);

  const handlePermissionGranted = useCallback(() => {
    setIsFirstLaunch(false);
  }, []);

  const handleSplashFinish = useCallback(() => {
    setIsSplashVisible(false);
  }, []);

  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    const now = Date.now();
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (now - lastActiveTime > BACKGROUND_THRESHOLD) {
        // App was in background for more than 2 minutes
        console.log('App was in background for more than 2 minutes, reloading...');

        // Show splash screen
        await ExpoSplashScreen.preventAutoHideAsync();

        // Reset the app state
        setIsSplashVisible(true);

        // Clear any existing state or caches if necessary
        // For example: queryClient.clear();

        // Navigate to the splash screen
        router.replace('/');

        // Simulate a delay for the splash screen
        setTimeout(async () => {
          await ExpoSplashScreen.hideAsync();
          setIsSplashVisible(false);
        }, 2000); // 2 seconds delay
      } else {
        // App was in background for less than 2 minutes
        console.log('App was in background for less than 2 minutes');
      }
      setLastActiveTime(now);
    } else if (nextAppState.match(/inactive|background/)) {
      // App is going to the background
      setLastActiveTime(now);
    }
    setAppState(nextAppState);
  }, [appState, lastActiveTime, router]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  if (isSplashVisible) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (isFirstLaunch) {
    return <PermissionsScreen onPermissionGranted={handlePermissionGranted} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CountdownProvider>
        <AuthProvider>
          <WebSocketProvider>
            <LandmineProvider>
              <OnboardingProvider>
                <PermissionsCheck>
                  <RootLayoutNav />
                </PermissionsCheck>
              </OnboardingProvider>
            </LandmineProvider>
          </WebSocketProvider>
        </AuthProvider>
      </CountdownProvider>
    </QueryClientProvider>
  );
}

function NavBar({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedTab, setSelectedTab] = useState(pathname);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { sendWebsocket } = useWebSocket();

  const lastUpdateTimeRef = useRef<number>(0);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateAndSendLocation = useCallback(async () => {
    const now = Date.now();
    if (now - lastUpdateTimeRef.current < 25000) {  // Prevent updates more frequent than every 25 seconds
      // console.log('Skipping update, too soon since last update');
      return;
    }

    try {
      const newLocation = await getCurrentLocation();
      getlocation();
      if (newLocation) {
        const locationData = {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude
        };

        const locationMsg = new WSMsg("playerLocation", locationData);
        const message = new WebSocketMessage([locationMsg]);
        sendWebsocket(message);
        // console.log('Location sent');

        lastUpdateTimeRef.current = now;
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [sendWebsocket]);

  useEffect(() => {
    // Initial update
    updateAndSendLocation();

    // Set up interval for repeated updates
    updateIntervalRef.current = setInterval(updateAndSendLocation, 30000); // 30 seconds

    // Cleanup function
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, [updateAndSendLocation]);

  const getTabForPath = useMemo(() => (path: string) => {
    if (path === '/notifications' || path === '/add-friends' || path === '/msg') {
      return '/friends';
    } else if (path === '/settings') {
      return '/profile';
    } else if (['/store', '/friends', '/profile', '/league'].includes(path)) {
      return path;
    } else {
      return '/';
    }
  }, []);

  useEffect(() => {
    const newTab = getTabForPath(pathname);
    setSelectedTab(newTab);
  }, [pathname, getTabForPath]);

  const handlePress = (tab: string) => {
    if (getTabForPath(pathname) !== tab) {
      router.navigate(tab);
    }
  };

  const { notifications } = useNotifications();
  const [countdownActive, setCountdownActive] = useState(false);
  const { countdownIsActive, startCountdown, stopCountdown } = useCountdown();
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [countdownStartTime, setCountdownStartTime] = useState<Date | null>(null);

  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    const checkRecentDamageNotifications = () => {
      const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
      const recentDamageNotification = localNotifications.find(
        (notification) =>
          (notification.title === 'Missile Damage!' || notification.title === 'Landmine Damage!') &&
          new Date(notification.timestamp) > twoMinutesAgo
      );

      if (recentDamageNotification && !countdownActive) {
        console.log('Starting countdown for notification:', recentDamageNotification);
        setCountdownStartTime(new Date(recentDamageNotification.timestamp));
        startCountdown();
        setCountdownActive(true);
      } else if (!recentDamageNotification && countdownActive) {
        console.log('Stopping countdown');
        setCountdownStartTime(null);
        stopCountdown();
        setCountdownActive(false);
      }
    };

    checkRecentDamageNotifications();

    const intervalId = setInterval(checkRecentDamageNotifications, 5000); // Check every 5 seconds

    return () => clearInterval(intervalId);
  }, [localNotifications, countdownActive, startCountdown, stopCountdown]);

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
    <View style={[
      styles.navBar,
      isDarkMode && styles.navBarDark
    ]}>
      {[
        '/',
        '/store',
        '/league',
        '/friends',
        '/profile'
      ].map((tab, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => handlePress(tab)}
          disabled={selectedTab === tab}
          style={styles.tabButton}
        >
          <View style={[
            styles.iconContainer,
            isDarkMode && styles.iconContainerDark,
            selectedTab === tab && (isDarkMode ? styles.selectedIconContainerDark : styles.selectedIconContainer)
          ]}>
            <FontAwesome
              name={tab === '/' ? 'map' :
                tab === '/store' ? 'shopping-basket' :
                  tab === '/friends' ? 'users' :
                    tab === '/league' ? 'trophy' :
                      tab === '/profile' ? 'user' :
                        'user'}
              color={selectedTab === tab ? (isDarkMode ? '#4CAF50' : 'blue') : (isDarkMode ? '#B0B0B0' : 'black')}
              size={24}
            />
            {tab === '/friends' && unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={[
            styles.tabText,
            isDarkMode && styles.tabTextDark,
            selectedTab === tab && (isDarkMode ? styles.selectedTabTextDark : styles.selectedTabText)
          ]}>
            {getDisplayName(tab)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}


function RootLayoutNav() {
  const pathname = usePathname();
  const router = useRouter();
  const hideNavBarRoutes = ['/login', '/register', '/user-profile', '/PermissionsScreen', '/splashscreen'];
  const { countdownIsActive, stopCountdown } = useCountdown();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const { unreadCount: initialUnreadCount, unreadChatCount: initialUnreadChatCount, fetchNotifications } = useNotifications();
  const colorScheme = useColorScheme();
  const navigationState = useRootNavigationState();

  const backgroundColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  useEffect(() => {
    setUnreadCount(initialUnreadCount);
    setUnreadChatCount(initialUnreadChatCount);

    const handleUnreadCountUpdated = ({ count, chatCount }: { count: number, chatCount: number }) => {
      setUnreadCount(count);
      setUnreadChatCount(chatCount);
    };

    notificationEmitter.on('unreadCountUpdated', handleUnreadCountUpdated);

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // Fetch every 30 seconds

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
  }, [initialUnreadCount, initialUnreadChatCount, fetchNotifications]);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor }}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animationTypeForReplace: 'push',
            customAnimationOnGesture: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen
            name="index"
            options={{
              animation: navigationState?.routes[navigationState?.index ?? 0 - 1]?.name === 'store' || 'league' || 'friends' || 'notificaitons' || 'add-friends' || 'profile' || 'user-profile' || 'settings'
                ? 'slide_from_left'
                : 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="login"
            options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: true }} />
          <Stack.Screen name="PermissionsScreen" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="msg" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="store" options={{ headerShown: false }} />
          <Stack.Screen name="league" options={{ headerShown: false }} />
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
        {!hideNavBarRoutes.includes(pathname) && <NavBar unreadCount={unreadCount + unreadChatCount} />}
      </View>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  navBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f2f5',
    height: 100,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navBarDark: {
    backgroundColor: '#1E1E1E',
    borderTopColor: '#3D3D3D',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  iconContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  selectedIconContainer: {
    backgroundColor: '#e6f7ff',
  },
  selectedIconContainerDark: {
    backgroundColor: '#3D3D3D',
  },
  tabText: {
    color: '#666',
    fontSize: 12,
  },
  tabTextDark: {
    color: '#B0B0B0',
  },
  selectedTabText: {
    color: 'blue',
  },
  selectedTabTextDark: {
    color: '#4CAF50',
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
  countdownContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
});