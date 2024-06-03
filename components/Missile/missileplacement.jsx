import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ActivityIndicator, Text, Alert } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { loadLastKnownLocation } from '../../util/mapstore';
import { useUserName } from "../../util/fetchusernameglobal";
import { mapstyles } from '../../map-themes/map-stylesheet'; 
//set marker image as Missile type
import { MissileImages } from './missile';

export const MissilePlacementPopup = ({ visible, onClose, selectedMissile }) => {
  const [region, setRegion] = useState(null);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const userName = useUserName(); 

  //import is locaiton enabled from map-comp!!!!!
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);

  // Function to handle location permission and fetch current location
  async function initializeLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const initialRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.003, // Smaller value for increased zoom
      longitudeDelta: 0.003 // Smaller value for increased zoom
    };
    setRegion(initialRegion);
    setMarker(initialRegion); // Set initial marker position to current location
    setLoading(false);
  }

  // Load last known location from cache or request current location on modal open
  useEffect(() => {
    if (visible) {
          initializeLocation();
    }
  }, [visible]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, height: Dimensions.get('window').height - 200 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={region}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={(e) => setMarker({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
              latitudeDelta: 0.01, 
              longitudeDelta: 0.01
            })}
          >
            <Circle
              center={marker}
              //needs to be fetched depending on missile type!!!
              radius={40} 
              fillColor="rgba(255, 0, 0, 0.2)"
              strokeColor="rgba(255, 0, 0, 0.8)" />
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
            />
          </MapView>
          {!isLocationEnabled && (
                <View 
                style={mapstyles.overlay} />
            )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Fire" onPress={() => {
                console.log(`FIRING Missile: Coordinates: ${marker.latitude}, ${marker.longitude}; User: ${userName} Missile Type: ${selectedMissile}`);
                onClose();
            }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
