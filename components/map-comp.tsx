import React, { useState } from "react"
import MapView from "react-native-maps"
import { AllLootDrops } from "./loot-drop";
import { AllLandMines } from "./all-landmines";
import { AllMissiles } from "./map-missile";
import { AllPlayers } from "./all-players";
import { Landmine, Loot, Missile } from "../types/types";

interface MapCompProps {
    lootLocations: Loot[];
    missileData: Missile[];
    landminedata: Landmine[];
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
    return (
        <MapView
        // no longer supported -> provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={props.selectedMapStyle} >
        
        {/* Render Loot Drops */}
        <AllLootDrops lootLocations={props.lootLocations} />

        {/* Render landmine Drops */}
        <AllLandMines landminedata={props.landminedata} />    

        {/* Render Missiles */}
        <AllMissiles missileData={props.missileData} />
        
        {/* Render Players */}
        <AllPlayers/>
      </MapView>
    )
}