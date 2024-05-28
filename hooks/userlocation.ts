import * as Location from 'expo-location';
import { Alert } from 'react-native';

export const getLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Location permission is required to use this feature.');
            return;
        }
        return status;
    };