import React, { useEffect, useState } from "react";
import { FireType } from "../components/fire-type-popup";
import { MissileFireConfirmationPopup, MissileLibraryView } from "./Missile/missile-confirmation-popup";
import { Button, Modal, View, Text } from "react-native";
import MapView, { MapStyleElement, Marker } from "react-native-maps";
import { LandmineLibraryView, addLandmine } from "./Landmine/landmine";
import { Location } from "../types/types";

interface LandminePlacementPopupProps {
    visible: boolean;
    onClose: () => void;
    getStoredMapStyle: () => Promise<string | null>;
    selectMapStyle: (style: string) => void;
    selectedMapStyle: MapStyleElement[];
};

const LandminePlacementPopup = (props: LandminePlacementPopupProps) => {
    const [userLocation, setUserLocation] = useState<Location | null>(null);
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
        props.onClose();
      }
    };
    
    // Call getStoredMapStyle from MapStorage.ts on component mount to retrieve selected map style
    useEffect(() => {
      const fetchStoredMapStyle = async () => {
        const storedStyle = await props.getStoredMapStyle();
        if (storedStyle) {
          props.selectMapStyle(storedStyle);
        }
      };
      fetchStoredMapStyle();
    }, []);
  
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
        visible={props.visible}
        onRequestClose={props.onClose} >
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
                customMapStyle={props.selectedMapStyle}
                initialRegion={{
                  latitude: userLocation.latitude,
                  longitude: userLocation.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }} >
                  {landmineLocation && ( <Marker coordinate={landmineLocation} /> )}
              </MapView>
            )}
            <Button title="Place Landmine" onPress={placeLandmine} />
            <Button title="Close" onPress={props.onClose} />
          </View>
        </View>
      </Modal>
    );
};

interface FireSelectorProps {
    selectedMapStyle: MapStyleElement[];
    getStoredMapStyle: () => Promise<string | null>;
    selectMapStyle: (style: string) => void;
}

export const FireSelector = (props: FireSelectorProps) => {
    const [MissileModalVisible, setMissileModalVisible] = useState(false); 
    const [MissilefireposModalVisible, setMissilefireposModalVisible] = useState(false);   
    const [LandmineModalVisible, setLandmineModalVisible] = useState(false); 
    const [LandminePopupVisible, setLandminePopupVisible] = useState(false);

    return (
        <View>
            {/* Missile library popup */}
            <MissileLibraryView MissileModalVisible={MissileModalVisible} MissileModalHandler={() => setMissileModalVisible(false)} selectedPlayerUsername={""} />
            {/* Missile Fire at position library popup */}
            <MissileFireConfirmationPopup MissilefireposModalVisible={MissilefireposModalVisible} exitHandler={() => setMissilefireposModalVisible(false)} />

            {/* Landmine library popup */}
            <LandmineLibraryView LandmineModalVisible={LandmineModalVisible} landminePlaceHandler={() => setLandmineModalVisible(false)} />

            {/* Fire Select button */}
            <FireType landmineFireHandler={() => setLandmineModalVisible(true)} missileFireHandler={() => setMissileModalVisible(true)} />
            
            <LandminePlacementPopup visible={LandminePopupVisible} onClose={() => setLandminePopupVisible(false)} getStoredMapStyle={props.getStoredMapStyle} selectMapStyle={props.selectMapStyle} selectedMapStyle={props.selectedMapStyle} />
        </View>
    )
}