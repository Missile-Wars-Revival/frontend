import React, { useEffect, useState, useCallback } from "react";
import { View,  Platform } from "react-native";
import MapView from "react-native-maps";

//Themes
import { DefaultMapStyle } from "../themes/defaultMapStyle";
import { RadarMapStyle } from "../themes/radarMapStyle";
import { CherryBlossomMapStyle } from "../themes/cherryBlossomMapStyle";
import { CyberpunkMapStyle } from "../themes/cyberpunkstyle";
import { ColorblindMapStyle } from "../themes/colourblindstyle";

//Types
import { Loot, Missile, Landmine } from "../types/types";

//Components:
import { MapStylePopup } from "../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle} from "../components/ui/mapthemestore"; //cache map theme 

//Hooks
import { AllMissiles } from "../components/map-missile";
import { AllLootDrops } from "../components/loot-drop";
import { fetchMissilesFromBackend, fetchLootFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { ThemeSelectButton } from "../components/theme-select-button";
import { FireSelector } from "../components/fire-selector";
import { AllLandMines } from "../components/all-landmines";
import { AllPlayers } from "../components/all-players";

export default function Map() {
  const defaultRegion = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0,
    longitudeDelta: 0,
  };

  const [region, setRegion] = useState(defaultRegion); //null was defaultRegion but zoomed in ugly
  const [selectedMapStyle, setSelectedMapStyle] = useState(DefaultMapStyle);
  const [ThemepopupVisible, setThemePopupVisible] = useState(false);
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

  //To allow player to upload their own this is modular

  const ThemeshowPopup = () => {
    //console.log("Popup button clicked");
    setThemePopupVisible(true);
  };
  
  const ThemeclosePopup = () => {
    setThemePopupVisible(false);
  };
  
  const selectMapStyle = (style: string) => {
    ThemeclosePopup();
    switch (style) {
      case "default":
        setSelectedMapStyle(DefaultMapStyle);
        break;
      case "radar":
        setSelectedMapStyle(RadarMapStyle);
        break;
      case "cherry":
        setSelectedMapStyle(CherryBlossomMapStyle);
        break;
      case "cyber":
        setSelectedMapStyle(CyberpunkMapStyle);
        break;
      case "colourblind":
        setSelectedMapStyle(ColorblindMapStyle);
        break;
      default:
        break;
    }
    // Store selected map style using storeMapStyle function from MapStorage.ts
    storeMapStyle(style);
  };

  return (
    <View className="flex-1 bg-gray-200">
      <MapView
        // no longer supported -> provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={selectedMapStyle} >
        
        {/* Render Loot Drops */}
        <AllLootDrops lootLocations={lootLocations} />

        {/* Render landmine Drops */}
        <AllLandMines landminedata={landminedata} />    

        {/* Render Missiles */}
        <AllMissiles missileData={missileData} />
        
        {/* Render Players */}
        <AllPlayers/>
      </MapView>

      {/* Dropdown button */}
      {Platform.OS === 'android' && (
        <ThemeSelectButton onPress={ThemeshowPopup}>Theme</ThemeSelectButton>
      )}

      <MapStylePopup
        visible={ThemepopupVisible}
        transparent={true}
        onClose={ThemeclosePopup}
        onSelect={selectMapStyle} />

      <FireSelector selectedMapStyle={[]} getStoredMapStyle={getStoredMapStyle} selectMapStyle={selectMapStyle} />
  </View>
  );
}