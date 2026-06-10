import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, StyleSheet, AppStateStatus, AppState, Platform , useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import SplashScreen from './splashscreen';
import useWebSocket from "../hooks/websockets/websockets";
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps , useCountdown } from "../util/Context/countdown";
import CountdownTimer from '../components/countdown';

import { AuthProvider, useAuth } from "../util/Context/authcontext";

import PermissionsCheck from '../components/PermissionsCheck';
import Purchases from 'react-native-purchases';
import AdService from '../util/AdService';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { LandmineProvider } from '../util/Context/landminecontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PermissionsScreen from './PermissionsScreen';
import { OnboardingProvider } from '../util/Context/onboardingContext';
import GameEffectsOverlay from '../components/effects/GameEffectsOverlay';

const WebSocketProvider = ({ children }: WebSocketProviderProps) => {
  const { missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, leaguesData, sendWebsocket } = useWebSocket();

  return (
    <WebSocketContext.Provider value={{ missiledata, landminedata, lootdata, otherdata, healthdata, friendsdata, inventorydata, playerlocations, leaguesData, sendWebsocket }}>
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);
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
        console.error('RevenueCat API key is not set');
        return;
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


  const handleSplashFinish = useCallback((authenticated: boolean) => {
    setIsAuthenticated(authenticated);
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

  return (
    <QueryClientProvider client={queryClient}>
      <CountdownProvider>
        <AuthProvider initialIsSignedIn={isAuthenticated}>
          <OnboardingGate>
            <WebSocketProvider>
              <LandmineProvider>
                <OnboardingProvider>
                  <PermissionsCheck>
                    <RootLayoutNav />
                  </PermissionsCheck>
                </OnboardingProvider>
              </LandmineProvider>
            </WebSocketProvider>
          </OnboardingGate>
        </AuthProvider>
      </CountdownProvider>
    </QueryClientProvider>
  );
}

/**
 * Gates onboarding / permissions behind authentication.
 * If `alreadyLaunchedV3` is missing for a signed-in user, show permissions.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useAuth();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const value = await AsyncStorage.getItem('alreadyLaunchedV3');
      setNeedsOnboarding(value === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
    setOnboardingChecked(true);
  }, []);

  useEffect(() => {
    if (!isSignedIn) {
      setOnboardingChecked(false);
      setNeedsOnboarding(false);
      return;
    }

    // Trigger a fresh read on mount.
    setOnboardingChecked(false);
    checkOnboardingStatus();
  }, [isSignedIn, checkOnboardingStatus]);

  useEffect(() => {
    if (!isSignedIn) return;

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        // Re-check when returning to foreground so manual key resets are reflected.
        checkOnboardingStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isSignedIn, checkOnboardingStatus]);

  const handlePermissionGranted = useCallback(async () => {
    try {
      await AsyncStorage.setItem('alreadyLaunchedV3', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    setNeedsOnboarding(false);
  }, []);

  if (isSignedIn && onboardingChecked && needsOnboarding) {
    return <PermissionsScreen onPermissionGranted={handlePermissionGranted} />;
  }

  return <>{children}</>;
}



function RootLayoutNav() {
  const { countdownIsActive, stopCountdown } = useCountdown();
  const { isSignedIn } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isSignedIn) return;
    AdService.initialize().catch((error) => {
      console.error('Failed to initialize AdService:', error);
    });
  }, [isSignedIn]);

  const backgroundColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor }}>
        {isSignedIn ? (
          <Stack
            initialRouteName="(tabs)"
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
            <Stack.Screen name="PermissionsScreen" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="splashscreen" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <Stack
            initialRouteName="login"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animationTypeForReplace: 'push',
              gestureDirection: 'horizontal',
            }}
          >
            <Stack.Screen
              name="login"
              options={{ headerShown: false, gestureEnabled: false, animation: 'none' }}
            />
          </Stack>
        )}
        {countdownIsActive && (
          <View style={styles.countdownContainer}>
            <CountdownTimer duration={30} onExpire={stopCountdown} />
          </View>
        )}
        {/* One-shot Skia celebrations (missile launch, purchases, …) play above everything. */}
        <GameEffectsOverlay />
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