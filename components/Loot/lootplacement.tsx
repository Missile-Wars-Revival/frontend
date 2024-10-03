import React, { useState, useEffect, useRef } from 'react';
import { Modal, Text, View, Dimensions, Alert, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { placeLoot } from '../../api/fireentities';
import { useColorScheme } from 'react-native';
import { loadLastKnownLocation, saveLocation } from '../../util/mapstore';
import { AllLootDrops } from './map-loot';
import { AllOther } from '../Other/map-other';
import { AllLandMines } from '../Landmine/map-landmines';
import { AllMissiles } from '../Missile/map-missile';
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

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface LootPlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  selectedLoot: { type: string };
  onLootPlaced: () => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const LootPlacementPopup: React.FC<LootPlacementPopupProps> = ({ visible, onClose, selectedLoot, onLootPlaced }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [region, setRegion] = useState<Region | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [hasDbConnection, setDbConnection] = useState<boolean>(false);
  const [isAlive, setisAlive] = useState<boolean>(true);
  const [marker, setMarker] = useState<Region | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
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

  async function initializeLocation() {
    setLoading(true);

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
      setLoading(false);
      return;
    }

    try {
      let location = await Location.getCurrentPositionAsync({});
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.003,
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
        setDbConnection(isDBConnection === "true");

        const isAliveStatus = await AsyncStorage.getItem('isAlive');
        if (isAliveStatus !== null) {
          const isAliveData = JSON.parse(isAliveStatus);
          setisAlive(isAliveData.isAlive ?? false);
        } else {
          setisAlive(false);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        setDbConnection(false);
        setisAlive(false);
      }
    };

    initializeApp();
  }, []);

  const handleLootPlacement = () => {
    if (marker && currentLocation) {
      // Close the popup and trigger callback immediately
      onLootPlaced();
      onClose();

      // Place the Loot in the background
      console.log(`PLACING Loot: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Loot Type: ${selectedLoot.type}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
      placeLoot(marker.latitude.toString(), marker.longitude.toString())
        .then(() => {
          console.log("Loot placed successfully");
        })
        .catch(error => {
          console.error("Error placing loot:", error);
          // Optionally, you can show an error message to the user here
        });
    }
  };

  const handlePlaceSelected = (data: any, details: any = null) => {
    if (details && details.geometry) {
      const newRegion = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: 0.002,
        longitudeDelta: 0.002,
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
    >
      <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
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
            customMapStyle={currentMapStyle}
            onPress={(e) => setMarker({
              latitude: e.nativeEvent.coordinate.latitude,
              longitude: e.nativeEvent.coordinate.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001
            })}
          >
            {marker && (
              <Circle
                center={marker}
                radius={20}
                fillColor="rgba(0, 0, 255, 0.2)"
                strokeColor="rgba(0, 0, 255, 0.8)"
              />
            )}
            {marker && (
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => setMarker(prevMarker => ({
                  ...e.nativeEvent.coordinate,
                  latitudeDelta: prevMarker?.latitudeDelta || 0.001,
                  longitudeDelta: prevMarker?.longitudeDelta || 0.001
                }))}
              />
            )}
            <AllLootDrops lootLocations={lootData} />
            <AllOther OtherLocations={otherData} />
            <AllLandMines landminedata={LandmineData} />
            <AllMissiles missileData={missileData} />
            <AllPlayers />
          </MapView>
          {(!isLocationEnabled || !hasDbConnection) && (
            <View style={[styles.overlay, isDarkMode && styles.overlayDark]}>
              <Text style={[styles.overlayText, isDarkMode && styles.overlayTextDark]}>Map is disabled due to location/database issues.</Text>
              <Text style={[styles.overlaySubText, isDarkMode && styles.overlaySubTextDark]}>Please check your settings or try again later.</Text>
            </View>
          )}
          {(!isAlive) && (
            <View style={[styles.overlay, isDarkMode && styles.overlayDark]}>
              <Text style={[styles.overlayText, isDarkMode && styles.overlayTextDark]}>Map is disabled due to your death</Text>
              <Text style={[styles.overlaySubText, isDarkMode && styles.overlaySubTextDark]}>Please wait the designated time or watch an advert!</Text>
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.placeButton]} onPress={handleLootPlacement}>
              <Text style={styles.buttonText}>Place</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainerDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: Dimensions.get('window').width - 40,
    height: Dimensions.get('window').height - 200,
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  map: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlayText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  overlayTextDark: {
    color: '#FFF',
  },
  overlaySubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginTop: 10,
  },
  overlaySubTextDark: {
    color: '#B0B0B0',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e53e3e',
  },
  placeButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});