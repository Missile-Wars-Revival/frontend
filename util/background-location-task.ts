import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dispatch } from '../api/dispatch';
import { parseStoredIsAlive } from './isalive';

export const BACKGROUND_LOCATION_TASK = 'background-location-dispatch';

// How often (in minutes) the OS may run the task. 15 is the platform minimum;
// actual timing is decided by BGTaskScheduler (iOS) / WorkManager (Android).
const MINIMUM_INTERVAL_MINUTES = 15;

// Stale cached fixes are worse than no dispatch — the backend would place
// entities against a position the player left long ago.
const LAST_KNOWN_MAX_AGE_MS = 10 * 60 * 1000;

async function hasBackgroundLocationPermission() {
  const [foreground, background] = await Promise.all([
    Location.getForegroundPermissionsAsync(),
    Location.getBackgroundPermissionsAsync(),
  ]);

  return foreground.status === 'granted' && background.status === 'granted';
}

async function getBackgroundToken() {
  try {
    return await SecureStore.getItemAsync('token');
  } catch (error) {
    // iOS can deny keychain access to background launches while the device is
    // locked. Treat that as "not dispatchable right now" instead of failing
    // the background task and causing repeated retries/noisy logs.
    console.log('Background location skipped: secure token unavailable in background');
    return null;
  }
}

// Must be defined in module scope so the task exists when the app is launched
// headless by the OS (this file is imported from app/_layout.tsx).
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async () => {
  try {
    if (!(await hasBackgroundLocationPermission())) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    // Dead players don't report location (mirrors getCurrentLocation in locationreq.ts).
    const isAlive = parseStoredIsAlive(await AsyncStorage.getItem('isAlive'));
    if (isAlive === false) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const token = await getBackgroundToken();
    if (!token) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    const position = await Location.getLastKnownPositionAsync({
      maxAge: LAST_KNOWN_MAX_AGE_MS,
    });

    if (!position) {
      return BackgroundTask.BackgroundTaskResult.Success;
    }

    await dispatch(token, position.coords.latitude, position.coords.longitude);

    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    console.error('Background location task failed:', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function registerBackgroundLocationTask() {
  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      console.log('Background tasks unavailable on this device');
      return;
    }

    if (!(await hasBackgroundLocationPermission())) {
      await unregisterBackgroundLocationTask();
      console.log('Background location task not registered: background location permission is not granted');
      return;
    }

    const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (alreadyRegistered) return;

    await BackgroundTask.registerTaskAsync(BACKGROUND_LOCATION_TASK, {
      minimumInterval: MINIMUM_INTERVAL_MINUTES,
    });
    console.log('Background location task registered');
  } catch (error) {
    console.error('Failed to register background location task:', error);
  }
}

export async function unregisterBackgroundLocationTask() {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
    if (registered) {
      await BackgroundTask.unregisterTaskAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch (error) {
    console.error('Failed to unregister background location task:', error);
  }
}
