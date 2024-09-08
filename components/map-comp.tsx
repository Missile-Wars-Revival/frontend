import React, { useEffect, useState } from "react";
import { View, Text, Switch, Alert, Platform, ActivityIndicator, TouchableOpacity, useColorScheme } from "react-native";
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { AllLootDrops } from "./Loot/map-loot";
import { AllLandMines } from "./Landmine/map-landmines";
import { AllMissiles } from "./Missile/map-missile";
import { AllPlayers } from "./map-players";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import { getLocationPermission, getlocation } from "../util/locationreq";
import { dispatch } from "../api/dispatch";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from "../util/locationreq";
import { getMainMapStyles } from "../map-themes/map-stylesheet";
import { DefRegLocationTask } from "../util/backgroundtasks";
import * as SecureStore from "expo-secure-store";
import { updateFriendsOnlyStatus } from "../api/visibility";
import useFetchMissiles from "../hooks/websockets/missilehook";
import useFetchLoot from "../hooks/websockets/loothook";
import useFetchLandmines from "../hooks/websockets/landminehook";
import { FontAwesome } from '@expo/vector-icons';

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {

    //WS hooks
    const missileData = useFetchMissiles()
    const lootData = useFetchLoot()
    const LandmineData = useFetchLandmines()

    const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDbConnection, setDbConnection] = useState<boolean>(true);
    const [isAlive, setisAlive] = useState<boolean>(true);
    const [firstLoad, setFirstLoad] = useState<boolean>();
    const [visibilitymode, setMode] = useState<'friends' | 'global'>('global');

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const mainmapstyles = getMainMapStyles(isDarkMode);

    const [region, setRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const cachedRegion = await loadLastKnownLocation();
                if (cachedRegion !== null) {
                    setRegion(cachedRegion);
                }

                // Check if it's the first load & DB Connection
                const isFirstLoad = await AsyncStorage.getItem('firstload');
                const isDBConnection = await AsyncStorage.getItem('dbconnection');

                const token = await SecureStore.getItemAsync("token");
                if (!token) {
                    console.error("Authentication token is missing");
                    return; // Exit function if no token is found
                }
                if ((isFirstLoad == null) || (isFirstLoad === `true`)) {
                    setFirstLoad(true);
                    Alert.alert(
                        "Your location is set to Global",
                        "This means everyone in your league can see your location.",
                        [
                            { text: "OK", onPress: () => console.log("Global button pressed") }
                        ]
                    );
                    await updateFriendsOnlyStatus(false);

                    const savedlocation = await loadLastKnownLocation();
                    if (savedlocation == null) {
                        await getlocation();
                    }
                    setRegion(savedlocation);
                    await DefRegLocationTask();

                    await AsyncStorage.setItem('firstload', 'false');
                    setFirstLoad(false);
                }
                if (isDBConnection === "false") {
                    setDbConnection(false)
                }
                if (isDBConnection === "true") {
                    setDbConnection(true)
                } else {
                    setDbConnection(false);
                    setFirstLoad(false);
                }

                const cachedMode = await AsyncStorage.getItem('visibilitymode');
                if (cachedMode !== null) {
                    setMode(cachedMode as 'friends' | 'global');
                }
                getLocationPermission();
                const status = await getLocationPermission();
                setIsLocationEnabled(status === 'granted');

                await dispatchLocation();

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
                            setisAlive(true); // Assume false if nothing is stored
                        }
                    } catch (error) {
                        setisAlive(false); // Set to a default value in case of error
                    }

                }, 1000);

                return () => clearInterval(intervalId);
            } catch (error) {
                setIsLoading(false);
                console.error('Error initializing app:', error);
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        const checkVisibilityMode = async () => {
            const storedMode = await AsyncStorage.getItem('visibilitymode');
            if (storedMode !== null && storedMode !== visibilitymode) {
                setMode(storedMode as 'friends' | 'global');
            }
        };

        const intervalId = setInterval(checkVisibilityMode, 5000); // Check every 5 seconds

        return () => clearInterval(intervalId); // Cleanup on unmount
    }, [visibilitymode]);

    const dispatchLocation = async () => {
        try {
            const location = await getCurrentLocation();
            getlocation()
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
                            await updateFriendsOnlyStatus(friendsOnly);
                            console.log("FriendsOnly status updated successfully to:", friendsOnly);
                            console.log("Mode changed to:", newMode);
                        }
                    }
                ]
            );
        } else {
            await AsyncStorage.setItem('visibilitymode', newMode);
            await updateFriendsOnlyStatus(friendsOnly);
            console.log("FriendsOnly status updated successfully to:", friendsOnly);
        }

        console.log("Mode changed to:", newMode);
    };

    const friendsorglobal = (visibilitymode: 'friends' | 'global') => {
        console.log("Mode changed to:", visibilitymode);
    };

    if (firstLoad === true) {
        return (
            <View style={mainmapstyles.loaderContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text></Text>
                <Text style={mainmapstyles.overlayText}>Connecting To Servers For The First Time...</Text>
            </View>
        );
    }

    const relocate = async (setRegion: (arg0: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number; }) => void) => {
        try {
            const cachedLocation = await loadLastKnownLocation();
            if (cachedLocation) {
                setRegion(cachedLocation);
            } else {
                // Fallback to getting current location if cached location is not available
                const location = await getCurrentLocation();
                if (location) {
                    const newRegion = {
                        latitude: location.latitude,
                        longitude: location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                    };
                    await saveLocation(newRegion);
                    setRegion(newRegion);
                }
            }
        } catch (error) {
            console.error("Error relocating:", error);
        }
    };

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
                <AllLootDrops lootLocations={lootData} />
                <AllLandMines landminedata={LandmineData} />
                <AllMissiles missileData={missileData} />
                <AllPlayers />
            </MapView>
            <TouchableOpacity
                style={mainmapstyles.relocateButton}
                onPress={() => relocate(setRegion)}>
                <FontAwesome name="location-arrow" size={24} color="#ffffff" />
            </TouchableOpacity>
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
                <Text style={mainmapstyles.switchText}>{visibilitymode === 'global' ? 'Global' : 'Friends'}</Text>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={visibilitymode === 'global' ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleMode}
                    value={visibilitymode === 'global'}
                />
            </View>
        </View>
    );
};