import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, StyleSheet, AppStateStatus, AppState, Platform } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import SplashScreen from './splashscreen';
import useWebSocket from "../hooks/websockets/websockets";
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps } from "../util/Context/countdown";
import CountdownTimer from '../components/countdown';
import { useCountdown } from '../util/Context/countdown';
import { AuthProvider } from "../util/Context/authcontext";
import { useNotifications } from "../components/Notifications/useNotifications";
import { useColorScheme } from 'react-native';
import PermissionsCheck from '../components/PermissionsCheck';
import Purchases from 'react-native-purchases';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { LandmineProvider } from '../util/Context/landminecontext';
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



function RootLayoutNav() {
  const { countdownIsActive, stopCountdown } = useCountdown();
  const colorScheme = useColorScheme();

  const backgroundColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor }}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false,
            animationTypeForReplace: 'push',
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="login"
            options={{ headerShown: false, gestureEnabled: false, animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="register" options={{ headerShown: false, gestureEnabled: true }} />
          <Stack.Screen name="PermissionsScreen" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
          <Stack.Screen name="splashscreen" options={{ headerShown: false }} />
        </Stack>
        {countdownIsActive && (
          <View style={styles.countdownContainer}>
            <CountdownTimer duration={30} onExpire={stopCountdown} />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  countdownContainer: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
});