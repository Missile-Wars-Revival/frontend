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

  const signOut = useCallback(async () => {
    await clearSession();
    setIsSignedIn(false);
    DeviceEventEmitter.emit(APP_RELAUNCH_EVENT);
  }, []);

  useEffect(() => {
    // Only fall back to AsyncStorage if we didn't get a value from the splash screen
    if (initialIsSignedIn !== undefined) return;

    const checkSignInStatus = async () => {
      const status = await AsyncStorage.getItem('signedIn');
      setIsSignedIn(status === 'true');
    };
    checkSignInStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ isSignedIn, setIsSignedIn, signOut }}>
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
