import 'react-native-reanimated';
import React, { useEffect, useState, useCallback, useRef } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { View, StyleSheet, AppStateStatus, AppState, DeviceEventEmitter, Platform , useColorScheme } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import SplashScreen from './splashscreen';
import useWebSocket from "../hooks/websockets/websockets";
import { WebSocketContext, WebSocketProviderProps } from "../util/Context/websocket";
import { CountdownContext, CountdownProviderProps , useCountdown } from "../util/Context/countdown";
import CountdownTimer from '../components/countdown';

import { APP_RELAUNCH_EVENT, AuthProvider, useAuth } from "../util/Context/authcontext";

import PermissionsCheck from '../components/PermissionsCheck';
import Purchases from 'react-native-purchases';
import AdService from '../util/AdService';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { LandmineProvider } from '../util/Context/landminecontext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PermissionsScreen } from './PermissionsScreen';
import { OnboardingProvider } from '../util/Context/onboardingContext';
import GameEffectsOverlay from '../components/effects/GameEffectsOverlay';
import { registerAndSyncPushToken } from '../components/Notifications/registerPushToken';
import { getSecureItemSafely, setBackgroundAccessibleItem } from '../util/secure-store';
import * as SecureStore from 'expo-secure-store';
import ServerSelectScreen from '../components/ServerSelectScreen';
import UsernameClaimScreen from '../components/UsernameClaimScreen';
import { getMyProfileUsername, waitForFirebaseUser } from '../api/account';
import {
  confirmServerSession,
  hydrateSelectedServer,
  isServerSessionConfirmed,
} from '../api/server-discovery';
// Imported for its side effect too: TaskManager.defineTask must run in module
// scope so the task exists when the OS launches the app headless.
import {
  registerBackgroundLocationTask,
  unregisterBackgroundLocationTask,
} from '../util/background-location-task';

const BACKGROUND_THRESHOLD = 2 * 60 * 1000; // 2 minutes in milliseconds

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
  const [appState, setAppState] = useState(AppState.currentState);
  const [lastActiveTime, setLastActiveTime] = useState(() => Date.now());
  const router = useRouter();

  // The persisted game-server choice must be loaded before anything talks to
  // the backend — the websocket provider connects as soon as auth resolves,
  // and axios resolves its baseURL per request. Gate the whole shell on it
  // (native splash is still covering the screen at this point).
  const [serverHydrated, setServerHydrated] = useState(false);
  useEffect(() => {
    hydrateSelectedServer().finally(() => setServerHydrated(true));
  }, []);

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

      await Purchases.getCustomerInfo();

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
  }, [configurePurchases]);


  // AuthProvider derives the signed-in state from AsyncStorage on its own, so
  // the splash result is only the cue to reveal the app shell.
  const handleSplashFinish = useCallback((_authenticated: boolean) => {
    setIsSplashVisible(false);
  }, []);

  // Sign-out restarts the app shell: showing the splash unmounts everything
  // below the websocket provider, so OnboardingGate re-checks
  // `alreadyLaunchedV3` (cleared on logout) and the user sees
  // splash → onboarding → login, never onboarding after login.
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(APP_RELAUNCH_EVENT, () => {
      setIsSplashVisible(true);
    });
    return () => subscription.remove();
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

  // Native splash still covers the screen during this one-frame gap.
  if (!serverHydrated) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CountdownProvider>
        {/* Auth + websocket sit above the splash gate so a returning user's
            connection is established while the splash plays — by the time the
            map mounts the first game-state payload has usually landed. The
            ConnectingScreen then only matters for fresh logins, which happen
            after the splash. The websocket hook only connects once
            AuthProvider resolves `isSignedIn`, so logged-out users cost
            nothing here. */}
        <AuthProvider>
          <WebSocketProvider>
            {isSplashVisible ? (
              <SplashScreen onFinish={handleSplashFinish} />
            ) : (
              <OnboardingGate>
                <LandmineProvider>
                  <OnboardingProvider>
                    <PermissionsCheck>
                      <RootLayoutNav />
                    </PermissionsCheck>
                  </OnboardingProvider>
                </LandmineProvider>
              </OnboardingGate>
            )}
          </WebSocketProvider>
        </AuthProvider>
      </CountdownProvider>
    </QueryClientProvider>
  );
}

