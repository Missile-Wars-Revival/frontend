import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Switch, Alert, Platform, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./Landmine/map-landmines";
import { AllMissiles } from "./Missile/map-missile";
import { AllPlayers } from "./map-players";
import { Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import { getLocationPermission } from "../util/locationreq";
import { dispatch } from "../api/dispatch";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation, location } from "../util/locationreq";
import { mainmapstyles } from "../map-themes/map-stylesheet";
import { DefRegLocationTask } from "../util/backgroundtasks";
import * as SecureStore from "expo-secure-store";
import { updateFriendsOnlyStatus } from "../api/visibility";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDbConnection, setDbConnection] = useState<boolean>();
    const [isAlive, setisAlive] = useState<boolean>(true);
    const [firstLoad, setFirstLoad] = useState<boolean>(true);
    const [visibilitymode, setMode] = useState<'friends' | 'global'>('global');

    const [region, setRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.1922,
        longitudeDelta: 0.1421,
    });
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landmineData, setLandmineLocations] = useState<Landmine[]>([]);

    const fetchLootAndMissiles = useCallback(async () => {
        setLootLocations(await fetchLootFromBackend());
        setLandmineLocations(await fetchlandmineFromBackend());
        setMissileData(await fetchMissilesFromBackend());
    }, []);

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
    };


    const getlocation = async () => {
        try {
            const location = await getCurrentLocation();
            const newRegion = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
            setRegion(newRegion);
            await saveLocation(newRegion);
            setIsLoading(false);
        } catch (error) {
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Check if it's the first load
                const isFirstLoad = await AsyncStorage.getItem('firstload');
                const isDBConnection = await AsyncStorage.getItem('dbconnection');
                const token = await SecureStore.getItemAsync("token");
                if (!token) {
                    console.error("Authentication token is missing");
                    return; // Exit function if no token is found
                }
                if (isFirstLoad == null) {
                    Alert.alert(
                        "Your location is set to Global",
                        "This means everyone in your league can see your location.",
                        [
                            { text: "OK", onPress: () => setFirstLoad(false) }
                        ]
                    );
                    await updateFriendsOnlyStatus(token, false);
                    setFirstLoad(false);
                    await AsyncStorage.setItem('firstload', 'false');
                }
                if (isDBConnection === "false") {
                    setDbConnection(false)
                }
                if (isDBConnection === "true") {
                    setDbConnection(true)
                } else {
                    setDbConnection(false);
                }

                const cachedRegion = await loadLastKnownLocation();
                if (cachedRegion !== null) {
                    setRegion(cachedRegion);
                }

                const cachedMode = await AsyncStorage.getItem('visibilitymode');
                if (cachedMode !== null) {
                    setMode(cachedMode as 'friends' | 'global');
                }

                const status = await getLocationPermission();
                setIsLocationEnabled(status === 'granted');

                await getlocation();
                await fetchLootAndMissiles();
                await dispatchLocation();
                await DefRegLocationTask();

                const intervalId = setInterval(async () => {
                    // Periodically check DB connection status
                    const dbConnStatus = await AsyncStorage.getItem('dbconnection');
                    if (dbConnStatus === "false") {
                        setDbConnection(false)
                    }
                    if (dbConnStatus === "true") {
                        setDbConnection(true)
                    } else {
                        setDbConnection(false);
                    }
                    try {
                        const isAliveStatus = await AsyncStorage.getItem('isAlive');
                        if (isAliveStatus !== null) {
                            const isAliveData = JSON.parse(isAliveStatus); // Converts the string to an object
                            if (typeof isAliveData === 'object' && isAliveData.hasOwnProperty('isAlive')) {
                                const isAlive = isAliveData.isAlive; // Extract the boolean value from the object
                                setisAlive(isAlive);
                            } else {
                                // Handle unexpected format
                                setisAlive(false);
                            }
                        } else {
                            // Handle null (e.g., key does not exist)
                            setisAlive(false); // Assume false if nothing is stored
                        }
                    } catch (error) {
                        setisAlive(false); // Set to a default value in case of error
                    }

                    fetchLootAndMissiles();
                    getLocationPermission();
                    dispatchLocation();
                }, 1000);

                return () => clearInterval(intervalId);
            } catch (error) {
                setIsLoading(false);
                console.error('Error initializing app:', error);
            }
        };

        initializeApp();
    }, [fetchLootAndMissiles]);

    const toggleMode = async () => {
        const newMode = visibilitymode === 'friends' ? 'global' : 'friends';
        setMode(newMode);
        friendsorglobal(newMode);
        const token = await SecureStore.getItemAsync("token");

        if (!token) {
            console.error("Authentication token is missing");
            return; // Exit function if no token is found
        }

        const friendsOnly = newMode === 'friends';

        if (newMode === 'global') {
            Alert.alert(
                "Change to Global Mode",
                "You are about to change your visibility to global. Everyone will be able to see your location.",
                [
                    {
                        text: "Cancel",
                        onPress: () => {
                            console.log("Change cancelled");
                            setMode('friends');
                        },
                        style: "cancel"
                    },
                    {
                        text: "Confirm",
                        onPress: async () => {
                            await AsyncStorage.setItem('visibilitymode', newMode);
                            await updateFriendsOnlyStatus(token, friendsOnly);
                            console.log("FriendsOnly status updated successfully to:", friendsOnly);
                            console.log("Mode changed to:", newMode);
                        }
                    }
                ]
            );
        } else {
            await AsyncStorage.setItem('visibilitymode', newMode);
            await updateFriendsOnlyStatus(token, friendsOnly);
            console.log("FriendsOnly status updated successfully to:", friendsOnly);
        }

        console.log("Mode changed to:", newMode);
    };

    const friendsorglobal = (visibilitymode: 'friends' | 'global') => {
        console.log("Mode changed to:", visibilitymode);
    };

    // Only show loader if it's the first load or still loading
    if (isLoading && !firstLoad) {
        return (
            <View style={mainmapstyles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text></Text>
                <Text style={mainmapstyles.overlayText}>Connecting To Servers...</Text>
            </View>
        );
    }

    // Render map and other components once initialization is complete
    return (
        <View style={mainmapstyles.container}>
            <MapView
                style={mainmapstyles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
                region={region}
                showsCompass={false}
                showsTraffic={false}
                showsUserLocation={true}
                showsMyLocationButton={true}
                customMapStyle={props.selectedMapStyle}>
                <AllLootDrops lootLocations={lootLocations} />
                <AllLandMines landminedata={landmineData} />
                <AllMissiles missileData={missileData} />
                <AllPlayers />
            </MapView>
            {(!isAlive) && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is disabled due to your death</Text>
                    <Text style={mainmapstyles.overlaySubText}>Please check wait the designated time or watch an advert!</Text>
                </View>
            )}
            {(!isLocationEnabled || !hasDbConnection) && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is disabled due to location/database issues.</Text>
                    <Text style={mainmapstyles.overlaySubText}>Please check your settings or try again later.</Text>
                </View>
            )}
            <View style={mainmapstyles.switchContainer}>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={visibilitymode === 'global' ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleMode}
                    value={visibilitymode === 'global'}
                />
                <Text style={mainmapstyles.switchText}>{visibilitymode === 'global' ? 'Global' : 'Friends'}</Text>
            </View>
        </View>
    );
};