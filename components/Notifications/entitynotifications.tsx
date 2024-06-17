import React, { useCallback, useEffect, useState } from "react";
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../../temp/fetchMethods";
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { getCurrentLocation } from "../../util/locationreq";
import {location} from "../../util/locationreq"
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

interface LastNotified {
    loot: string | null;
    missile: string | null;
    landmine: string | null;
}

const proximityThreshold = 0.002;
const TASK_NAME = 'proximitynotificationTask';

export const ProximityCheckNotif: React.FC<{}> = () => {
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landmineData, setLandmineLocations] = useState<Landmine[]>([]);
    const [userLocation, setUserLocation] = useState<location | null>(null);
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
        const location: location = await getCurrentLocation();
        setUserLocation(location);
    };

    useEffect(() => {
        getCurrentLocationWrapper();
    }, []);

    useEffect(() => {
        // Request permissions when component mounts
        (async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to receive notifications was denied');
            }
        })();
    }, []);

    const sendNotification = async (title: string, message: string) => {
        await Notifications.scheduleNotificationAsync({
            content: { 
                title: title,
                body: message,
                //sound: 'mySoundFile.wav',
            },
            trigger: null,
            // trigger: {
            //     seconds: 2,
            //     channelId: 'incoming-entities',
            //   },
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
        // to take into consideration missile radius
        const isWithinRangeofMissile = (itemLocation: location, proximityThreshold: number, userLocation: location): boolean => {
            const earthRadiusKm = 6371; // Earth's radius in kilometers
        
            const dLat = degreesToRadians(userLocation.latitude - itemLocation.latitude);
            const dLon = degreesToRadians(userLocation.longitude - itemLocation.longitude);
        
            const lat1 = degreesToRadians(itemLocation.latitude);
            const lat2 = degreesToRadians(userLocation.latitude);
        
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
            const distance = earthRadiusKm * c;
        
            // Check if the calculated distance is within the proximityThreshold (which represents the radius in kilometers)
            return distance < proximityThreshold;
        };

        // Function to determine if the item is near or within the missile radius
        const degreesToRadians = (degrees: number): number => {
            return degrees * Math.PI / 180;
          };
          
          const checkMissileProximity = (itemLocation: location, missileRadius: number, userLocation: location) => {
            const earthRadiusKm = 6371; // Earth's radius in kilometers
          
            const dLat = degreesToRadians(userLocation.latitude - itemLocation.latitude);
            const dLon = degreesToRadians(userLocation.longitude - itemLocation.longitude);
          
            const lat1 = degreesToRadians(itemLocation.latitude);
            const lat2 = degreesToRadians(userLocation.latitude);
          
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          
            const distance = earthRadiusKm * c;
          
            // Check if the distance is within the missile radius
            if (distance < missileRadius) {
              return "within";
            }
            // Check if the distance is within the proximity threshold outside the missile radius
            else if (distance < missileRadius + proximityThreshold) {
              return "near";
            }
            // If neither condition is met
            return "safe";
          };
    

        //Nearby entity Notifications

        lootLocations.forEach(loot => {
            if (isWithinRange(loot.location) && lastNotified.loot !== today) {
                sendNotification("Loot Nearby", `Look around you! Rarity: ${loot.rarity}`);
                setLastNotified(prev => ({ ...prev, loot: today }));
            }
        });

        missileData.forEach(missile => {
            const proximityStatus = checkMissileProximity(missile.destination, missile.radius, userLocation ); // Add the proximity threshold as needed
            const today = new Date().toISOString().slice(0, 10); // Ensure 'today' is defined and formatted correctly for comparison
        
            if (lastNotified.missile !== today) {
                switch (proximityStatus) {
                    case 'within':
                        // Send specific notification if within the missile radius
                        if (missile.status === 'Incoming') {
                            sendNotification("RUN!! Missile Incoming!", `You are within the impact zone! Incoming Missile ETA: ${missile.etatimetoimpact}`);
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        if (missile.status === 'Hit') {
                            sendNotification("Danger!", "A Missile has impacted within the zone. Be wary of the fallout!");
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        break;
                    case 'near':
                        // Send warning if near but not within the missile radius
                        if (missile.status === 'Incoming') {
                            sendNotification("Nearby Missile Alert!", `Be wary, there is a Missile Nearby. Incoming Missile ETA: ${missile.etatimetoimpact}`);
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        if (missile.status === 'Hit') {
                            sendNotification("Missile Impact Warning!", "Impacted Missile Nearby. Be wary of the fallout!");
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        break;
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
