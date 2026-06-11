import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { DeviceEventEmitter } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut as clearSession } from '../logincache';

/**
 * Emitted after sign-out. The root layout listens and restarts the app shell
 * (splash → onboarding → login), so onboarding always runs before login.
 */
export const APP_RELAUNCH_EVENT = 'app-relaunch';

interface AuthContextType {
  isSignedIn: boolean;
  isAuthReady: boolean;
  setIsSignedIn: (value: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  initialIsSignedIn?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, initialIsSignedIn }) => {
  const [isSignedIn, setIsSignedIn] = useState(initialIsSignedIn ?? false);
  const [isAuthReady, setIsAuthReady] = useState(initialIsSignedIn !== undefined);

  const updateSignedIn = useCallback((value: boolean) => {
    setIsSignedIn(value);
    setIsAuthReady(true);
  }, []);

  const signOut = useCallback(async () => {
    await clearSession();
    updateSignedIn(false);
    DeviceEventEmitter.emit(APP_RELAUNCH_EVENT);
  }, [updateSignedIn]);

  useEffect(() => {
    // Only fall back to AsyncStorage if we didn't get a value from the splash screen
    if (initialIsSignedIn !== undefined) return;

    const checkSignInStatus = async () => {
      try {
        const status = await AsyncStorage.getItem('signedIn');
        updateSignedIn(status === 'true');
      } catch (error) {
        console.error('Failed to read sign-in status:', error);
        updateSignedIn(false);
      }
    };
    checkSignInStatus();
  }, [initialIsSignedIn, updateSignedIn]);

  return (
    <AuthContext.Provider value={{ isSignedIn, isAuthReady, setIsSignedIn: updateSignedIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
