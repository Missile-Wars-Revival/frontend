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

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const [region, setRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
    });
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landminedata, setlandminelocations] = useState<Landmine[]>([]);

    const fetchLootAndMissiles = useCallback(async () => {
        const lootData = await fetchLootFromBackend();
        const landminedata = await fetchlandmineFromBackend();
        const missileData = await fetchMissilesFromBackend();

        setLootLocations(lootData);
        setlandminelocations(landminedata);
        setMissileData(missileData);
    }, []);

    const getLocationPermission = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need location permissions to make this work!');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        const newRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.1922,
            longitudeDelta: 0.1421
        };
        setRegion(newRegion);
        saveLocation(newRegion);
    };

    useEffect(() => {
        const initializeRegion = async () => {
            const lastKnownLocation = await loadLastKnownLocation();
            if (lastKnownLocation) {
                setRegion(lastKnownLocation);
            } else {
                getLocationPermission();
            }
        };

        fetchLootAndMissiles();
        initializeRegion();

        const intervalId = setInterval(fetchLootAndMissiles, 30000); // Refresh data every 30 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [fetchLootAndMissiles]);

    return (
        <MapView
            className="flex-1"
            region={region}
            showsCompass={true}
            showsTraffic={false}
            showsUserLocation={true}
            showsMyLocationButton={true}
            customMapStyle={props.selectedMapStyle} >

            {/* Render Loot Drops */}
            <AllLootDrops lootLocations={lootLocations} />

            {/* Render landmine Drops */}
            <AllLandMines landminedata={landminedata} />

            {/* Render Missiles */}
            <AllMissiles missileData={missileData} />

            {/* Render Players */}
            <AllPlayers />
        </MapView>
    );
};
