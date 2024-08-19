import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveLocation } from './mapstore';

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
    let permissionStatus;

    // Attempt to request background permissions if enabled
    if (useBackground === 'true') {
        ({ status: permissionStatus } = await Location.requestBackgroundPermissionsAsync());

        // If permission is denied, switch to foreground permissions
        if (permissionStatus !== 'granted') {
            await AsyncStorage.setItem('useBackgroundLocation', 'false');
            ({ status: permissionStatus } = await Location.requestForegroundPermissionsAsync());
        }
    } else {
        ({ status: permissionStatus } = await Location.requestForegroundPermissionsAsync());
    }

    // Check if permission was granted after either attempt
    if (permissionStatus !== 'granted') {
        throw new Error('Location access permission was denied');
    }

    // Update the permission status in AsyncStorage
    await AsyncStorage.setItem('locationPermissionStatus', permissionStatus);

    // Fetch the current location using the appropriate permissions
    const location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    };
}

export const getLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            //Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
            return;
        }
        return status;
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