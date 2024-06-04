import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation } from 'middle-earth';

export async function getCurrentLocation(): Promise<GeoLocation> {
    const useBackground = await AsyncStorage.getItem('useBackgroundLocation');
    let permissionStatus;

    if (useBackground === 'true') {
        ({ status: permissionStatus } = await Location.requestBackgroundPermissionsAsync());
    } else {
        ({ status: permissionStatus } = await Location.requestForegroundPermissionsAsync());
    }

    // Check if the permission was granted
    if (permissionStatus !== 'granted') {
        throw new Error('Location access permission was denied');
    }

    // Update the AsyncStorage to reflect the current permission state
    await AsyncStorage.setItem('useBackgroundLocation', permissionStatus);

    // Fetch the current location using the appropriate permissions
    const location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    };
}
