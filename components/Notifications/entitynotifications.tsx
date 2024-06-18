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
const TASK_NAME = 'EntityNotificationTask';

export const ProximityCheckNotif: React.FC<{}> = () => {
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landmineData, setLandmineLocations] = useState<Landmine[]>([]);
    const [userLocation, setUserLocation] = useState<location | null>(null);
    const [lastNotified, setLastNotified] = useState<LastNotified>({ loot: null, missile: null, landmine: null });
    const [isTaskRegistered, setIsTaskRegistered] = useState(false); 

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
            const { status } = await Notifications.requestPermissionsAsync({
                ios: {
                  allowAlert: true,
                  allowBadge: true,
                  allowSound: true,
                  allowAnnouncements: true,
                },
              });
            if (status !== 'granted') {
                alert('Permission to receive notifications was denied');
            }
        })();
    }, []);

    const sendNotification = async (title: string, message: string) => {
        //console.log(`Sending notification: ${title} - ${message}`);
        await Notifications.scheduleNotificationAsync({
            content: { 
                title: title,
                body: message,
                //sound: 'pop.mp3',
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

        // Function to convert degrees to radians
        const degreesToRadians = (degrees: number): number => {
            return degrees * Math.PI / 180;
        };

        // Function to determine if the item is near or within the missile radius
        const checkMissileProximity = (itemLocation: location, missileRadius: number, userLocation: location ) => {
            const earthRadiusKm = 6371; // Earth's radius in kilometers
            const dLat = degreesToRadians(userLocation.latitude - itemLocation.latitude);
            const dLon = degreesToRadians(userLocation.longitude - itemLocation.longitude);
            const lat1 = degreesToRadians(itemLocation.latitude);
            const lat2 = degreesToRadians(userLocation.latitude);
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distance = earthRadiusKm * c; // distance in kilometers
            const distancem = distance / 1000;
            // Convert missileRadius from meters to kilometers
            const missileRadiusKm = missileRadius / 1000;
            const nearbythreshold = missileRadiusKm + proximityThreshold;
            //console.log(`Calculated distance: ${distancem} m, Missile radius: ${missileRadiusKm} km, Proximity Threshold: ${proximityThreshold} km, Threshold: ${missileRadiusKm+proximityThreshold} km`);
            // Check if the distance is within the missile radius
            if (distance < missileRadiusKm) {
                //console.log("Within")
                return "within-missile";
            }
            // Check if the distance is within the proximity threshold outside the missile radius
            if (distancem < nearbythreshold) {
                //console.log("near")
                return "near-missile";
            }
            else {
                // If neither condition is met
                //console.log("safe")
                return "safe";
            }
        }; 
        const checkLootandLandmineProximity = (itemtype: string, itemLocation: location, userLocation: location, itemRadius: number ) => {
            const earthRadiusKm = 6371; // Earth's radius in kilometers
            const dLat = degreesToRadians(userLocation.latitude - itemLocation.latitude);
            const dLon = degreesToRadians(userLocation.longitude - itemLocation.longitude);

            const lat1 = degreesToRadians(itemLocation.latitude);
            const lat2 = degreesToRadians(userLocation.latitude);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

            const distance = earthRadiusKm * c; // distance in kilometers
            const distancem = distance / 1000;

            // Convert missileRadius from meters to kilometers
            const itemRadiusKm = itemRadius / 1000;
            const nearbythreshold = itemRadiusKm + proximityThreshold;

            // Check if the distance is within the missile radius
            if (distance < itemRadiusKm && itemtype == "loot") {
                //console.log("Within")
                return "within-loot";
            }
            if (distance < itemRadiusKm && itemtype == "landmine") {
                //console.log("Within")
                return "within-landmine";
            }
            // Check if the distance is within the proximity threshold outside the missile radius
            if (distancem < nearbythreshold && itemtype == "loot") {
                //console.log("near")
                return "near-loot";
            }
            if (distancem < nearbythreshold && itemtype == "landmine") {
                //console.log("near")
                return "near-landmine";
            }
            else {
                // If neither condition is met
                //console.log("safe")
                return "safe";
            }
        };       

        //Notifications:
        lootLocations.forEach(loot => {
            const proximityStatus = checkLootandLandmineProximity("loot", loot.location, userLocation, 10 );
            if (lastNotified.loot !== today) {
                switch (proximityStatus) {
                    case 'within-loot':
                        //inside landmine radius
                            sendNotification("Loot Pickup", "Open the App to collect your loot!");
                            setLastNotified(prev => ({ ...prev, loot: today }));
                        break;
                    case 'near-loot':
                        // Send warning if near but not within the loot radius
                            sendNotification("Loot Nearby", `Look around you! Rarity: ${loot.rarity}`);
                            setLastNotified(prev => ({ ...prev, loot: today }));
                        break;
                }
            }
        });

        missileData.forEach(missile => {
            const proximityStatus = checkMissileProximity(missile.destination, missile.radius, userLocation );
            if (lastNotified.missile !== today) {
                switch (proximityStatus) {
                    case 'within-missile':
                        // Send specific notification if within the missile radius
                        if (missile.status === 'Incoming') {
                            sendNotification("RUN!! Missile Incoming!", `You are within the impact zone! Incoming Missile ETA: ${missile.etatimetoimpact}`);
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        if (missile.status === 'Hit') {
                            sendNotification("Danger!", "A Missile has impacted within the zone. You may start taking damage!");
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        break;
                    case 'near-missile':
                        // Send warning if near but not within the missile radius
                        if (missile.status === 'Incoming') {
                            sendNotification("Incoming Missile Alert!", `Be wary, there is an incoming missile nearby. Incoming Missile ETA: ${missile.etatimetoimpact}`);
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
            const proximityStatus = checkLootandLandmineProximity("landmine",landmine.location, userLocation, 10 );
            if (lastNotified.landmine !== today) {
                switch (proximityStatus) {
                    case 'within-loot':
                        //inside landmine radius
                            sendNotification("Danger!", "You just stepped on a Landmine! Damage has been taken.");
                            setLastNotified(prev => ({ ...prev, landmine: today }));
                        break;
                    case 'near-loot':
                        // Send warning if near but not within the landmine radius
                            sendNotification("Landmine Proximity Warning", "A landmine is nearby. Be cautious!");
                            setLastNotified(prev => ({ ...prev, landmine: today }));
                        break;
                }
            }
        });

    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        checkAndNotify();
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        const defineAndRegisterTask = async () => {
            if (!isTaskRegistered) {
                //console.log('Defining and registering background fetch task');
                TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
                    if (error) {
                        console.error('TaskManager Error:', error);
                        return;
                    }
                    //console.log('Background fetch task triggered');
                    try {
                        await checkAndNotify(); // Execute background logic
                    } catch (e) {
                        //console.error('Error executing background fetch:', e);
                    }
                });
    
                try {
                    const options = {
                        minimumInterval: 900, // 15 minutes in seconds, realistic for iOS
                        stopOnTerminate: false,
                        startOnBoot: true,
                    };
                    await BackgroundFetch.registerTaskAsync(TASK_NAME, options);
                    //console.log('Background Fetch task registered successfully with options:', options);
                    setIsTaskRegistered(true);
                } catch (error) {
                    console.error('Background Fetch registration failed:', error);
                }
            }
        };
    
        defineAndRegisterTask();
    
        return () => {
            if (isTaskRegistered) {
                BackgroundFetch.unregisterTaskAsync(TASK_NAME)
                    .then(() => {
                        //console.log('Task unregistered successfully');
                    })
                    .catch(err => console.error('Failed to unregister task:', err));
            }
        };
    }, [isTaskRegistered]);
    
    return null;
};    