import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getCurrentLocation } from './locationreq';


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