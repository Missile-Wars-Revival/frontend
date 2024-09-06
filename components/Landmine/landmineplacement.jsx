import React, { useState, useEffect, useRef } from 'react';
import { Modal, Text, View, Button, Dimensions, ActivityIndicator, Alert, Platform } from 'react-native';
import MapView, { Marker, Circle, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { mapstyles } from '../../map-themes/map-stylesheet';
import { placelandmine } from '../../api/fireentities';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export const LandminePlacementPopup = ({ visible, onClose, selectedLandmine, onLandminePlaced }) => {

  const [region, setRegion] = useState(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const [hasDbConnection, setDbConnection] = useState(false);
  const [isAlive, setisAlive] = useState(true);
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const userName = useUserName();
  const mapRef = useRef(null);

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
        try {
          const isAliveStatus = await AsyncStorage.getItem('isAlive');
          if (isAliveStatus !== null) {
            const isAliveData = JSON.parse(isAliveStatus); // Converts the string to an object
            if (typeof isAliveData === 'object' && isAliveData.hasOwnProperty('isAlive')) {
              const isAlive = isAliveData.isAlive; // Extract the boolean value from the object
              setisAlive(isAlive);
            } else {
              // Handle unexpected format
              setisAlive(false);
            }
          } else {
            // Handle null (e.g., key does not exist)
            setisAlive(false); // Assume false if nothing is stored
          }
        } catch (error) {
          setisAlive(false); // Set to a default value in case of error
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
  const handleLandminePlacement = async () => {
    if (marker && currentLocation) {
      console.log(`PLACING Landmine: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Landmine Type: ${selectedLandmine.type}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
      try {
        await placelandmine(marker.latitude.toString(), marker.longitude.toString(), selectedLandmine.type);
        console.log("Landmine placed successfully");
        onLandminePlaced();
        onClose(); // Call this to close both popup and library
      } catch (error) {
        console.error("Error placing landmine:", error);
        Alert.alert('Error', 'Failed to place landmine. Please try again.');
      }
    }
  };

  const handlePlaceSelected = (data, details = null) => {
    if (details && details.geometry) {
      const newRegion = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
      };
      setRegion(newRegion);
      setMarker(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
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
          <GooglePlacesAutocomplete
            placeholder='Search'
            onPress={handlePlaceSelected}
            fetchDetails={true}
            query={{
              key: GOOGLE_PLACES_API_KEY,
              language: 'en',
            }}
            styles={{
              container: {
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                zIndex: 1,
              },
              textInputContainer: {
                backgroundColor: 'rgba(0,0,0,0)',
                borderTopWidth: 0,
                borderBottomWidth: 0,
              },
              textInput: {
                marginLeft: 0,
                marginRight: 0,
                height: 38,
                color: '#5d5d5d',
                fontSize: 16,
              },
              predefinedPlacesDescription: {
                color: '#1faadb',
              },
            }}
          />
          <MapView
            ref={mapRef}
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