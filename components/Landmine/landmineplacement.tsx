import React, { useState, useEffect, useRef } from 'react';
import { Modal, Text, View, Alert, Pressable, Platform , useColorScheme } from 'react-native';
import MapView, { Marker, Circle, Polygon } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useUserName } from "../../util/fetchusernameglobal";
import { placelandmine } from '../../api/fireentities';
import { loadLastKnownLocation, saveLocation } from '../../util/mapstore';
import { AllOther } from '../Other/map-other';
import { AllLandMines } from '../Landmine/map-landmines';
import { AllMissiles } from '../Missile/map-missile';
import { AllPlayers } from '../map-players';
import useFetchMissiles from '../../hooks/websockets/missilehook';
import useFetchLoot from '../../hooks/websockets/loothook';
import useFetchOther from '../../hooks/websockets/otherhook';
import useFetchLandmines from '../../hooks/websockets/landminehook';
import { AllLootDrops } from '../Loot/map-loot';
import { androidDefaultMapStyle } from '../../map-themes/Android-themes/defaultMapStyle';
import { IOSCherryBlossomMapStyle, IOSColorblindMapStyle, IOSCyberpunkMapStyle, IOSDefaultMapStyle, IOSRadarMapStyle } from '../../map-themes/IOS-themes/themestemp';
import { MapStyle } from '../../types/types';
import { androidCherryBlossomMapStyle } from '../../map-themes/Android-themes/cherryBlossomMapStyle';
import { androidColorblindMapStyle } from '../../map-themes/Android-themes/colourblindstyle';
import { androidCyberpunkMapStyle } from '../../map-themes/Android-themes/cyberpunkstyle';
import { androidRadarMapStyle } from '../../map-themes/Android-themes/radarMapStyle';
import { useOnboarding } from '../../util/Context/onboardingContext';
import { getLeagueAirspace } from '../player'; // Import the airspace calculation function
import { triggerGameEffect } from '../effects/game-effects';
import { haptics } from '../ui/haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { getPalette, Gradients } from '../ui/theme';
import { getPlacementStyles } from '../ui/placement-popup-styles';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface LandminePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedLandmine: { type: string };
  onLandminePlaced: () => void;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export const LandminePlacementPopup: React.FC<LandminePlacementPopupProps> = ({ visible, onClose, onDismissed, selectedLandmine, onLandminePlaced }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getPlacementStyles(palette, isDarkMode);

  const [region, setRegion] = useState<Region | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [hasDbConnection, setDbConnection] = useState<boolean>(false);
  const [isAlive, setisAlive] = useState<boolean>(true);
  const [marker, setMarker] = useState<Region | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const userName = useUserName();
  const mapRef = useRef<MapView>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();
  const [userLeague, setUserLeague] = useState<string>('bronze'); // Default to bronze
  const [isValidPlacement, setIsValidPlacement] = useState<boolean>(false);

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
    // First, try to load the last known location
    const lastKnownLocation = await loadLastKnownLocation();
    if (lastKnownLocation) {
      setRegion(lastKnownLocation);
      setMarker(lastKnownLocation);
      setCurrentLocation(lastKnownLocation);
      // The starting marker is at the user's current position â€” always a valid placement
      setIsValidPlacement(true);
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
        longitudeDelta: 0.003,
      };
      setRegion(currentRegion);
      setMarker(currentRegion);
      setCurrentLocation(currentRegion);
      // GPS location is always within the user's airspace (distance 0)
      setIsValidPlacement(true);

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

  const handleLandminePlacement = () => {
    if (!marker || !currentLocation) {
      haptics.warning();
      Alert.alert('Not Ready', 'Waiting for your location. Please try again in a moment.');
      return;
    }

    if (!isValidPlacement) {
      haptics.error();
      Alert.alert('Out of Range', 'You can only place landmines within your league airspace. Tap a location inside the green circle.');
      return;
    }

    // Arming feedback: click-clack haptic + full-screen Skia arming animation.
    triggerGameEffect('landmineArm');

    // The parent owns closing: it dismisses this popup first, then the sheet.
    onLandminePlaced();

    // Place the Landmine in the background
    console.log(`PLACING Landmine: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Landmine Type: ${selectedLandmine.type}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
    placelandmine(marker.latitude.toString(), marker.longitude.toString(), selectedLandmine.type)
      .then(() => {
        console.log('Landmine placed successfully');
      })
      .catch(error => {
        console.error('Error placing landmine:', error);
        Alert.alert('Failed', 'Could not place landmine. Please check your connection and try again.');
      });

    if (currentStep === 'place_landmine') {
      moveToNextStep();
    }
  };

  const handlePlaceSelected = (data: any, details: any = null) => {
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

  const handleMapPress = (e: any) => {
    const newMarker = {
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
      latitudeDelta: 0.001,
      longitudeDelta: 0.001
    };

    const isValid = currentLocation ? isWithinAirspace(newMarker, currentLocation) : false;
    // Distinct tick vs. warning so players can feel valid/invalid spots.
    if (isValid) {
      haptics.select();
    } else {
      haptics.warning();
    }
    setIsValidPlacement(isValid);
    setMarker(newMarker);

    if (isValid && currentStep === 'selectlandmine_location' && !isOnboardingComplete) {
      moveToNextStep();
    }
  };

  //WS hooks
  const missileData = useFetchMissiles()
  const lootData = useFetchLoot()
  const otherData = useFetchOther()
  const LandmineData = useFetchLandmines()

  // Add this function to check if a point is within the airspace
  const isWithinAirspace = (point: Region, center: Region): boolean => {
    if (!center) return false;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = point.latitude * Math.PI / 180;
    const φ2 = center.latitude * Math.PI / 180;
    const Δφ = (center.latitude - point.latitude) * Math.PI / 180;
    const Δλ = (center.longitude - point.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= getLeagueAirspace(userLeague);
  };

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
  customMapStyle={currentMapStyle}
  onPress={handleMapPress}
>
  {currentLocation && (
    <>
      {/* Green border circle */}
      <Circle
        center={currentLocation}
        radius={getLeagueAirspace(userLeague)}
        fillColor="rgba(0, 0, 0, 0)"
        strokeColor="green"
      />

      {/* Dimmed overlay with a circular hole in the center */}
      <Polygon
  coordinates={[
    // Outer large rectangle coordinates, expanded to be off-screen
    { latitude: currentLocation.latitude + 10, longitude: currentLocation.longitude - 10 },
    { latitude: currentLocation.latitude + 10, longitude: currentLocation.longitude + 10 },
    { latitude: currentLocation.latitude - 10, longitude: currentLocation.longitude + 10 },
    { latitude: currentLocation.latitude - 10, longitude: currentLocation.longitude - 10 },
  ]}
  holes={[
    // Circular hole coordinates
    Array.from({ length: 360 }).map((_, index) => {
      const angle = (index * Math.PI * 2) / 360; // Full 360 degrees
      const latitudeOffset = (getLeagueAirspace(userLeague) / 111320) * Math.cos(angle);
      const longitudeOffset = (getLeagueAirspace(userLeague) / (111320 * Math.cos(currentLocation.latitude * Math.PI / 180))) * Math.sin(angle);

      return {
        latitude: currentLocation.latitude + latitudeOffset,
        longitude: currentLocation.longitude + longitudeOffset,
      };
    }),
  ]}
  fillColor="rgba(0, 0, 0, 0.5)" // Semi-transparent black
  strokeWidth={0} // No border
  strokeColor="transparent" // Ensure border is transparent
/>
    </>
  )}
  {marker && (
    <Circle
      center={marker}
      radius={10}
      fillColor="rgba(128, 128, 128, 0.3)"
      strokeColor="rgba(128, 128, 128, 0.8)"
    />
  )}
  {marker && (
    <Marker
      coordinate={marker}
      draggable
      onDragEnd={(e) => setMarker(prevMarker => ({
        ...e.nativeEvent.coordinate,
        latitudeDelta: prevMarker?.latitudeDelta || 0.001,
        longitudeDelta: prevMarker?.longitudeDelta || 0.001,
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
              style={({ pressed }) => [
                styles.actionButtonWrap,
                !isValidPlacement && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              onPress={handleLandminePlacement}
              disabled={!isValidPlacement}
            >
              <LinearGradient colors={Gradients.fire} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Place Landmine</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

