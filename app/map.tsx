import React, { useEffect, useState, useCallback } from "react";
import { Text, View, TouchableOpacity, Button, Modal, Dimensions, Platform } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";

//Themes
import { DefaultMapStyle } from "../themes/defaultMapStyle";
import { RadarMapStyle } from "../themes/radarMapStyle";
import { CherryBlossomMapStyle } from "../themes/cherryBlossomMapStyle";
import { CyberpunkMapStyle } from "../themes/cyberpunkstyle";
import { ColorblindMapStyle } from "../themes/colourblindstyle";

//Types
import { Loot, Missile, Landmine, Location, Player  } from "../types/types";

//Components:
import { MissileLibrary, MissilefireposLibrary } from "../components/missile";
import { addLandmine, LandmineLibrary, LandmineLibraryView, LandminePlacementPopupProps} from "../components/landmine";

import { MapStylePopup } from "../components/map-style-popup";
import { FireTypeStyle } from "../components/fire-type-popup";
import { getTimeDifference, isInactiveFor24Hours } from "../util/get-time-difference";

import { userNAME } from "../temp/login"; // fetch from backend eventually
import { storeMapStyle, getStoredMapStyle } from "../components/ui/mapthemestore"; //cache map theme 

//Hooks
import { fetchOtherPlayersData } from "../api/getplayerlocations";
import { PlayerComp } from "../components/player";
import { MapMissile } from "../components/map-missile";
import { LootDrop } from "../components/loot-drop";
import { fetchMissilesFromBackend, fetchLootFromBackend, fetchlandmineFromBackend } from "../temp/fetchMethods";
import { ThemeSelectButton } from "../components/theme-select-button";

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
  const [FirepopupVisible, setFirePopupVisible] = useState(false);
  const [lootLocations, setLootLocations] = useState<Loot[]>([]);
  const [missileData, setMissileData] = useState<Missile[]>([]);

  const [LandminePopupVisible, setLandminePopupVisible] = useState(false);
  const [landminedata, setlandminelocations] = useState<Landmine[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [otherPlayersData, setOtherPlayersData] = useState([] as Player[]);
  const [MissileModalVisible, setMissileModalVisible] = useState(false); 
  const [MissilefireposModalVisible, setMissilefireposModalVisible] = useState(false);   
  const [LandmineModalVisible, setLandmineModalVisible] = useState(false);  
  const [selectedPlayerUsername, setSelectedPlayerUsername] = useState('');
//marker images


  const fetchOtherPlayers = async () => {
    try {
      const data = await fetchOtherPlayersData();
      setOtherPlayersData(data); 
    } catch (error) {
      console.error('Error fetching other players data:', error);
    }
  };

  useEffect(() => {
    fetchOtherPlayers(); // Initial fetch

    // Set interval to send location to backend every 30 seconds
    const intervalId = setInterval(fetchOtherPlayers, 30000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);
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

  const FireshowPopup = () => {
    //console.log("Popup button clicked");
    setFirePopupVisible(true);
  };
  

  const FireclosePopup = () => {
    setFirePopupVisible(false);
  };

  const selectFiretype = (style: string) => {
    FireclosePopup();
    switch (style) {
      case "firelandmine":
        console.log("place landmine")
        //place landminecode;
        setLandmineModalVisible(true);
        break;
      case "firemissile":
        console.log("Fire Missile")
        setMissilefireposModalVisible(true);
        //Fire missile code;
        break;
      default:
        break;
    }
  };
// This is on main map page because is requires userlocation 
  const LandminePlacementPopup: React.FC<LandminePlacementPopupProps> = ({ visible, onClose }) => {
    const [landmineLocation, setLandmineLocation] = useState<Location | null>(null);

    const handleMapPress = (event: { nativeEvent: { coordinate: any; }; }) => {
      const { coordinate } = event.nativeEvent;
      setLandmineLocation(coordinate);
    };

    const placeLandmine = () => {
      // Place landmine logic here using the selected location
      if (landmineLocation) {
        addLandmine(landmineLocation.latitude, landmineLocation.longitude);
        // Close the popup
        onClose();
      }
    };
// furture place missile 
    // const placeMissile = () => {
    //   // Place landmine logic here using the selected location
    //   if (missileplacelocation) {
    //     addMissile(missileplacelocation.latitude, missileplacelocation.longitude);
    //     // Close the popup
    //     onClose();
    //   }
    // };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={visible}
        onRequestClose={onClose}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
            <Text>Place Landmine: </Text>
            {/* Conditional rendering of MapView */}
            {userLocation && (
              <MapView
                style={{ width: 300, height: 300 }}
                onPress={handleMapPress}
                //Result of expo update -> provider={PROVIDER_GOOGLE}
                showsUserLocation={true}
                customMapStyle={selectedMapStyle}
                initialRegion={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                {landmineLocation && (
                  <Marker coordinate={landmineLocation} />
                )}
              </MapView>
            )}
            <Button title="Place Landmine" onPress={placeLandmine} />
            <Button title="Close" onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  };

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
  
  // Call getStoredMapStyle from MapStorage.ts on component mount to retrieve selected map style
  useEffect(() => {
    const fetchStoredMapStyle = async () => {
      const storedStyle = await getStoredMapStyle();
      if (storedStyle) {
        selectMapStyle(storedStyle);
      }
    };
    fetchStoredMapStyle();
  }, []);

  //To allow player to upload their own this is modular

  return (
    <View className="flex-1 bg-gray-200">
      <MapView
        // no longer supported -> provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={selectedMapStyle}
      >
        {/* Render Loot Drops */}
        {lootLocations.map((location, index) => (
        <React.Fragment key={index}>
          <LootDrop location={location} />
        </React.Fragment>
))}

        {/* Render landmine Drops */}
        {landminedata
        .filter(landmine => landmine.placedby === userNAME)
        .map((location, index) => (
          <Circle
            key={index}
            center={location}
            radius={30} //actual radius size
            fillColor="rgba(128, 128, 128, 0.3)"
            strokeColor="rgba(128, 128, 128, 0.8)"
          />
        ))}

        

{/* Render Missiles */}
{missileData.map(({ destination, currentLocation, radius, type, status }, index) => {

// Define a mapping of image paths with an index signature (paths found in components)

  // Calculate coordinates for trajectory line
  const trajectoryCoordinates = [
    { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
    { latitude: destination.latitude, longitude: destination.longitude },
  ];
  
  return (
    <React.Fragment key={index}>
      <MapMissile destination={destination}
       currentLocation={currentLocation} 
       trajectoryCoordinates={trajectoryCoordinates} 
       radius={radius} 
       type={type} 
       status={status} />
    </React.Fragment>
  );
})}
{/* Render Players */}
{otherPlayersData
  .filter(player => player.username !== userNAME && !isInactiveFor24Hours(player.updatedAt))
  .map((player, index) => {
    const { text } = getTimeDifference(player.updatedAt);

    return (
      <React.Fragment key={index}>
        <PlayerComp index={index} player={player} location={location} description={text}></PlayerComp>
      </React.Fragment>
    );
  })}
      </MapView>
{/* Missile library popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={MissileModalVisible}
        onRequestClose={() => setMissileModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
            {/* Include MissileLibrary component */}
            <MissileLibrary playerName={selectedPlayerUsername} />
            <View style={{ alignSelf: 'flex-end', padding: 10 }}>
              <Button title="Cancel" onPress={() => setMissileModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Missile Fire at position library popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={MissilefireposModalVisible}
        onRequestClose={() => setMissilefireposModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
            {/* Include MissileLibrary component */}
            <MissilefireposLibrary/>
            <View style={{ alignSelf: 'flex-end', padding: 10 }}>
              <Button title="Cancel" onPress={() => setMissilefireposModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Landmine library popup */}
      <LandmineLibraryView LandmineModalVisible={LandmineModalVisible} landminePlaceHandler={() => setLandmineModalVisible(false)} />


    {/* Dropdown button */}
    {Platform.OS === 'android' && (
      <ThemeSelectButton onPress={ThemeshowPopup}>Theme</ThemeSelectButton>
    )}

    <MapStylePopup
      visible={ThemepopupVisible}
      transparent={true}
      onClose={ThemeclosePopup}
      onSelect={selectMapStyle}
    />


    {/* Fire Select button */}
    <TouchableOpacity
      className="absolute bottom-[70px] left-[20px] rounded-[5px] p-[10px] bg-white shadow-md"
      onPress={FireshowPopup}
    >
      <Text className="text-[16px]">+</Text>
    </TouchableOpacity>

    <FireTypeStyle
      visible={FirepopupVisible}
      transparent={true}
      onClose={FireclosePopup}
      onSelect={selectFiretype}
    />

      <LandminePlacementPopup visible={LandminePopupVisible} onClose={() => setLandminePopupVisible(false)} />
  </View>
  );
}