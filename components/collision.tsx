import React, { useCallback, useEffect, useState } from "react";
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getCurrentLocation } from "../util/locationreq";

// This page needs revamp under branch notificationwork


interface LastNotified {
    loot: string | null;
    missile: string | null;
    landmine: string | null;
}

const proximityThreshold = 0.002;
const TASK_NAME = 'proximityTask';

export const ProximityCheckNotif: React.FC<{}> = () => {
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landmineData, setLandmineLocations] = useState<Landmine[]>([]);
    const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
    const [lastNotified, setLastNotified] = useState<LastNotified>({ loot: null, missile: null, landmine: null });

    const fetchLootAndMissiles = useCallback(async () => {
        setLootLocations(await fetchLootFromBackend());
        setLandmineLocations(await fetchlandmineFromBackend());
        setMissileData(await fetchMissilesFromBackend());
    }, []);

    useEffect(() => {
        fetchLootAndMissiles();
    }, [fetchLootAndMissiles]);

    const getCurrentLocationWrapper = async () => {
        const location: GeoLocation = await getCurrentLocation();
        setUserLocation(location);
    };

    useEffect(() => {
        getCurrentLocationWrapper();
    }, []);

    const sendNotification = async (title: string, message: string) => {
        await Notifications.scheduleNotificationAsync({
            content: { title, body: message },
            trigger: null,
        });
    };

    const checkAndNotify = useCallback(() => {
        const today = new Date().toISOString().slice(0, 10);
        if (!userLocation) return;

        const isWithinRange = (itemLocation: GeoLocation) => {
            const distanceLat = Math.abs(userLocation.latitude - itemLocation.latitude);
            const distanceLon = Math.abs(userLocation.longitude - itemLocation.longitude);
            return distanceLat < proximityThreshold && distanceLon < proximityThreshold;
        };

        lootLocations.forEach(loot => {
            if (isWithinRange(loot.location) && lastNotified.loot !== today) {
                sendNotification("Loot Nearby", "There is loot nearby!");
                setLastNotified(prev => ({ ...prev, loot: today }));
            }
        });

        missileData.forEach(missile => {
            if (isWithinRange(missile.currentLocation)) {
                if (missile.status === 'Incoming' && lastNotified.missile !== today) {
                    sendNotification("Incoming Missile", `Incoming missile ETA: ${missile.etatimetoimpact}`);
                    setLastNotified(prev => ({ ...prev, missile: today }));
                } else if (missile.status === 'Hit' && lastNotified.missile !== today) {
                    sendNotification("Impacted Missile Nearby", "Impacted missile nearby. Be wary of the fallout!");
                    setLastNotified(prev => ({ ...prev, missile: today }));
                }
            }
        });

        landmineData.forEach(landmine => {
            if (isWithinRange(landmine.location) && lastNotified.landmine !== today) {
                sendNotification("Landmine Proximity Warning", "A landmine is nearby. Be cautious!");
                setLastNotified(prev => ({ ...prev, landmine: today }));
            }
        });
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        checkAndNotify();
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        const defineAndRegisterTask = async () => {
            // Define the task first
            TaskManager.defineTask(TASK_NAME, ({ data, error }) => {
                if (error) {
                    console.error('TaskManager Error:', error);
                    return;
                }
                if (data) {
                    checkAndNotify(); // Execute background logic
                }
            });
    
            // Then register the task
            try {
                await BackgroundFetch.registerTaskAsync(TASK_NAME, {
                    minimumInterval: 60, // Run at least every minute
                    stopOnTerminate: false, // Continue running even if the app is closed
                    startOnBoot: true, // Start again automatically if the device is rebooted
                });
            } catch (error) {
                console.error('Background Fetch registration failed:', error);
            }
        };
    
        defineAndRegisterTask();
    
        return () => {
            BackgroundFetch.unregisterTaskAsync(TASK_NAME).catch(err => {
                console.error('Failed to unregister task:', err);
            });
        };
    }, [checkAndNotify]);

    return null;
};
