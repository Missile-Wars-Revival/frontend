// This file is for using Async storage to cache users theme choice
import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeMapStyle = async (style: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('selectedMapStyle', style);
  } catch (error) {
    console.error('Error storing map style:', error);
    throw error;
  }
};

export const getStoredMapStyle = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('selectedMapStyle');
  } catch (error) {
    console.error('Error retrieving map style:', error);
    throw error;
  }
};

// Function to load the last known location from storage
export const loadLastKnownLocation = async () => {
  try {
      const jsonValue = await AsyncStorage.getItem('regionlocation');
      return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
      console.log('Error reading location from AsyncStorage', e);
  }
};

// Function to save the current location to storage
export const saveLocation = async (location: any) => {
  try {
      const jsonValue = JSON.stringify(location);
      await AsyncStorage.setItem('regionlocation', jsonValue);
  } catch (e) {
      console.log('Error saving location to AsyncStorage', e);
  }
};