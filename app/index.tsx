import React, { useEffect, useState } from "react";
import { View,  Platform } from "react-native";

// Components
import { MapStylePopup } from "../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle } from "../util/mapstore";
import { ThemeSelectButton } from "../components/theme-select-button";
import { FireSelector } from "../components/fire-selector";
import { MapComp } from "../components/map-comp";
import { MapStyle } from "../types/types";
import { getCredentials } from "../util/logincache";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Map() {
  const [userNAME, setUsername] = useState("");

  //pull from map-comp
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  // Fetch username from secure storage
  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await getCredentials();
      if (credentials) {
        setUsername(credentials.username);
      } else {
        //console.log('Credentials not found, please log in');
        // Optionally redirect to login page
        router.navigate("/login");
      }
    };
  
    fetchCredentials();
  }, []);

  useEffect(() => {
    const fetchStoredMapStyle = async () => {
      try {
        const storedMapStyle = await AsyncStorage.getItem("selectedMapStyle");
        if (storedMapStyle && mapStyles.hasOwnProperty(storedMapStyle)) {
          setSelectedMapStyle(mapStyles[storedMapStyle as keyof typeof mapStyles]);
        } else {
          setSelectedMapStyle(mapStyles.default);
        }
      } catch (error) {
        console.error("Error fetching stored map style: ", error);
        // Fallback to default map style
        setSelectedMapStyle(mapStyles.default);
      }
    };

    fetchStoredMapStyle();
  }, []);

  const mapStyles = {
    default: 'mapbox://styles/slimeycabbage12/clweqgnnw007001qx32sd4q6b',
    radar: 'mapbox://styles/slimeycabbage12/clx3lb0pv008i01qs0jume86l',
    cherry: 'mapbox://styles/yourusername/ios-cherryblossom',
    cyber: 'mapbox://styles/yourusername/ios-cyberpunk',
    colourblind: 'mapbox://styles/yourusername/ios-colourblind',
  };
  
  const [selectedMapStyle, setSelectedMapStyle] = useState<string>(mapStyles.default);
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
        selectedStyle = mapStyles.default;
        break;
      case "radar":
        selectedStyle = mapStyles.radar;
        break;
      case "cherry":
        selectedStyle = mapStyles.cherry;
        break;
      case "cyber":
        selectedStyle = mapStyles.cyber;
        break;
      case "colourblind":
        selectedStyle = mapStyles.colourblind;
        break;
      default:
        selectedStyle = mapStyles.default;
    }
    setSelectedMapStyle(selectedStyle);
    storeMapStyle(style);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'gray' }}>
      <MapComp selectedMapStyle={selectedMapStyle} />

       
        {/* To hide the theme button on iOS, uncomment the next line  */}
        {/* {Platform.OS === 'android' && ( */}
     
      <ThemeSelectButton onPress={showPopup}>Theme</ThemeSelectButton>
       {/* )} */}
       {/* and this bracket above */}

      <MapStylePopup
        visible={themePopupVisible}
        transparent={true}
        onClose={closePopup}
        onSelect={selectMapStyle}
      />

      {/* this needs to get value from map-comp */}
      {isLocationEnabled && (
        <FireSelector
          selectedMapStyle={selectedMapStyle}
          getStoredMapStyle={getStoredMapStyle}
          selectMapStyle={selectMapStyle}
        />
      )}
    </View>
  );
}