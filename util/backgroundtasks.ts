import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getCurrentLocation } from './locationreq';
import { dispatch } from '../api/dispatch';
import * as SecureStore from "expo-secure-store";


// Function to register the background task


//Updates location
export const DefRegLocationTask = async () => {
    const TASK_NAME = 'BACKGROUND_LOCATION_TASK';
    try {
        const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);

        if (!isTaskRegistered) {
            // Define the background location task
            TaskManager.defineTask(TASK_NAME, async () => {
                try {
                    const location = await getCurrentLocation();
                    if (location) {
                        const token = await SecureStore.getItemAsync("token");
                        if (token && location.latitude && location.longitude) {
                            await dispatch(token, location.latitude, location.longitude);
                            console.log("Location dispatched successfully");
                        } else {
                            console.log("Invalid token or location data", token, location);
                        }
                    }
                    return BackgroundFetch.BackgroundFetchResult.NewData;
                } catch (error) {
                    console.error('Error in background task:', error);
                    return BackgroundFetch.BackgroundFetchResult.NoData;
                }
            });

            // Register the background fetch task
            const options = {
                minimumInterval: 900, // 15 minutes in seconds, realistic for iOS
                stopOnTerminate: false,
                startOnBoot: true,
            };
            await BackgroundFetch.registerTaskAsync(TASK_NAME, options);
            console.log('Background Fetch task registered successfully with options:', options);
        }
    } catch (error) {
        console.error('Background Fetch registration failed:', error);
    }
};
