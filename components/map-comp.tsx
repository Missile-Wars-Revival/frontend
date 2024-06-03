import React, { useCallback, useEffect, useState } from "react";
import { View, StyleSheet, Text, Switch, Alert } from "react-native";
import MapView from "react-native-maps";
import * as Location from 'expo-location';
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./Landmine/map-landmines";
import { AllMissiles } from "./Missile/map-missile";
import { AllPlayers } from "./map-players";
import { Landmine, Loot, Missile } from "middle-earth";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import { getLocationPermission } from "../hooks/userlocation";
import { useUserName } from "../util/fetchusernameglobal";
import { dispatch } from "../api/dispatch";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const userName = useUserName();
    const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
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
        if (userName && region.latitude && region.longitude) {
            console.log('Dispatch Response:', await dispatch(userName, region.latitude, region.longitude));
        }
    };

    const getCurrentLocation = async () => {
        try {
            let location = await Location.getCurrentPositionAsync({});
            const newRegion = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
            };
            setRegion(newRegion);
            await saveLocation(newRegion); // Cache the region
        } catch (error) {
            console.error('Error getting current location:', error);
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
                console.error('Error loading cached data:', error);
            }
        };

        const initializeLocation = async () => {
            const status = await getLocationPermission();
            setIsLocationEnabled(status === 'granted');
        };

        initializeLocation();
        loadCachedData();
        getCurrentLocation();
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

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
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
            {!isLocationEnabled && (
                <View 
                style={styles.overlay} />
            )}
            <View style={styles.switchContainer}>
                <Switch
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={visibilitymode === 'global' ? "#f4f3f4" : "#f4f3f4"}
                    ios_backgroundColor="#3e3e3e"
                    onValueChange={toggleMode}
                    value={visibilitymode === 'global'}
                />
                <Text style={styles.switchText}>{visibilitymode === 'global' ? 'Global' : 'Friends'}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        opacity: 0.6,
        justifyContent: 'center', 
        alignItems: 'center', 
    },
    switchContainer: {
        position: 'absolute',
        top: 50,
        left: 330,
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchText: {
        marginLeft: -110,
        color: 'white',
    },
});
