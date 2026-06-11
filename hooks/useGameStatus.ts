import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Reads the cached game status flags ("dbconnection" and "isAlive") that the
// map screens use to decide whether to disable the map.
export function useGameStatus() {
  const [hasDbConnection, setHasDbConnection] = useState<boolean>(false);
  const [isAlive, setIsAlive] = useState<boolean>(true);

  useEffect(() => {
    const loadGameStatus = async () => {
      try {
        const isDBConnection = await AsyncStorage.getItem('dbconnection');
        setHasDbConnection(isDBConnection === 'true');

        const isAliveStatus = await AsyncStorage.getItem('isAlive');
        if (isAliveStatus !== null) {
          const isAliveData = JSON.parse(isAliveStatus);
          setIsAlive(isAliveData.isAlive ?? false);
        } else {
          setIsAlive(false);
        }
      } catch (error) {
        console.error('Error loading game status:', error);
        setHasDbConnection(false);
        setIsAlive(false);
      }
    };

    loadGameStatus();
  }, []);

  return { hasDbConnection, isAlive };
}
