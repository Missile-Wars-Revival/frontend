import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Switch, Alert, Platform, ActivityIndicator } from "react-native";
import MapView, { PROVIDER_DEFAULT, PROVIDER_GOOGLE } from "react-native-maps";
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./Landmine/map-landmines";
import { AllMissiles } from "./Missile/map-missile";
import { AllPlayers } from "./map-players";
import { GeoLocation, Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import { getLocationPermission } from "../hooks/userlocation";
import { useToken, useUserName } from "../util/fetchusernameglobal";
import { dispatch } from "../api/dispatch";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentLocation } from "../util/locationreq";
import { mainmapstyles } from "../map-themes/map-stylesheet";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const userName = useUserName();
    const token = useToken();
    const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hasDbConnection, setDbConnection] = useState(false);
    const [visibilitymode, setMode] = useState<'friends' | 'global'>('friends');

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
        //temp location should be in dispatch.ts V
        setDbConnection(true);
        const location: GeoLocation = await getCurrentLocation();
        if (token && userName && location.latitude && location.longitude) {
            await dispatch(token, userName, location.latitude, location.longitude);
            //console.log("dispatching", location, userName, token)
        }
    };

    const getlocation = async () => {
        try {
            const location: GeoLocation = await getCurrentLocation(); // Use the defined type
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
        const loadCachedData = async () => {
            try {
                const cachedRegion = await loadLastKnownLocation();
                if (cachedRegion !== null) {
                    setRegion(cachedRegion);
                }
                const cachedMode = await AsyncStorage.getItem('visibilitymode');
                if (cachedMode !== null) {
                    setMode(cachedMode as 'friends' | 'global');
                }
            } catch (error) {
                setIsLoading(false); 
                console.error('Error loading cached data:', error);
            }
        };

        const initializeLocation = async () => {
            try {
                const status = await getLocationPermission();
                setIsLocationEnabled(status === 'granted');
            } catch {
                setIsLoading(false); 
            }
        };

        initializeLocation();
        loadCachedData();
        getlocation();
        fetchLootAndMissiles();
        dispatchLocation();

        const intervalId = setInterval(() => {
            fetchLootAndMissiles();
            initializeLocation();
            dispatchLocation();
        }, 1000);

        return () => clearInterval(intervalId);
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
                            await AsyncStorage.setItem('visibilitymode', newMode); // Save the new mode only if confirmed
                            console.log("Mode changed to:", newMode);
                        }
                    }
                ]
            );
        } else {
            await AsyncStorage.setItem('visibilitymode', newMode); // Save the new mode directly if not switching to global (e.g. switching from global -> friends)
        }

        console.log("Mode changed to:", newMode);
    };

    const friendsorglobal = (visibilitymode: 'friends' | 'global') => {
        // Do something based on the mode, e.g., fetch different data (friend/global)
        console.log("Mode changed to:", visibilitymode);
    };

    if (isLoading) {
        return (
        <View style={mainmapstyles.loaderContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text></Text>
            <Text style={mainmapstyles.overlayText}>Loading the Map for the first time!</Text>
        </View>
        );
    }

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