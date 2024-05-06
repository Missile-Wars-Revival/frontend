import AsyncStorage from '@react-native-async-storage/async-storage';

const MAP_STYLE_KEY = 'selectedMapStyle';

export const storeMapStyle = async (style: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(MAP_STYLE_KEY, style);
  } catch (error) {
    console.error('Error storing map style:', error);
    throw error;
  }
};

export const getStoredMapStyle = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(MAP_STYLE_KEY);
  } catch (error) {
    console.error('Error retrieving map style:', error);
    throw error;
  }
};