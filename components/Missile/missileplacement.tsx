import React, { useState, useEffect, useRef } from 'react';
import { Modal, Text, View, Alert, Platform, Pressable , useColorScheme } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { firemissileloc } from '../../api/fireentities';
import { loadLastKnownLocation, saveLocation } from '../../util/mapstore';
import { AllLootDrops } from '../Loot/map-loot';
import { AllOther } from '../Other/map-other';
import { AllLandMines } from '../Landmine/map-landmines';
import { AllMissiles } from './map-missile';
import { AllPlayers } from '../map-players';
import useFetchMissiles from '../../hooks/websockets/missilehook';
import useFetchLoot from '../../hooks/websockets/loothook';
import useFetchOther from '../../hooks/websockets/otherhook';
import useFetchLandmines from '../../hooks/websockets/landminehook';
import { MapStyle } from '../../types/types';
import { androidDefaultMapStyle } from '../../map-themes/Android-themes/defaultMapStyle';
import { IOSCherryBlossomMapStyle, IOSColorblindMapStyle, IOSCyberpunkMapStyle, IOSDefaultMapStyle, IOSRadarMapStyle } from '../../map-themes/IOS-themes/themestemp';
import { androidCherryBlossomMapStyle } from '../../map-themes/Android-themes/cherryBlossomMapStyle';
import { androidColorblindMapStyle } from '../../map-themes/Android-themes/colourblindstyle';
import { androidCyberpunkMapStyle } from '../../map-themes/Android-themes/cyberpunkstyle';
import { androidRadarMapStyle } from '../../map-themes/Android-themes/radarMapStyle';
import { triggerGameEffect } from '../effects/game-effects';
import { haptics } from '../ui/haptics';

