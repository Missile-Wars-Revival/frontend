import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Text, Switch, Alert } from "react-native";
import * as Location from 'expo-location';
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { useUserName } from "../util/fetchusernameglobal";
import * as Notifications from 'expo-notifications';


interface LastNotified {
    loot: string | null;
    missile: string | null;
    landmine: string | null;
}

const proximityThreshold = 0.002; 
//This fetches and notifies nearby items
export const Proximitycheck: React.FC<{}> = () => {
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landmineData, setLandmineLocations] = useState<Landmine[]>([]);
    const [userLocation, setUserLocation] = useState<GeoLocation | null>(null);
    const [lastNotified, setLastNotified] = useState({ loot: null, missile: null, landmine: null });

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

    const sendNotification = async (message: any) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Proximity Alert!",
                body: message,
            },
            trigger: null, 
        });
    };

    const checkAndNotify = (type: string, item: Loot | Missile | Landmine) => {
        const today = new Date().toISOString().slice(0, 10); 
        if (lastNotified[type as keyof LastNotified] !== today) {
            sendNotification(`Near ${type} at ${JSON.stringify(item)}`);
            setLastNotified(prev => ({ ...prev, [type as keyof LastNotified]: today }));
        }
    };

    useEffect(() => {
        const checkProximity = () => {
            if (!userLocation) return;

            const isWithinRange = (itemLocation: GeoLocation) => {
                const distanceLat = Math.abs(userLocation.latitude - itemLocation.latitude);
                const distanceLon = Math.abs(userLocation.longitude - itemLocation.longitude);
                return distanceLat < proximityThreshold && distanceLon < proximityThreshold;
            };

            lootLocations.forEach(loot => {
                if (isWithinRange(loot.location)) {
                    console.log(`Near loot at ${loot}`);
                    checkAndNotify('Loot', loot);
                }
            });

            missileData.forEach(missile => {
                if (isWithinRange(missile.destination)) {
                    console.log(`Near missile at ${missile}`);
                    checkAndNotify('Missile', missile);
                }
            });

            landmineData.forEach(landmine => {
                if (isWithinRange(landmine.location)) {
                    console.log(`Near landmine at ${landmine}`);
                    checkAndNotify('Landmine', landmine);
                }
            });
        };

        checkProximity();
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);
    return null;
}