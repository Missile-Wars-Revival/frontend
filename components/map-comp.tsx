import React, { useEffect, useState, useMemo } from "react";
import { View, Text, Switch, Alert, TouchableOpacity, useColorScheme } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Circle } from "react-native-maps";
import { AllLootDrops } from "./Loot/map-loot";
import { AllLandMines } from "./Landmine/map-landmines";
import { AllMissiles } from "./Missile/map-missile";
import { AllPlayers } from "./map-players";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from "../util/locationreq";
import { dispatch } from "../api/dispatch";
import * as SecureStore from "expo-secure-store";
import { getMainMapStyles } from "../map-themes/stylesheet";
import { updateFriendsOnlyStatus } from "../api/visibility";
import useFetchMissiles from "../hooks/websockets/missilehook";
import useFetchLoot from "../hooks/websockets/loothook";
import useFetchLandmines from "../hooks/websockets/landminehook";
import FontAwesome from '@react-native-vector-icons/fontawesome';
import useFetchOther from "../hooks/websockets/otherhook";
import { AllOther } from "./Other/map-other";
import { getLeagueAirspace } from "./player";
import { useUserLeague } from "@/hooks/api/useUserLeague";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {

    //WS hooks
    const missileData = useFetchMissiles()
    const lootData = useFetchLoot()
    const otherData = useFetchOther()
    const LandmineData = useFetchLandmines()

    // API hooks (must be called unconditionally at top)
    const userLeague = useUserLeague();

    const [hasDbConnection, setDbConnection] = useState<boolean>(true);
    const [isAlive, setisAlive] = useState<boolean>(true);
    const [visibilitymode, setMode] = useState<'friends' | 'global'>('global');
    const [locActive] = useState<boolean>(true);
    const [isMapDisabled, setIsMapDisabled] = useState(false);

    const colorScheme = useColorScheme();
    const isDarkMode = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const mainmapstyles = useMemo(() => getMainMapStyles(isDarkMode), [isDarkMode]);

    const [region, setRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        pitch: 0,
        heading: 0
    });

    const [userLocation, setUserLocation] = useState({
        latitude: 0,
        longitude: 0
    });

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const cachedRegion = await loadLastKnownLocation();
                if (cachedRegion !== null) {
                    setRegion(cachedRegion);
                }

                // Check DB Connection
                const isDBConnection = await AsyncStorage.getItem('dbconnection');

                const token = await SecureStore.getItemAsync("token");
                if (!token) {
                    console.error("Authentication token is missing");
                    // Don't return here, continue with the rest of the initialization
                }

                if (isDBConnection === "false") {
                    setDbConnection(false);
                } else if (isDBConnection === "true") {
                    setDbConnection(true);
                } else {
                    setDbConnection(false);
                }

                const cachedMode = await AsyncStorage.getItem('visibilitymode');
                if (cachedMode !== null) {
                    setMode(cachedMode as 'friends' | 'global');
                }
            } catch (error) {
                console.error('Error initializing app:', error);
            }
        };

        initializeApp();
    }, []);

    // Periodic polling for DB connection and alive status (with proper cleanup)
    useEffect(() => {
        const pollStatus = async () => {
            // Periodically check DB connection status
            const dbConnStatus = await AsyncStorage.getItem('dbconnection');
            if (dbConnStatus === "false") {
                setDbConnection(false);
            } else if (dbConnStatus === "true") {
                setDbConnection(true);
            } else {
                setDbConnection(false);
            }
            try {
                const isAliveStatus = await AsyncStorage.getItem('isAlive');
                if (isAliveStatus !== null) {
                    const isAliveData = JSON.parse(isAliveStatus); // Converts the string to an object
                    if (typeof isAliveData === 'object' && isAliveData != null && 'isAlive' in isAliveData) {
                        const isAliveVal = isAliveData.isAlive; // Extract the boolean value from the object
                        setisAlive(isAliveVal);
                    } else {
                        // Handle unexpected format
                        setisAlive(false);
                    }
                } else {
                    // Handle null (e.g., key does not exist)
                    setisAlive(true); // Assume true if nothing is stored
                }
            } catch {
                setisAlive(true);
            }
        };

        // Run once immediately
        pollStatus();

        const intervalId = setInterval(pollStatus, 1000);

        return () => {
            clearInterval(intervalId);
        };
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

    useEffect(() => {
        const checkMapStatus = async () => {
            const status = await AsyncStorage.getItem('mapDisabled');
            setIsMapDisabled(status === 'true');
        };
        checkMapStatus();
    }, []);

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

    useEffect(() => {
        let isSubscribed = true;
        let dispatchCounter = 0;

        const updateLocation = async () => {
            try {
                const location = await getCurrentLocation();
                if (isSubscribed) {
                    setUserLocation({
                        latitude: location.latitude,
                        longitude: location.longitude
                    });

                    // Dispatch location to backend every 5 seconds so missile/landmine
                    // endpoints can look up the user's current location from the DB.
                    dispatchCounter++;
                    if (dispatchCounter >= 5) {
                        dispatchCounter = 0;
                        const token = await SecureStore.getItemAsync('token');
                        if (token) {
                            dispatch(token, location.latitude, location.longitude).catch(
                                (err) => console.warn('Location dispatch failed:', err)
                            );
                        }
                    }
                }
            } catch (error) {
                console.error('Error updating location:', error);
            }
        };

        // Initial location update
        updateLocation();

        // Set up interval for periodic updates
        const intervalId = setInterval(updateLocation, 1000);

        return () => {
            isSubscribed = false;
            clearInterval(intervalId);
        };
    }, []);

    const relocate = async () => {
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
                        longitudeDelta: 0.01,
                        pitch: 0,
                        heading: 0
                    };
                    await saveLocation(newRegion);
                    setRegion(newRegion);
                }
            }
        } catch (error) {
            console.error("Error relocating:", error);
        }
    };

    const leagueairspace = getLeagueAirspace(userLeague?.league || 'bronze');

    // Render map and other components once initialization is complete
    return (
        <View style={mainmapstyles.container}>
            <View style={{ width: '100%', height: '100%' }}>
                <MapView
                    style={[mainmapstyles.map, isMapDisabled && mainmapstyles.disabledMap]}
                    region={region}
                    showsCompass={false}
                    showsTraffic={false}
                    showsUserLocation={true}
                    pitchEnabled={true}
                    rotateEnabled={true}
                    scrollEnabled={true}
                    zoomEnabled={true}
                    showsMyLocationButton={false}
                    customMapStyle={props.selectedMapStyle}>
                    <Circle
                        center={{
                            latitude: userLocation.latitude,
                            longitude: userLocation.longitude,
                        }}
                        radius={typeof leagueairspace === 'number' ? leagueairspace : 0}
                        fillColor="rgba(0, 0, 0, 0)"
                        strokeColor="rgba(0, 255, 0, 0.5)"
                    />
                    <AllPlayers />
                    <AllLootDrops lootLocations={lootData} />
                    <AllOther OtherLocations={otherData} />
                    <AllLandMines landminedata={LandmineData} />
                    <AllMissiles missileData={missileData} />
                </MapView>
            </View>
            <TouchableOpacity
                style={[mainmapstyles.relocateButton, { bottom: insets.bottom + 40 }]}
                onPress={relocate}>
                <FontAwesome name="location-arrow" size={24} color="#ffffff" />
            </TouchableOpacity>
            {(!isAlive) && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is disabled due to your death</Text>
                    <Text style={mainmapstyles.overlaySubText}>Please check wait the designated time or watch an advert!</Text>
                </View>
            )}
            {(!hasDbConnection) && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is disabled due to database issues.</Text>
                    <Text style={mainmapstyles.overlaySubText}>Please check your settings or try again later.</Text>
                </View>
            )}
            {!locActive && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is disabled due to location being turned off.</Text>
                    <Text style={mainmapstyles.overlaySubText}>Please enable location in settings to use the map.</Text>
                </View>
            )}
            {isMapDisabled && (
                <View style={mainmapstyles.overlay}>
                    <Text style={mainmapstyles.overlayText}>Map is currently disabled</Text>
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