import React, { useCallback, useEffect, useState } from "react";
import { getCurrentLocation } from "../../util/locationreq";
import { location } from "../../util/locationreq"
import * as Notifications from 'expo-notifications';
import { convertimestampfuturemissile } from "../../util/get-time-difference";
import { Alert } from "react-native";
import { addrankpoints } from "../../api/rank";
import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { getRandomLoot } from "./Probability";
import { addmoney } from "../../api/money";
import { additem } from "../../api/add-item";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { addHealth, getHealth, removeHealth, setHealth, updateisAlive } from "../../api/health";
import { useCountdown } from "../../util/Context/countdown";
import useFetchMissiles from "../../hooks/websockets/missilehook";
import useFetchLoot from "../../hooks/websockets/loothook";
import useFetchLandmines from "../../hooks/websockets/landminehook";
import { lootpickup, steppedonlandmine } from "../../api/fireentities";

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

export const ProximityCheckNotif: React.FC<{}> = () => {

    const missileData = useFetchMissiles()
    const lootLocations = useFetchLoot()
    const landmineData = useFetchLandmines()

    const [userLocation, setUserLocation] = useState<location | null>(null);
    const [lastNotified, setLastNotified] = useState<LastNotified>({ loot: null, missile: null, landmine: null });
    const [isAlive, setisAlive] = useState(true);
    const { startCountdown, stopCountdown } = useCountdown();

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
        const checkMissileProximity = (itemLocation: location, missileRadius: number, userLocation: location) => {
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
        const checkLootandLandmineProximity = (itemtype: string, itemLocation: location, userLocation: location, itemRadius: number) => {
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

        //Loot reward:
        lootLocations.forEach(async loot => {
            const proximityStatus = checkLootandLandmineProximity("loot", loot.location, userLocation, 10);
            if (lastNotified.loot !== today) {
                switch (proximityStatus) {
                    case 'within-loot':
                        const token = await SecureStore.getItemAsync("token");
                        if (!token) {
                            console.log('Token not found');
                            return;
                        }

                        const reward = getRandomLoot(loot.rarity);
                        let amount = 250;
                        if (reward) {
                            console.log(`You've obtained a ${reward.name}!`);
                            sendNotification("Loot Pickup", `Special Loot!! You got a: ${reward.name} as well as +200🎖️, +250 🪙`);
                            setLastNotified(prev => ({ ...prev, loot: today }));
                            addHealth(token, 20)
                            if (reward.category === "Currency") {
                                amount += 500;
                            } else {
                                additem(token, reward.name, reward.category); //adds item to player inventory
                            }

                        } else {
                            console.log('No special loot this time.');
                            sendNotification("Loot Pickup", "No special loot this time! +200🎖️, +250 🪙");
                            setLastNotified(prev => ({ ...prev, loot: today }));
                        }

                        lootpickup(loot.id, amount) // removes loot drop and adds money

                        try {
                        } catch (error) {
                            if (axios && axios.isAxiosError && axios.isAxiosError(error)) {
                                console.error('Axios error:', error.message);
                            } else {
                                console.error('Error:', error);
                            }
                        }
                        break;

                }
            }
        });

        missileData.forEach(missile => {
            const proximityStatus = checkMissileProximity(missile.destination, missile.radius, userLocation);
            const { text } = convertimestampfuturemissile(missile.etatimetoimpact);
            if (lastNotified.missile !== today) {
                switch (proximityStatus) {
                    case 'within-missile':
                        // Send specific notification if within the missile radius
                        if (missile.status === 'Incoming') {
                            sendNotification("RUN!! Missile Incoming!", `You are within the impact zone! Incoming Missile ETA: ${text}`);
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        if (missile.status === 'Hit') {
                            sendNotification("Danger!", "A Missile has impacted in your proximity! You may start taking damage!");
                            setLastNotified(prev => ({ ...prev, missile: today }));
                            Alert.alert("Danger!", "A Missile has impacted in your proximity! You may start taking damage!");

                            applyMissileDamage(missile.type, 30, missile.sentbyusername); //10 = damage for missile per 30 secs
                        }
                        break;
                    case 'near-missile':
                        // Send warning if near but not within the missile radius
                        if (missile.status === 'Incoming') {
                            // sendNotification("Incoming Missile Alert!", `Be wary, there is an incoming missile nearby. Incoming Missile ETA: ${text}`);
                            // setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        if (missile.status === 'Hit') {
                            sendNotification("Missile Impact Warning!", "Impacted Missile Nearby. Be wary of the fallout!");
                            setLastNotified(prev => ({ ...prev, missile: today }));
                        }
                        break;
                }
            }
        });
        //apply missile damage
        async function applyMissileDamage(missiletype: string, missileDamage: number, sentBy: string) {
            const health = await AsyncStorage.getItem('health');
            const token = await SecureStore.getItem("token");
        
            if (!health || !token) {
                console.error('Required data not found.');
                return;
            }
        
            let healthNumber = parseInt(health, 10);
            if (isNaN(healthNumber)) {
                console.error('Invalid health value:', health);
                return;
            }
        
            const applyDamage = async () => {
                startCountdown();  // Start countdown right before applying damage
                setTimeout(async () => {  // Wait 30 seconds before applying damage
                    healthNumber -= missileDamage;
                    await AsyncStorage.setItem('health', healthNumber.toString());
                    removeHealth(token, missileDamage) //remove db health
        
                    if (healthNumber <= 0) {
                        stopCountdown();
                        Alert.alert("Dead", `You have been killed by a ${missiletype} missile sent by user: ${sentBy}`);
                        console.log('User health has reached zero or below.');
                        await AsyncStorage.setItem(`isAlive`, `false`)
                        updateisAlive(token, false);
                        await AsyncStorage.setItem('health', '0'); // Set health to zero in storage
                        setHealth(token, 0) //set health 0 in DB
                    } else {
                        console.log(`User Health: ${healthNumber}`); // Only log if user is still alive
                        Alert.alert("Damaged", `You have taken ${missileDamage} damage`)
                        setTimeout(applyDamage, 30000); // Schedule next damage application 30 seconds later
                    }
                }, 30000);
            };
            startCountdown();
            applyDamage();  // Start the cycle immediately
        }        

        landmineData.forEach(landmine => {
            const proximityStatus = checkLootandLandmineProximity("landmine", landmine.location, userLocation, 10);
            if (lastNotified.landmine !== today) {
                switch (proximityStatus) {
                    case 'within-landmine':
                        //inside landmine radius
                        sendNotification("Danger!", `You just stepped on a Landmine! Damage has been taken.`);
                        setLastNotified(prev => ({ ...prev, landmine: today }));

                        Alert.alert("Danger!", "You have stepped on a Landmine!!");
                        applyLandmineDamage(landmine.id ,landmine.placedby)
                        break;
                    case 'near-landmine':
                        // Send warning if near but not within the landmine radius
                         sendNotification("Landmine Proximity Warning", "A landmine is nearby. Be cautious!");
                         setLastNotified(prev => ({ ...prev, landmine: today }));
                        break;
                }
            }
        });

        //apply Landmine damage
        async function applyLandmineDamage(landmineid: number, sentBy: string) {
            steppedonlandmine(landmineid)
            
            const token = SecureStore.getItem("token");
            if (token) {
                const health = await getHealth(token)

            if (!health || !token) {
                console.error('Required data not found.');
                return;
            }

            let healthNumber = parseInt(health, 10);
            if (isNaN(healthNumber)) {
                console.error('Invalid health value:', health);
                return;
            }

            async function applyDamage() {
                if (token === null) {
                    console.error('Token is null. Cannot proceed with applyDamage.');
                    return; // Exit the function if token is null
                }

                if (healthNumber <= 0) {
                    Alert.alert("Dead", `You have been killed by a Landmine placed by user: ${sentBy}`);
                    console.log('User health has reached zero or below.');
                    await AsyncStorage.setItem(`isAlive`, `false`);
                    updateisAlive(token, false);
                    await AsyncStorage.setItem('health', '0'); // Set health to zero in storage
                    setHealth(token, 0); // set health 0 in DB
                } else {
                    console.log(`User Health: ${healthNumber}`); // Only log if user is still alive
                }
            }

            applyDamage();  // Execute the function once
        }

        }

    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        checkAndNotify();
    }, [userLocation, lootLocations, missileData, landmineData, lastNotified]);

    useEffect(() => {
        const checkisAlive = async () => {
            try {
                const isAliveStatus = await AsyncStorage.getItem('isAlive');
                if (isAliveStatus === "false") {
                    const isAlive = JSON.parse(isAliveStatus);
                    setisAlive(isAlive)
                }
                if (isAliveStatus === "true") {
                    const isAlive = JSON.parse(isAliveStatus);
                    setisAlive(isAlive)
                } else {
                    setisAlive(false);
                }

            } catch (error) {
                console.error('Error initializing map:', error);
            }
        };
        const interval = setInterval(() => {
            checkisAlive()
            getCurrentLocationWrapper();
            checkAndNotify();
        }, 1000);

        return () => clearInterval(interval);
    }, [getCurrentLocationWrapper, checkAndNotify]);

    return null;
};    