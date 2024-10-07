import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocation } from './mapstore';
import { Platform } from 'react-native';

export interface location {
    latitude: number; 
    longitude: number;
}

export async function getCurrentLocation(): Promise<location> {
    // Retrieve the isAlive value from AsyncStorage
    const isAliveString = await AsyncStorage.getItem('isAlive');
    
    // If isAliveString is null or 'true', or if parsed JSON has isAlive as true, proceed with location fetching
    if (isAliveString === null || isAliveString === 'true' || (isAliveString && JSON.parse(isAliveString).isAlive)) {
        let foregroundStatus;

        // Check and request foreground permissions
        foregroundStatus = await Location.getForegroundPermissionsAsync();
        if (foregroundStatus.status !== 'granted') {
            foregroundStatus = await Location.requestForegroundPermissionsAsync();
            if (foregroundStatus.status !== 'granted') {
                throw new Error('Foreground location access permission was denied');
            }
        }

        // Update the permission status in AsyncStorage
        await AsyncStorage.setItem('locationPermissionStatus', foregroundStatus.status);

        // Fetch the current location
        const location = await Location.getCurrentPositionAsync({});
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        };
    } else {
        throw new Error('Location fetching is disabled because the app is not active.');
    }
}

export const getlocation = async () => {
    try {
        const location = await getCurrentLocation();
        const newRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
            pitch: 0,
            heading: 0
        };
        await saveLocation(newRegion);
        return newRegion; // Return the new region
    } catch (error) {
        console.error("Error in getlocation:", error);
        throw error; // Re-throw the error to be handled by the caller
    }
};