import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { dispatch } from '../api/dispatch';
import * as SecureStore from "expo-secure-store";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const { LiveActivityModule } = NativeModules;

const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

// Add this at the top of the file
const logLiveActivity = (message: string) => {
  console.log(`[LiveActivity] ${message}`);
};

// Update the background location task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Error in background location task:', error);
    return;
  }
  
  // Check user preference before processing location
  const userPreference = await AsyncStorage.getItem('useBackgroundLocation');
  if (userPreference !== 'true') {
    console.log('Background location updates are disabled by user preference');
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const location = locations[0];
    
    if (location) {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token && location.coords.latitude && location.coords.longitude) {
          await dispatch(token, location.coords.latitude, location.coords.longitude);
          console.log("Location dispatched successfully from background task");
          
          // Update Live Activity with new location
          if (Platform.OS === 'ios') {
            await updateLiveActivity({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: new Date().toISOString(),
            });
          } else {
            logLiveActivity('Not on iOS, skipping Live Activity update');
          }
        } else {
          console.log("Invalid token or location data", token, location);
        }
      } catch (error) {
        console.error('Error dispatching location from background task:', error);
      }
    }
  }
});

// Updated function to check if background location is available
export const isBackgroundLocationAvailable = async (): Promise<boolean> => {
  try {
    // Check system background location permission
    const { status } = await Location.getBackgroundPermissionsAsync();
    const systemBackgroundEnabled = status === 'granted';

    // Get user preference from AsyncStorage
    const userPreference = await AsyncStorage.getItem('useBackgroundLocation');
    const userBackgroundEnabled = userPreference === 'true';

    // Update AsyncStorage if necessary
    if (systemBackgroundEnabled && !userBackgroundEnabled) {
      await AsyncStorage.setItem('useBackgroundLocation', 'true');
      console.log('Updated AsyncStorage: Background location enabled');
    } else if (!systemBackgroundEnabled && userBackgroundEnabled) {
      await AsyncStorage.setItem('useBackgroundLocation', 'false');
      console.log('Updated AsyncStorage: Background location disabled');
    }

    // Return the system status
    if (systemBackgroundEnabled) {
      console.log('Background location permission is granted');
      return true;
    } else {
      console.log('Background location permission not granted');
      return false;
    }
  } catch (error) {
    console.error('Error checking background location availability:', error);
    return false;
  }
};

// Update the startBackgroundLocationUpdates function
export const startBackgroundLocationUpdates = async () => {
  try {
    const isAvailable = await isBackgroundLocationAvailable();
    const userPreference = await AsyncStorage.getItem('useBackgroundLocation');
    
    if (isAvailable && userPreference === 'true') {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 300000, // Update every 5 minutes (300000 ms)
        distanceInterval: 100, // Or every 100 meters
        foregroundService: {
          notificationTitle: "Background Location",
          notificationBody: "Tracking your location in the background",
        },
      });
      console.log('Background location updates started successfully');

      // Start Live Activity
      if (Platform.OS === 'ios') {
        await startLiveActivity();
      } else {
        logLiveActivity('Not on iOS, skipping Live Activity start');
      }

      // Dispatch current location immediately
      const currentLocation = await Location.getCurrentPositionAsync({});
      const token = await SecureStore.getItemAsync("token");
      if (token && currentLocation.coords.latitude && currentLocation.coords.longitude) {
        await dispatch(token, currentLocation.coords.latitude, currentLocation.coords.longitude);
        console.log("Initial location dispatched successfully");
      } else {
        console.log("Invalid token or initial location data", token, currentLocation);
      }
    } else {
      console.log('Background location is not available or disabled by user');
      await stopBackgroundLocationUpdates();
    }
  } catch (error) {
    console.error('Error starting background location updates:', error);
  }
};

// Update the stopBackgroundLocationUpdates function
export const stopBackgroundLocationUpdates = async () => {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      console.log('Background location updates stopped successfully');

      // End Live Activity
      if (Platform.OS === 'ios') {
        await endLiveActivity();
      } else {
        logLiveActivity('Not on iOS, skipping Live Activity end');
      }
    } else {
      console.log('Background location updates were not running');
    }
  } catch (error) {
    console.error('Error stopping background location updates:', error);
  }
};

// Add a new function to check and update background location status
export const checkAndUpdateBackgroundLocation = async () => {
  const userPreference = await AsyncStorage.getItem('useBackgroundLocation');
  if (userPreference === 'true') {
    await startBackgroundLocationUpdates();
  } else {
    await stopBackgroundLocationUpdates();
  }
};

// Update the Live Activity related functions
const startLiveActivity = async () => {
  if (Platform.OS === 'ios') {
    if (LiveActivityModule && LiveActivityModule.startLiveActivity) {
      try {
        await LiveActivityModule.startLiveActivity();
        logLiveActivity('Live Activity started successfully');
      } catch (error) {
        logLiveActivity(`Error starting Live Activity: ${error}`);
      }
    } else {
      logLiveActivity('LiveActivityModule or startLiveActivity not available');
      console.log('NativeModules:', NativeModules);
    }
  } else {
    logLiveActivity('Not on iOS, skipping Live Activity start');
  }
};

const updateLiveActivity = async (data: { latitude: number; longitude: number; timestamp: string }) => {
  if (Platform.OS === 'ios' && LiveActivityModule && LiveActivityModule.updateLiveActivity) {
    try {
      await LiveActivityModule.updateLiveActivity(data);
      logLiveActivity('Live Activity updated successfully');
    } catch (error) {
      logLiveActivity(`Error updating Live Activity: ${error}`);
    }
  } else {
    logLiveActivity('LiveActivityModule or updateLiveActivity not available');
  }
};

const endLiveActivity = async () => {
  if (Platform.OS === 'ios' && LiveActivityModule && LiveActivityModule.endLiveActivity) {
    try {
      await LiveActivityModule.endLiveActivity();
      logLiveActivity('Live Activity ended successfully');
    } catch (error) {
      logLiveActivity(`Error ending Live Activity: ${error}`);
    }
  } else {
    logLiveActivity('LiveActivityModule or endLiveActivity not available');
  }
};
