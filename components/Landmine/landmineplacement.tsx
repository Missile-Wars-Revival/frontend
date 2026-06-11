import React from 'react';
import { Alert } from 'react-native';
import { Circle, Polygon } from 'react-native-maps';
import { useUserName } from '../../util/fetchusernameglobal';
import { placelandmine } from '../../api/fireentities';
import { useOnboarding } from '../../util/Context/onboardingContext';
import { getLeagueAirspace } from '../player';
import { triggerGameEffect } from '../effects/game-effects';
import { Gradients } from '../ui/theme';
import { PlacementMapModal, Region } from '../placement/PlacementMapModal';

interface LandminePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedLandmine: { type: string };
  onLandminePlaced: () => void;
}

export const LandminePlacementPopup: React.FC<LandminePlacementPopupProps> = ({ visible, onClose, onDismissed, selectedLandmine, onLandminePlaced }) => {
  const userName = useUserName();
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();
  const userLeague = 'bronze'; // League fetch never wired up; bronze airspace is the historical behavior.

  const isWithinAirspace = (point: Region, center: Region | null): boolean => {
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
    <PlacementMapModal
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      actionLabel="Place Landmine"
      actionGradient={Gradients.fire}
      markerCircle={{ radius: 10, fillColor: 'rgba(128, 128, 128, 0.3)', strokeColor: 'rgba(128, 128, 128, 0.8)' }}
      isMarkerValid={isWithinAirspace}
      onMarkerChange={(_, isValid) => {
        if (isValid && currentStep === 'selectlandmine_location' && !isOnboardingComplete) {
          moveToNextStep();
        }
      }}
      validateAction={(marker, currentLocation) => {
        if (!isWithinAirspace(marker, currentLocation)) {
          return {
            ok: false,
            alert: {
              title: 'Out of Range',
              message: 'You can only place landmines within your league airspace. Tap a location inside the green circle.',
            },
          };
        }
        return { ok: true };
      }}
      renderMapExtras={(currentLocation) => currentLocation && (
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
      onAction={(marker, currentLocation) => {
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
      }}
    />
  );
};
