import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocation } from './mapstore';
import { Platform } from 'react-native';

export interface location {
    latitude: number; 
    longitude: number;
}

export async function getCurrentLocation(): Promise<location> {
    // Retrieve and parse the isAlive value from AsyncStorage
    const isAliveString = await AsyncStorage.getItem('isAlive');
    
    // Parse the isAlive value if it's not null, otherwise default to an object indicating not alive
    const isAliveObj = isAliveString ? JSON.parse(isAliveString) : { isAlive: false };

    // Check if the app should fetch location (if user is alive)
    if (!isAliveObj.isAlive) {
        throw new Error('Location fetching is disabled because the app is not active.');
    }

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
    } catch (error) {
    }
};