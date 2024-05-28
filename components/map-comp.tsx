import React, { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import MapView from "react-native-maps";
import * as Location from 'expo-location';
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./all-landmines";
import { AllMissiles } from "./map-missile";
import { AllPlayers } from "./all-players";
import { Landmine, Loot, Missile } from "../types/types";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { loadLastKnownLocation, saveLocation } from '../util/mapstore';
import { getLocationPermission } from "../hooks/userlocation";
import { useUserName } from "../util/fetchusernameglobal";
import { dispatch } from "../api/dispatch";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const userName = useUserName();

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
                latitudeDelta: 0.1922,
                longitudeDelta: 0.1421
            };
            setRegion(newRegion);
            saveLocation(newRegion);
        } catch (error) {
            Alert.alert('Location Error', 'Unable to retrieve the current location.');
        }
    };

    useEffect(() => {
        const initializeLocation = async () => {
            const lastKnownLocation = await loadLastKnownLocation();
            if (lastKnownLocation) {
                setRegion(lastKnownLocation);
            } else {
                const status = await getLocationPermission();
                if (status === 'granted') {
                    getCurrentLocation();
                }
            }
        };

        fetchLootAndMissiles();
        initializeLocation();

        const intervalId = setInterval(() => {
            fetchLootAndMissiles();
            dispatchLocation();
        }, 30000);

        return () => clearInterval(intervalId);
    }, [fetchLootAndMissiles]); // Removed `userName` from dependencies as it's only needed in dispatchLocation

    return (
        <MapView
            className="flex-1"
            region={region}
            showsCompass={true}
            showsTraffic={true}
            showsUserLocation={true}
            showsMyLocationButton={true}
            customMapStyle={props.selectedMapStyle}>

            <AllLootDrops lootLocations={lootLocations} />
            <AllLandMines landminedata={landmineData} />
            <AllMissiles missileData={missileData} />
            <AllPlayers />
        </MapView>
    );
};
