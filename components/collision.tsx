import React, { useCallback, useEffect, useState } from "react";
import * as Location from 'expo-location';
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import * as Notifications from 'expo-notifications';


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

    const setUserLocationAsync = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            console.error('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude
        });
    };

    useEffect(() => {
        setUserLocationAsync();
    }, []);

    const sendNotification = async (title: string, message: string) => {
        await Notifications.scheduleNotificationAsync({
            content: { title, body: message },
            trigger: null, // sends it immediately
        });
    };

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