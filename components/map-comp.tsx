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
import { getLocationPermission } from "../hooks/userlocation";
import { useToken, useUserName } from "../util/fetchusernameglobal";
import { dispatch } from "../api/dispatch";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from "../util/locationreq";
import { mainmapstyles } from "../map-themes/map-stylesheet";
import { location } from "../util/locationreq";
import { DefRegLocationTask } from "../util/backgroundtasks";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const userName = useUserName();
    const token = useToken();
    const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDbConnection, setDbConnection] = useState<boolean>();
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
        const location: location = await getCurrentLocation();
        if (token && location.latitude && location.longitude) {
            await dispatch(token, location.latitude, location.longitude);
        }
    };

    const getlocation = async () => {
        try {
            const location: location = await getCurrentLocation();
            const newRegion = {
                latitude: location.latitude,
                longitude: location.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
            setRegion(newRegion);
            await saveLocation(newRegion); 
            setIsLoading(false); 
        } catch {
            Alert.alert(
                "Location",
                "Please enable your location to continue using the app",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "Confirm" }
                ]
            );
        }
    };

    useEffect(() => {
        const initializeApp = async () => {
            try {
                // Check if it's the first load
                const isFirstLoad = await AsyncStorage.getItem('firstload');
                const isDBConnection = await AsyncStorage.getItem('dbconnection');
                if (isFirstLoad == null) {
                    Alert.alert(
                        "Your location is set to Global",
                        "This means everyone in your league can see your location.",
                        [
                            { text: "OK", onPress: () => setFirstLoad(false) } 
                        ]
                    );
                    setFirstLoad(true); 
                } 
                if (isDBConnection === "false"){
                    setDbConnection(false)
                } 
                if (isDBConnection === "true"){
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
    
                const intervalId = setInterval(async () => {
                    // Periodically check DB connection status
                    const dbConnStatus = await AsyncStorage.getItem('dbconnection');
                    if (dbConnStatus === "false"){
                        setDbConnection(false)
                    } 
                    if (dbConnStatus === "true"){
                        setDbConnection(true)
                    } else {
                        setDbConnection(false);
                    }
    
                    fetchLootAndMissiles();
                    getLocationPermission();
                    dispatchLocation();
                    DefRegLocationTask();
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
                            console.log("Mode changed to:", newMode);
                        }
                    }
                ]
            );
        } else {
            await AsyncStorage.setItem('visibilitymode', newMode);
        }

        console.log("Mode changed to:", newMode);
    };

    const friendsorglobal = (visibilitymode: 'friends' | 'global') => {
        console.log("Mode changed to:", visibilitymode);
    };

    useEffect(() => {
        const saveFirstLoadStatus = async () => {
            await AsyncStorage.setItem('firstload', 'false');
        };

        if (!firstLoad) {
            saveFirstLoadStatus();
        }
    }, [firstLoad]);

    // Only show loader if it's the first load and still loading
    if (isLoading && firstLoad) {
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