/**
 * Gates onboarding / permissions before login.
 * If `alreadyLaunchedV3` is missing, show the intro slides first.
 */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const [alreadyLaunched, signedIn] = await Promise.all([
        AsyncStorage.getItem('alreadyLaunchedV3'),
        AsyncStorage.getItem('signedIn'),
      ]);
      // Onboarding only ever runs before login; a signed-in user must never
      // see it (the flag is re-cleared on logout, which relaunches the shell).
      setNeedsOnboarding(alreadyLaunched === null && signedIn !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
    setOnboardingChecked(true);
  }, []);

  useEffect(() => {
    // checkOnboardingStatus awaits AsyncStorage before any setState, so the
    // updates are async (not a synchronous cascading render) and safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkOnboardingStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkOnboardingStatus]);

  const handlePermissionGranted = useCallback(async () => {
    try {
      await AsyncStorage.setItem('alreadyLaunchedV3', 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
    setNeedsOnboarding(false);
  }, []);

  if (!onboardingChecked) {
    return <View style={styles.onboardingPlaceholder} />;
  }

  if (needsOnboarding) {
    return <PermissionsScreen onPermissionGranted={handlePermissionGranted} />;
  }

  return <>{children}</>;
}



/**
 * Phases 7-8 (DISTRIBUTED_HOSTING_PLAN.md): in distributed mode, a signed-in
 * player must (a) have a centrally claimed game username and (b) confirm
 * which server to play on — once per app session — before the gameplay shell
 * mounts and the websocket connects. Sessions that cannot use the coordinator
 * (no coordinator configured, the dev offline token, or a legacy shard-local
 * account without a Firebase identity) are auto-confirmed and keep the
 * previous behavior.
 */
function ServerSessionGate({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<'checking' | 'claim' | 'select' | 'ready'>(
    isServerSessionConfirmed() ? 'ready' : 'checking'
  );

  useEffect(() => {
    if (phase !== 'checking') return;
    let cancelled = false;
    (async () => {
      let next: 'claim' | 'select' | 'ready' = 'ready';
      try {
        const [token, firebaseUID] = await Promise.all([
          getSecureItemSafely('token'),
          getSecureItemSafely('firebaseUID'),
        ]);
        if (token !== 'dev-offline-token' && !!firebaseUID) {
          next = 'select';
          // Phase 8: accounts get their game username from Firebase central.
          // No username yet (first OAuth sign-in, or an email registration
          // whose claim raced) → ask before the server selector. Errors
          // (offline, no Firebase session) fall through to the selector,
          // which has its own fallbacks — never trap an existing user here.
          try {
            if (await waitForFirebaseUser()) {
              const username = await getMyProfileUsername();
              if (username) {
                await SecureStore.setItemAsync('username', username);
              } else {
                next = 'claim';
              }
            }
          } catch (profileError) {
            console.error('Profile username check failed:', profileError);
          }
        }
      } catch (error) {
        console.error('Server-session check failed:', error);
      }
      if (cancelled) return;
      if (next === 'ready') confirmServerSession();
      setPhase(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase]);

  if (phase === 'ready') return <>{children}</>;
  if (phase === 'claim') {
    return <UsernameClaimScreen onDone={() => setPhase('select')} />;
  }
  if (phase === 'select') {
    return <ServerSelectScreen onDone={() => setPhase('ready')} />;
  }
  // Brief async-storage/profile read; visually still the app background.
  return <View style={styles.onboardingPlaceholder} />;
}

function RootLayoutNav() {
  const { countdownIsActive, stopCountdown } = useCountdown();
  const { isSignedIn, isAuthReady } = useAuth();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (!isAuthReady || !isSignedIn) return;
    AdService.initialize().catch((error) => {
      console.error('Failed to initialize AdService:', error);
    });
  }, [isAuthReady, isSignedIn]);

  // Re-register the Expo push token every signed-in session. Login sends it
  // too, but the token is often unavailable at that moment (async fetch or
  // permission granted later), and the backend wipes tokens it deems invalid —
  // this is the recovery path. Silent: never prompts for permission here.
  useEffect(() => {
    if (!isAuthReady || !isSignedIn) return;
    registerAndSyncPushToken().then((result) => {
      console.log('Push token sync:', result.status);
    }).catch((error) => {
      console.error('Failed to sync push token:', error);
    });
  }, [isAuthReady, isSignedIn]);

  useEffect(() => {
    if (!isAuthReady || !isSignedIn || AppState.currentState !== 'active') return;
    (async () => {
      const [token, firebaseUID] = await Promise.all([
        getSecureItemSafely('token'),
        getSecureItemSafely('firebaseUID'),
      ]);
      if (token) await setBackgroundAccessibleItem('token', token);
      if (firebaseUID) await setBackgroundAccessibleItem('firebaseUID', firebaseUID);
    })().catch((error) => {
      console.error('Failed to migrate secure credentials:', error);
    });
  }, [isAuthReady, isSignedIn]);

  // Periodic background location dispatch so the backend has a fresh position
  // for missile/landmine placement even while the app is backgrounded. The
  // task itself no-ops unless background location permission is granted.
  useEffect(() => {
    if (!isAuthReady) return;

    if (isSignedIn) {
      registerBackgroundLocationTask();
    } else {
      unregisterBackgroundLocationTask();
    }
  }, [isAuthReady, isSignedIn]);

  const backgroundColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';

  if (!isAuthReady) {
    return <View style={{ flex: 1, backgroundColor }} />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor }}>
        {isSignedIn ? (
          <ServerSessionGate>
          <Stack
            initialRouteName="(tabs)"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animationTypeForReplace: 'push',
              gestureDirection: 'horizontal',
              // Match the app background so transitions never flash white.
              contentStyle: { backgroundColor },
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
              options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
            />
            <Stack.Screen name="PermissionsScreen" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
            <Stack.Screen name="splashscreen" options={{ headerShown: false }} />
          </Stack>
          </ServerSessionGate>
        ) : (
          <Stack
            initialRouteName="login"
            screenOptions={{
              headerShown: false,
              gestureEnabled: false,
              animationTypeForReplace: 'push',
              gestureDirection: 'horizontal',
              contentStyle: { backgroundColor },
            }}
          >
            <Stack.Screen
              name="login"
              options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }}
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
  onboardingPlaceholder: {
    flex: 1,
    backgroundColor: '#060818',
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
