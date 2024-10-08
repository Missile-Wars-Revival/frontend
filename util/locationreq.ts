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

        // Check and request foreground permissions
        const foregroundStatus = await Location.getForegroundPermissionsAsync();
        if (foregroundStatus.status !== 'granted') {
            throw new Error('Foreground location access permission is not granted');
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

// Haversine formula for distance calculation
export function calculateDistance(point1: location, point2: location): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = point1.latitude * Math.PI / 180;
    const φ2 = point2.latitude * Math.PI / 180;
    const Δφ = (point2.latitude - point1.latitude) * Math.PI / 180;
    const Δλ = (point2.longitude - point1.longitude) * Math.PI / 180;
  
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c; // Distance in meters
  }