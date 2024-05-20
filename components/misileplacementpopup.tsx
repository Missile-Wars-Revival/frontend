import React, { useState } from 'react';
import { Modal, View, Text, Button } from 'react-native';
import { Marker } from "react-native-maps";
import MapView from "react-native-maps"

interface Location {
  latitude: number;
  longitude: number;
}

interface MissilePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  userLocation: Location;
  selectedMissile: string | null;
  userName: string;
  destination: Location;
}

const MissilePlacementPopup: React.FC<MissilePlacementPopupProps> = ({
  visible,
  onClose,
  userLocation,
  selectedMissile,
  userName,
  destination
}) => {
  const [missileLocation, setMissileLocation] = useState<Location | null>(null);

  const handleMapPress = (event: { nativeEvent: { coordinate: any; }; }) => {
    setMissileLocation(event.nativeEvent.coordinate);
  };

  const placeMissile = () => {
    if (missileLocation && selectedMissile) {
      // Replace with your missile placement logic
      console.log(`Placing ${selectedMissile} by ${userName} from [${userLocation.latitude}, ${userLocation.longitude}] to [${destination.latitude}, ${destination.longitude}] at [${missileLocation.latitude}, ${missileLocation.longitude}]`);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
          <Text>Place Missile: </Text>
          {userLocation && (
            <MapView
              style={{ width: 300, height: 300 }}
              onPress={handleMapPress}
              showsUserLocation={true}
              initialRegion={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              {missileLocation && (
                <Marker coordinate={missileLocation} />
              )}
            </MapView>
          )}
          <Button title="Place Missile" onPress={placeMissile} />
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};
