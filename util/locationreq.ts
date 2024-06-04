import * as Location from 'expo-location';
import { GeoLocation } from 'middle-earth';

export async function getCurrentLocation(): Promise<GeoLocation> {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.error('Permission to access location was denied');
    }
    let location = await Location.getCurrentPositionAsync({});
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  }
