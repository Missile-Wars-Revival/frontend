import React, { useCallback, useEffect, useState } from "react"
import MapView from "react-native-maps"
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./all-landmines";
import { AllMissiles } from "./map-missile";
import { AllPlayers } from "./all-players";
import { Landmine, Loot, Missile } from "../types/types";
import { fetchLootFromBackend, fetchMissilesFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";

interface MapCompProps {
    selectedMapStyle: any;
}

export const MapComp = (props: MapCompProps) => {
    const defaultRegion = {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
      };
      
    const [region, setRegion] = useState(defaultRegion); //null was defaultRegion but zoomed in ugly
    const [lootLocations, setLootLocations] = useState<Loot[]>([]);
    const [missileData, setMissileData] = useState<Missile[]>([]);
    const [landminedata, setlandminelocations] = useState<Landmine[]>([]);

    const fetchLootAndMissiles = useCallback(() => {
        //fetch dist
          const updateData = async () => {
          const lootData = await fetchLootFromBackend();
          const landminedata = await fetchlandmineFromBackend();
          const missileData = await fetchMissilesFromBackend();
    
          setLootLocations(lootData);
          setlandminelocations(landminedata);
          setMissileData(missileData);
        };
    
        // Initial fetch
        updateData();
    
        // Fetch data every 30 seconds
        const intervalId = setInterval(updateData, 30000); // 30 seconds
    
        // Cleanup interval on component unmount
        return () => {
          clearInterval(intervalId);
        };
      }, []);
    
      useEffect(() => {
        fetchLootAndMissiles();
      }, [fetchLootAndMissiles]);
      
    return (
        <MapView
        // no longer supported -> provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={region}
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
        <AllPlayers/>
      </MapView>
    )
}