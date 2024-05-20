import React, { useState } from "react";
import { View,  Platform } from "react-native";

//Android Themes
import { androidDefaultMapStyle } from "../map-themes/Android-themes/defaultMapStyle";
import { androidRadarMapStyle } from "../map-themes/Android-themes/radarMapStyle";
import { androidCherryBlossomMapStyle } from "../map-themes/Android-themes/cherryBlossomMapStyle";
import { androidCyberpunkMapStyle } from "../map-themes/Android-themes/cyberpunkstyle";
import { androidColorblindMapStyle } from "../map-themes/Android-themes/colourblindstyle";
//Ignore errors here for now 
import { IOSDefaultMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSRadarMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSCherryBlossomMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSCyberpunkMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSColorblindMapStyle } from "../map-themes/IOS-themes/themestemp";

// Components
import { MapStylePopup } from "../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle } from "../components/ui/mapthemestore";
import { ThemeSelectButton } from "../components/theme-select-button";
import { FireSelector } from "../components/fire-selector";
import { MapComp } from "../components/map-comp";
import { MapStyle } from "../types/types";

export default function Map() {
  
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);

  const showPopup = () => {
    setThemePopupVisible(true);
  };

  const closePopup = () => {
    setThemePopupVisible(false);
  };

  const selectMapStyle = (style: string) => {
    closePopup();

    //chooses style based on platform version
    let selectedStyle;
    switch (style) {
      case "default":
        selectedStyle = Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle;
        break;
      case "radar":
        selectedStyle = Platform.OS === 'android' ? androidRadarMapStyle : IOSRadarMapStyle;
        break;
      case "cherry":
        selectedStyle = Platform.OS === 'android' ? androidCherryBlossomMapStyle : IOSCherryBlossomMapStyle;
        break;
      case "cyber":
        selectedStyle = Platform.OS === 'android' ? androidCyberpunkMapStyle : IOSCyberpunkMapStyle;
        break;
      case "colourblind":
        selectedStyle = Platform.OS === 'android' ? androidColorblindMapStyle : IOSColorblindMapStyle;
        break;
      default:
        selectedStyle = Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle;
    }
    setSelectedMapStyle(selectedStyle);
    storeMapStyle(style);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'gray' }}>
      <MapComp selectedMapStyle={selectedMapStyle} />

       
        {/* To hide the theme button on iOS, uncomment the next line  */}
        {Platform.OS === 'android' && (
     
      <ThemeSelectButton onPress={showPopup}>Theme</ThemeSelectButton>
       )}
       {/* and this bracket above */}

      <MapStylePopup
        visible={themePopupVisible}
        transparent={true}
        onClose={closePopup}
        onSelect={selectMapStyle}
      />
      <FireSelector 
        selectedMapStyle={selectedMapStyle} 
        getStoredMapStyle={getStoredMapStyle} 
        selectMapStyle={selectMapStyle} 
      />
    </View>
  );
}