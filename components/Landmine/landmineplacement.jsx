import React, { useState, useEffect } from 'react';
import { Modal, Text, View, Button, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { mapstyles } from '../../map-themes/map-stylesheet';

export const LandminePlacementPopup = ({ visible, onClose, selectedLandmine }) => {

  const [region, setRegion] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [hasDbConnection, setDbConnection] = useState(false);
  const [isAlive, setisAlive] = useState(false);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const userName = useUserName();

  async function initializeLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setIsLocationEnabled(false);
      setLoading(false);
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    const initialRegion = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.002,
      longitudeDelta: 0.002
    };
    setRegion(initialRegion);
    setMarker(initialRegion);
    setCurrentLocation(initialRegion); // Store the current location
    setLoading(false);
  }

  useEffect(() => {
    if (visible) {
      initializeLocation();
    }
  }, [visible]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isDBConnection = await AsyncStorage.getItem('dbconnection');
        if (isDBConnection === "false") {
          setDbConnection(false)
        }
        if (isDBConnection === "true") {
          setDbConnection(true)
        } else {
          setDbConnection(false);
        }
        const isalivestatus = await AsyncStorage.getItem('isAlive');
        if (isalivestatus === "false") {
          setisAlive(false)
        }
        if (isalivestatus === "true") {
          setisAlive(true)
        } else {
          setisAlive(false);
        }

      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initializeApp();
  },
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Function to check if the marker is at the player's current location
  const handleLandminePlacement = () => {
    if (marker.latitude === currentLocation.latitude && marker.longitude === currentLocation.longitude) {
      Alert.alert('Warning', 'Placing a landmine at your current location is not recommended!');
    } else {
      console.log(`FIRING LANDMINE: Coordinates: ${marker.latitude}, ${marker.longitude}; User: ${userName} Landmine Type: ${selectedLandmine.type}`);
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
        <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, height: Dimensions.get('window').height - 200 }}>
          <MapView
            style={{ flex: 1 }}
            initialRegion={region}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            showsUserLocation={true}
            showsMyLocationButton={true}
            onPress={(e) => setMarker({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001
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
          {(!isLocationEnabled || !hasDbConnection) && (
            <View style={mapstyles.overlay}>
              <Text style={mapstyles.overlayText}>Map is disabled due to location/database issues.</Text>
              <Text style={mapstyles.overlaySubText}>Please check your settings or try again later.</Text>
            </View>
          )}
          {(!isAlive) && (
            <View style={mapstyles.overlay}>
              <Text style={mapstyles.overlayText}>Map is disabled due to your death</Text>
              <Text style={mapstyles.overlaySubText}>Please check wait the designated time or watch an advert!</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 10 }}>
            <Button title="Cancel" onPress={onClose} />
            <Button title="Fire" onPress={handleLandminePlacement} />
          </View>
        </View>
      </View>
    </Modal>
  );
};