import React, { useState, useRef } from 'react';
import { Modal, Text, View, Alert, Pressable, useColorScheme } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { loadLastKnownLocation, saveLocation } from '../../util/mapstore';
import { AllLootDrops } from '../Loot/map-loot';
import { AllOther } from '../Other/map-other';
import { AllLandMines } from '../Landmine/map-landmines';
import { AllMissiles } from '../Missile/map-missile';
import { AllPlayers } from '../map-players';
import useFetchMissiles from '../../hooks/websockets/missilehook';
import useFetchLoot from '../../hooks/websockets/loothook';
import useFetchOther from '../../hooks/websockets/otherhook';
import useFetchLandmines from '../../hooks/websockets/landminehook';
import { useStoredMapStyle } from '../../hooks/useStoredMapStyle';
import { useGameStatus } from '../../hooks/useGameStatus';
import { haptics } from '../ui/haptics';
import { getPalette } from '../ui/theme';
import { getPlacementStyles } from '../ui/placement-popup-styles';

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PlacementMapModalProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  /** Label on the confirm button, e.g. "Fire Missile". */
  actionLabel: string;
  /** Gradient colors for the confirm button. */
  actionGradient: React.ComponentProps<typeof LinearGradient>['colors'];
  /** Selection circle drawn around the marker. */
  markerCircle: { radius: number; fillColor: string; strokeColor: string };
  /** Called once the marker passed validation; the entity API call goes here. */
  onAction: (marker: Region, currentLocation: Region) => void;
  /**
   * Optional action-time validation. Return ok: false to block the action;
   * the alert (if given) is shown to explain why.
   */
  validateAction?: (
    marker: Region,
    currentLocation: Region
  ) => { ok: boolean; alert?: { title: string; message: string } };
  /**
   * Optional live validation evaluated on every marker move (landmine
   * airspace check). When provided, the confirm button is disabled while the
   * marker is invalid and map taps give distinct valid/invalid haptics.
   */
  isMarkerValid?: (marker: Region, currentLocation: Region | null) => boolean;
  /** Notified after every marker move with the live validity. */
  onMarkerChange?: (marker: Region, isValid: boolean) => void;
  /** Extra map children, e.g. the landmine airspace overlay. */
  renderMapExtras?: (currentLocation: Region | null) => React.ReactNode;
  /** Deltas applied when the user taps the map (default 0.001). */
  pressDeltas?: number;
  /** Deltas applied when a search result is chosen (default 0.002). */
  searchDeltas?: number;
}

export const PlacementMapModal: React.FC<PlacementMapModalProps> = ({
  visible,
  onClose,
  onDismissed,
  actionLabel,
  actionGradient,
  markerCircle,
  onAction,
  validateAction,
  isMarkerValid,
  onMarkerChange,
  renderMapExtras,
  pressDeltas = 0.001,
  searchDeltas = 0.002,
}) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getPlacementStyles(palette, isDarkMode);

  const [region, setRegion] = useState<Region | null>(null);
  const [marker, setMarker] = useState<Region | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Region | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [isValidPlacement, setIsValidPlacement] = useState<boolean>(false);
  const mapRef = useRef<MapView>(null);

  const currentMapStyle = useStoredMapStyle();
  const { hasDbConnection, isAlive } = useGameStatus();

  //WS hooks
  const missileData = useFetchMissiles();
  const lootData = useFetchLoot();
  const otherData = useFetchOther();
  const LandmineData = useFetchLandmines();

  async function initializeLocation() {
    // First, try to load the last known location
    const lastKnownLocation = await loadLastKnownLocation();
    if (lastKnownLocation) {
      setRegion(lastKnownLocation);
      setMarker(lastKnownLocation);
      setCurrentLocation(lastKnownLocation);
      // The starting marker is at the user's position — always a valid placement
      setIsValidPlacement(true);
    }

    // Then, check for permission and get current location
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Location permission is required.');
      setIsLocationEnabled(false);
      return;
    }

    try {
      const location = await Location.getCurrentPositionAsync({});
      const currentRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.004,
        longitudeDelta: 0.004,
      };
      setRegion(currentRegion);
      setMarker(currentRegion);
      setCurrentLocation(currentRegion);
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

  const handleMapPress = (e: any) => {
    const newMarker = {
      latitude: e.nativeEvent.coordinate.latitude,
      longitude: e.nativeEvent.coordinate.longitude,
      latitudeDelta: pressDeltas,
      longitudeDelta: pressDeltas,
    };

    let isValid = true;
    if (isMarkerValid) {
      isValid = isMarkerValid(newMarker, currentLocation);
      // Distinct tick vs. warning so players can feel valid/invalid spots.
      if (isValid) {
        haptics.select();
      } else {
        haptics.warning();
      }
    } else {
      haptics.select();
    }

    setIsValidPlacement(isValid);
    setMarker(newMarker);
    onMarkerChange?.(newMarker, isValid);
  };

  const handlePlaceSelected = (data: any, details: any = null) => {
    if (details && details.geometry) {
      const newRegion = {
        latitude: details.geometry.location.lat,
        longitude: details.geometry.location.lng,
        latitudeDelta: searchDeltas,
        longitudeDelta: searchDeltas,
      };
      setRegion(newRegion);
      setMarker(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
    }
  };

  const handleAction = () => {
    if (!marker || !currentLocation) {
      haptics.warning();
      Alert.alert('Not Ready', 'Waiting for your location. Please try again in a moment.');
      return;
    }

    if (isMarkerValid && !isValidPlacement) {
      haptics.error();
      return;
    }

    if (validateAction) {
      const result = validateAction(marker, currentLocation);
      if (!result.ok) {
        haptics.warning();
        if (result.alert) {
          Alert.alert(result.alert.title, result.alert.message);
        }
        return;
      }
    }

    onAction(marker, currentLocation);
  };

  const actionDisabled = Boolean(isMarkerValid) && !isValidPlacement;

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
            {renderMapExtras?.(currentLocation)}
            {marker && (
              <Circle
                center={marker}
                radius={markerCircle.radius}
                fillColor={markerCircle.fillColor}
                strokeColor={markerCircle.strokeColor}
              />
            )}
            {marker && (
              <Marker
                coordinate={marker}
                draggable
                onDragEnd={(e) => setMarker(prevMarker => ({
                  ...e.nativeEvent.coordinate,
                  latitudeDelta: prevMarker?.latitudeDelta || pressDeltas,
                  longitudeDelta: prevMarker?.longitudeDelta || pressDeltas,
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
                actionDisabled && styles.disabledButton,
                pressed && styles.pressed,
              ]}
              onPress={handleAction}
              disabled={actionDisabled}
            >
              <LinearGradient colors={actionGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                <Text style={styles.actionButtonText}>{actionLabel}</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