import { LinearGradient } from 'expo-linear-gradient';
import { getPalette, Gradients } from '../ui/theme';
import { getPlacementStyles } from '../ui/placement-popup-styles';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface MissilePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedMissile: string;
  onMissileFired: () => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const MissilePlacementPopup: React.FC<MissilePlacementPopupProps> = ({ visible, onClose, onDismissed, selectedMissile, onMissileFired }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getPlacementStyles(palette, isDarkMode);

  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<Region | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [hasDbConnection, setDbConnection] = useState<boolean>(false);
  const [isAlive, setisAlive] = useState<boolean>(true);
  const userName = useUserName();
  const mapRef = useRef<MapView>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);

  useEffect(() => {
    const loadStoredMapStyle = async () => {
      try {
        const storedStyle = await AsyncStorage.getItem('selectedMapStyle');
        if (storedStyle) {
          console.log('Stored style:', storedStyle);
          
          // Check if the stored value is a simple string (like "default")
          if (['default', 'radar', 'cherry', 'cyber', 'colourblind'].includes(storedStyle)) {
            // Convert the string to the corresponding map style
            switch (storedStyle) {
              case 'default':
                setCurrentMapStyle(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
                break;
              case 'radar':
                setCurrentMapStyle(Platform.OS === 'android' ? androidRadarMapStyle : IOSRadarMapStyle);
                break;
              case 'cherry':
                setCurrentMapStyle(Platform.OS === 'android' ? androidCherryBlossomMapStyle : IOSCherryBlossomMapStyle);
                break;
              case 'cyber':
                setCurrentMapStyle(Platform.OS === 'android' ? androidCyberpunkMapStyle : IOSCyberpunkMapStyle);
                break;
              case 'colourblind':
                setCurrentMapStyle(Platform.OS === 'android' ? androidColorblindMapStyle : IOSColorblindMapStyle);
                break;
            }
          } else {
            // If it's not a simple string, try to parse it as JSON
            const parsedStyle = JSON.parse(storedStyle) as MapStyle[];
            setCurrentMapStyle(parsedStyle);
          }
        }
      } catch (error) {
        console.error('Error loading stored map style:', error);
        // Fallback to default style
        setCurrentMapStyle(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
      }
    };

    loadStoredMapStyle();
  }, []);

  // Function to handle location permission and fetch current location
  async function initializeLocation() {
    // First, try to load the last known location
    const lastKnownLocation = await loadLastKnownLocation();
    if (lastKnownLocation) {
      setRegion(lastKnownLocation);
      setMarker(lastKnownLocation);
      setCurrentLocation(lastKnownLocation);
    }

    // Then, check for permission and get current location
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setIsLocationEnabled(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
      setRegion(currentRegion);
      setMarker(currentRegion);
      setCurrentLocation(currentRegion);

      // Save the current location for future use
      await saveLocation(currentRegion);
    } catch (error) {
      console.error('Error getting current location:', error);
      // If we couldn't get the current location, we'll use the last known location if available
      if (!lastKnownLocation) {
        setIsLocationEnabled(false);
      }
    }
  }

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isDBConnection = await AsyncStorage.getItem('dbconnection');
        setDbConnection(isDBConnection === 'true');
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
      } catch {
        setisAlive(false);
      }
    };

    initializeApp();
  }, []);

  // if (loading) {
  //   return (
  //     <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
  //       <ActivityIndicator size="large" />
  //     </View>
  //   );
  // }
  const handleMissilePlacement = () => {
    if (!marker || !currentLocation) {
      haptics.warning();
      Alert.alert('Not Ready', 'Waiting for your location. Please try again in a moment.');
      return;
    }

    if (marker.latitude === currentLocation.latitude && marker.longitude === currentLocation.longitude) {
      haptics.warning();
      Alert.alert('Warning', 'Firing a Missile at your current location is not recommended! Move the target pin to a different location.');
      return;
    }

    // Launch feedback: rumble + full-screen Skia launch animation (plays at the
    // app root, so it becomes visible as the modal stack dismisses).
    triggerGameEffect('missileLaunch');

    // The parent owns closing: it dismisses this popup first, then the sheet.
    onMissileFired();

    // Fire the missile in the background
    console.log(`FIRING Missile: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Missile Type: ${selectedMissile}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
    firemissileloc(marker.latitude.toString(), marker.longitude.toString(), selectedMissile)
      .catch(error => {
        console.error('Error firing missile:', error);
        Alert.alert('Failed', 'Could not fire missile. Please check your connection and try again.');
      });
  };

  const handlePlaceSelected = (data: any, details: any = null) => {
    if (details && details.geometry) {
      const newRegion = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
        pitch: 0,
        heading: 0
      };
      setRegion(newRegion);
      setMarker(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  //WS hooks
  const missileData = useFetchMissiles()
  const lootData = useFetchLoot()
  const otherData = useFetchOther()
  const LandmineData = useFetchLandmines()

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      onDismiss={onDismissed}
      onShow={() => { void initializeLocation(); }}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
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
                color: isDarkMode ? '#FFF' : '#5d5d5d',
                fontSize: 16,
                backgroundColor: isDarkMode ? '#3D3D3D' : '#FFF',
              },
              predefinedPlacesDescription: {
                color: isDarkMode ? '#B0B0B0' : '#1faadb',
              },
              row: {
                backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF',
                padding: 13,
                height: 44,
                flexDirection: 'row',
              },
              separator: {
                height: 0.5,
                backgroundColor: isDarkMode ? '#515151' : '#c8c7cc',
              },
              description: {
                color: isDarkMode ? '#FFFFFF' : '#000000',
              },
              poweredContainer: {
                backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF',
              },
              powered: {
                tintColor: isDarkMode ? '#FFFFFF' : undefined,
              },
            }}
            renderRow={(rowData) => {
              const title = rowData.structured_formatting.main_text;
              const address = rowData.structured_formatting.secondary_text;
              return (
                <View>
                  <Text style={{ color: isDarkMode ? '#FFFFFF' : '#000000', fontWeight: 'bold' }}>{title}</Text>
                  <Text style={{ color: isDarkMode ? '#B0B0B0' : '#999999' }}>{address}</Text>
                </View>
              );
            }}
          />
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={region ?? undefined}
            showsUserLocation={true}
            showsMyLocationButton={true}
            pitchEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            onPress={(e) => {
              haptics.select();
              setMarker({
                latitude: e.nativeEvent.coordinate.latitude,
                longitude: e.nativeEvent.coordinate.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01
              });
            }}
            customMapStyle={currentMapStyle}
          >
            {marker && (
              <Circle
                center={marker}
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
            <AllLootDrops lootLocations={lootData} />
            <AllOther OtherLocations={otherData} />
            <AllLandMines landminedata={LandmineData} />
            <AllMissiles missileData={missileData} />
            <AllPlayers />
          </MapView>
          {(!isLocationEnabled || !hasDbConnection) && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>Map is disabled due to location/database issues.</Text>
              <Text style={styles.overlaySubText}>Please check your settings or try again later.</Text>
            </View>
          )}
          {(!isAlive) && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>Map is disabled due to your death</Text>
              <Text style={styles.overlaySubText}>Please wait the designated time or watch an advert!</Text>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <Pressable
              style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.actionButtonWrap, pressed && styles.pressed]}
              onPress={handleMissilePlacement}
            >
              <LinearGradient colors={Gradients.fire} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Fire Missile</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

