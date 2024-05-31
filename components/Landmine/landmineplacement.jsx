import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ActivityIndicator, Text, Alert, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { loadLastKnownLocation } from '../../util/mapstore';
import { useUserName } from "../../util/fetchusernameglobal";
import { mapstyles } from '../../map-themes/Map-stylesheet';

//set marker image as landmine type
import { LandmineImages } from './landmine';

export const LandminePlacementPopup = ({ visible, onClose, selectedLandmine }) => {
  const [region, setRegion] = useState(null);
  //import is locaiton enabled from map-comp!!!!
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const userName = useUserName(); 

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
      latitudeDelta: 0.01, // Smaller value for increased zoom
      longitudeDelta: 0.01 // Smaller value for increased zoom
    };
    setRegion(initialRegion);
    setMarker(initialRegion); // Set initial marker position to current location
    setLoading(false);
  }

  // Load last known location from cache or request current location on modal open
  useEffect(() => {
    if (visible) {
      (async () => {
        const lastKnownLocation = await loadLastKnownLocation();
        if (lastKnownLocation) {
          setRegion(lastKnownLocation);
          setMarker(lastKnownLocation);
          setLoading(false);
        } else {
          initializeLocation();
        }
      })();
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
              radius={10} 
              fillColor="rgba(128, 128, 128, 0.3)"
            strokeColor="rgba(128, 128, 128, 0.8)" />
            <Marker
              coordinate={marker}
              draggable
              onDragEnd={(e) => setMarker(e.nativeEvent.coordinate)}
            />
          </MapView>
          {/* import this from map comp */}
          {!isLocationEnabled && (
                <View 
                style={mapstyles.overlay} />
            )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Fire" onPress={() => {
                console.log(`FIRING LANDMINE: Coordinates: ${marker.latitude}, ${marker.longitude}; User: ${userName} Landmine Type: ${selectedLandmine}`);
                onClose();
            }} />
          </View>
        </View>
      </View>
    </Modal>
  );
};
