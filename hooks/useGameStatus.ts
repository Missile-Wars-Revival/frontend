import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { parseStoredIsAlive } from '../util/isalive';

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

        const storedIsAlive = parseStoredIsAlive(await AsyncStorage.getItem('isAlive'));
        setIsAlive(storedIsAlive ?? false);
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
