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

    let useBackground = await AsyncStorage.getItem('useBackgroundLocation');
    let foregroundStatus, backgroundStatus;

    // Request foreground permissions first
    ({ status: foregroundStatus } = await Location.requestForegroundPermissionsAsync());

    if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location access permission was denied');
    }

    // Attempt to request background permissions if enabled and on Android 10+
    if (useBackground === 'true' && Platform.OS === 'android' && Platform.Version >= 29) {
        ({ status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync());

        if (backgroundStatus !== 'granted') {
            console.log('Background location permission not granted');
            await AsyncStorage.setItem('useBackgroundLocation', 'false');
        }
    }

    // Update the permission status in AsyncStorage
    await AsyncStorage.setItem('locationPermissionStatus', foregroundStatus);

    // Fetch the current location
    const location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    };
}

export const getLocationPermission = async () => {
    let foregroundStatus = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus.status !== 'granted') {
        return foregroundStatus.status;
    }

    if (Platform.OS === 'android' && Platform.Version >= 29) {
        let backgroundStatus = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus.status !== 'granted') {
            console.log('Background location permission not granted');
        }
    }

    return foregroundStatus.status;
};

export const getlocation = async () => {
    try {
        const location = await getCurrentLocation();
        const newRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        };
        await saveLocation(newRegion);
    } catch (error) {
    }
};