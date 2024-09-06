import React, { useState, useEffect } from 'react';
import { Modal, Text, View, Button, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { mapstyles } from '../../map-themes/map-stylesheet';
import { firemissileloc } from '../../api/fireentities';

interface MissilePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  selectedMissile: string;
  onMissileFired: () => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const MissilePlacementPopup: React.FC<MissilePlacementPopupProps> = ({ visible, onClose, selectedMissile, onMissileFired }) => {
  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<Region | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [hasDbConnection, setDbConnection] = useState<boolean>(false);
  const [isAlive, setisAlive] = useState<boolean>(true);
  const userName = useUserName();

  // Function to handle location permission and fetch current location
  async function initializeLocation() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setIsLocationEnabled(false)
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
    setCurrentLocation(initialRegion);
    setLoading(false);
  }

  // Load last known location from cache or request current location on modal open
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
      } catch (error) {
        console.error('Error initializing map:', error);
      }
      try {
        const isAliveStatus = await AsyncStorage.getItem('isAlive');
        if (isAliveStatus !== null) {
          const isAliveData = JSON.parse(isAliveStatus); // Converts the string to an object
          if (typeof isAliveData === 'object' && isAliveData.hasOwnProperty('isAlive')) {
            const isAlive = isAliveData.isAlive; // Extract the boolean value from the object
            setisAlive(isAlive);
          } else {
            setisAlive(false);
          }
        } else {
          setisAlive(false);
        }
      } catch (error) {
        setisAlive(false);
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
  const handleMissilePlacement = () => {
    if (marker && currentLocation && marker.latitude === currentLocation.latitude && marker.longitude === currentLocation.longitude) {
      Alert.alert('Warning', 'Firing a Missile at your current location is not recommended!');
    } else if (marker && currentLocation) {
      console.log(`FIRING Missile: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Missile Type: ${selectedMissile}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
      firemissileloc(marker.latitude.toString(), marker.longitude.toString(), selectedMissile);
      onMissileFired();
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
            initialRegion={region ?? {
              latitude: 0,
              longitude: 0,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            }}
            showsUserLocation={true}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
            showsMyLocationButton={true}
            onPress={(e) => setMarker({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01
            })}
          >
            {marker && (
              <Circle
                center={marker}
                //needs to be fetched depending on missile type!!!
                radius={40}
                fillColor="rgba(255, 0, 0, 0.2)"
                strokeColor="rgba(255, 0, 0, 0.8)"
              />
            )}
            <Marker
              coordinate={marker || { latitude: 0, longitude: 0 }}
              draggable
              onDragEnd={(e) => setMarker({
                ...e.nativeEvent.coordinate,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              })}
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
            <Button title="Fire" onPress={handleMissilePlacement} />
          </View>
        </View>
      </View>
    </Modal>
  );
};