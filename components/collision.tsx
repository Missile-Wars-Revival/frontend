import React, { useCallback, useEffect, useState } from "react";
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import * as Notifications from 'expo-notifications';
import { getCurrentLocation } from "../util/locationreq"; 


interface LastNotified {
    loot: string | null;
    missile: string | null;
    landmine: string | null;
}

const proximityThreshold = 0.002;

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
        const location: GeoLocation = await getCurrentLocation(); // Use the defined type
        setUserLocation(location);
      };
      
      useEffect(() => {
        getCurrentLocationWrapper();
      }, []);

    const sendNotification = async (title: string, message: string) => {
        await Notifications.scheduleNotificationAsync({
            content: { title, body: message },
            trigger: null, // sends it immediately
        });
    };
// checks if player is in radius 
    const checkForHitAndNotify = () => {
        const today = new Date().toISOString().slice(0, 10);
        if (!userLocation) return;

        const calculateDistance = (loc1: { latitude: any; longitude: any; }, loc2: { latitude: any; longitude: any; }) => {
            return Math.sqrt(
                Math.pow(loc1.latitude - loc2.latitude, 2) + Math.pow(loc1.longitude - loc2.longitude, 2)
            );
        };

        lootLocations.forEach(loot => {
            if (calculateDistance(userLocation, loot.location) <= 0.0002 && lastNotified.loot !== today) {
                sendNotification("Loot Hit", "You've reached a loot!");
                setLastNotified(prev => ({ ...prev, loot: today }));
            }
        });

        missileData.forEach(missile => {
            if (calculateDistance(userLocation, missile.currentLocation) <= missile.radius && lastNotified.missile !== today) {
                let message = missile.status === 'Incoming' ? `Direct hit by incoming missile!` : `You are within the fallout radius of a missile!`;
                sendNotification("Missile Hit", message);
                setLastNotified(prev => ({ ...prev, missile: today }));
            }
        });

        landmineData.forEach(landmine => {
            if (calculateDistance(userLocation, landmine.location) <= 0.0001 && lastNotified.landmine !== today) {
                sendNotification("Landmine Danger", "You've stepped near a landmine!");
                setLastNotified(prev => ({ ...prev, landmine: today }));
            }
        });
    };

    useEffect(() => {
        if (userLocation && lootLocations && missileData && landmineData) {
            checkForHitAndNotify();
        }
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);
//checks if nearby and notifies
    const checkAndNotify = () => {
        const today = new Date().toISOString().slice(0, 10); // get YYYY-MM-DD format
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
    };

    useEffect(() => {
        checkAndNotify();  // Check proximity and send notifications
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    return null; // Explicitly return null if there is nothing to render
};