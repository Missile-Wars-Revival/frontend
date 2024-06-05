import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation } from 'middle-earth';

export async function getCurrentLocation(): Promise<GeoLocation> {
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
