import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GeoLocation } from 'middle-earth';

export async function getCurrentLocation(): Promise<GeoLocation> {
    const useBackground = await AsyncStorage.getItem('useBackgroundLocation');
    let status;

    if (useBackground === 'true') {
        ({ status } = await Location.requestBackgroundPermissionsAsync());
    } else {
        ({ status } = await Location.requestForegroundPermissionsAsync());
    }

    if (status !== 'granted') {
        throw new Error('Permission to access location was denied');
    }

    let location = await Location.getCurrentPositionAsync({});
    return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
    };
}
