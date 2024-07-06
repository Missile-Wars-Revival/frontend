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
            // Define the background fetch task
            TaskManager.defineTask(TASK_NAME, async () => {
                try {
                    // Your task's logic here, e.g., fetch the location
                    const location = await getCurrentLocation();
                    const dispatchLocation = async () => {
                        try {
                            const location = await getCurrentLocation();
                            const token = await SecureStore.getItemAsync("token");
                            if (token && location.latitude && location.longitude) {
                                await dispatch(token, location.latitude, location.longitude);
                                //console.log("Location dispatched successfully");
                            } else {
                                //console.log("Invalid token or location data", token, location);
                            }
                        } catch (error) {
                            //console.log("Failed to dispatch location", error);
                        }
                        dispatchLocation()
                    };
                    console.log('Background location:', location);

                    // Return success to let the system know the task completed successfully
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
            //console.log('Background Fetch task registered successfully with options:', options);
        }
    } catch (error) {
        console.error('Background Fetch registration failed:', error);
    }
};


//send location to backend func: