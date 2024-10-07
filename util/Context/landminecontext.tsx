import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LandmineContextType {
  showAllLandmines: boolean;
  activateLandmineSweeper: () => void;
}

const LandmineContext = createContext<LandmineContextType | undefined>(undefined);

const LANDMINE_SWEEPER_KEY = 'landmineSweeper_activatedAt';
const LANDMINE_SWEEPER_DURATION = 120000; // 2 minutes in milliseconds

export const LandmineProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [showAllLandmines, setShowAllLandmines] = useState(false);

  const checkLandmineSweeper = useCallback(async () => {
    const activatedAt = await AsyncStorage.getItem(LANDMINE_SWEEPER_KEY);
    if (activatedAt) {
      const activatedTime = parseInt(activatedAt, 10);
      const currentTime = Date.now();
      if (currentTime - activatedTime < LANDMINE_SWEEPER_DURATION) {
        setShowAllLandmines(true);
        setTimeout(() => {
          setShowAllLandmines(false);
          AsyncStorage.removeItem(LANDMINE_SWEEPER_KEY);
        }, LANDMINE_SWEEPER_DURATION - (currentTime - activatedTime));
      } else {
        AsyncStorage.removeItem(LANDMINE_SWEEPER_KEY);
      }
    }
  }, []);

  useEffect(() => {
    checkLandmineSweeper();
  }, [checkLandmineSweeper]);

  const activateLandmineSweeper = useCallback(async () => {
    const activationTime = Date.now().toString();
    await AsyncStorage.setItem(LANDMINE_SWEEPER_KEY, activationTime);
    setShowAllLandmines(true);
    setTimeout(() => {
      setShowAllLandmines(false);
      AsyncStorage.removeItem(LANDMINE_SWEEPER_KEY);
    }, LANDMINE_SWEEPER_DURATION);
  }, []);

  return (
    <LandmineContext.Provider value={{ showAllLandmines, activateLandmineSweeper }}>
      {children}
    </LandmineContext.Provider>
  );
};

export const useLandmine = () => {
  const context = useContext(LandmineContext);
  if (context === undefined) {
    throw new Error('useLandmine must be used within a LandmineProvider');
  }
  return context;
};