import { Stack } from "expo-router";
import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, Text, TouchableOpacity, StyleSheet, AppStateStatus, AppState } from 'react-native';
import { useRouter, usePathname, useRootNavigationState } from 'expo-router';
import SplashScreen from './splashscreen';
import { FontAwesome } from '@expo/vector-icons';
import useWebSocket, { } from "../hooks/websockets/websockets"; 
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps } from "../util/Context/countdown";
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import CountdownTimer from '../components/countdown';
import { useCountdown } from '../util/Context/countdown';
import { AuthProvider } from "../util/Context/authcontext";
import { useNotifications, notificationEmitter } from "../components/Notifications/useNotifications";
import { useColorScheme } from 'react-native';

const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { data, missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ data, missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, sendWebsocket }}>
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
  const [lastActiveTime, setLastActiveTime] = useState(Date.now());
  const BACKGROUND_THRESHOLD = 2 * 60 * 1000; // 5 minutes in milliseconds
  const { fetchNotifications } = useNotifications();

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

  const isConfigured = useRef(false);

  useEffect(() => {
    if (!isConfigured.current) {
      console.log('Calling configurePurchases...');
      configurePurchases();
      isConfigured.current = true;
    }
  }, []);

  const [appState, setAppState] = useState(AppState.currentState);

  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    const now = Date.now();
    if (nextAppState === 'active') {
      // App has come to the foreground
      if (now - lastActiveTime > BACKGROUND_THRESHOLD) {
        setIsSplashVisible(true); // Show splash screen if inactive for more than threshold
      }
      fetchNotifications();
      setLastActiveTime(now);
    } else if (nextAppState === 'background') {
      // App is going to the background
      setLastActiveTime(now);
    }
    setAppState(nextAppState);
  }, [appState, fetchNotifications, lastActiveTime]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [appState]);

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
  const [selectedTab, setSelectedTab] = useState(pathname);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Update selectedTab when pathname changes
  useEffect(() => {
    setSelectedTab(pathname);
  }, [pathname]);

  useEffect(() => {
    if (pathname === '/notifications' || pathname === '/add-friends') {
      setSelectedTab('/friends');
    } else if (pathname === '/settings') {
      setSelectedTab('/profile');
    } else {
      setSelectedTab(pathname);
    }
  }, [pathname]);

  useEffect(() => {
    //if (pathname === '/league' || pathname === '/settings') {
    if (pathname === '/settings') {
      setSelectedTab('/profile');
    } else {
      setSelectedTab(pathname);
    }
  }, [pathname]);

  const handlePress = (tab: string) => {
    if (selectedTab !== tab) {
      setSelectedTab(tab);
      router.navigate(tab);
    }
  };

  const getDisplayName = (route: any) => {
    switch (route) {
      case '/': return 'Map';
      case '/store': return 'Store';
      case '/league': return 'Ranking';
      case '/msg': return 'Messages';
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
        //'/league', 
        '/friends',
        '/msg', 
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
                        tab === '/msg' ? 'comment' :
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
  const hideNavBarRoutes = ['/login', '/register', '/add-friends'];
  const { countdownIsActive, stopCountdown } = useCountdown();
  const [unreadCount, setUnreadCount] = useState(0);
  const { unreadCount: initialUnreadCount, fetchNotifications } = useNotifications();
  const colorScheme = useColorScheme();
  const navigationState = useRootNavigationState();

  const backgroundColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

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
          {/* <Stack.Screen name="msg" options={{ headerShown: false }} /> */}
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
        {!hideNavBarRoutes.includes(pathname) && <NavBar unreadCount={unreadCount} />}
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
