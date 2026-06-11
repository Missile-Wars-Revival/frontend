import React from 'react';
import { Alert } from 'react-native';
import { useUserName } from '../../util/fetchusernameglobal';
import { firemissileloc } from '../../api/fireentities';
import { triggerGameEffect } from '../effects/game-effects';
import { Gradients } from '../ui/theme';
import { PlacementMapModal } from '../placement/PlacementMapModal';

interface MissilePlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedMissile: string;
  onMissileFired: () => void;
}

export const MissilePlacementPopup: React.FC<MissilePlacementPopupProps> = ({ visible, onClose, onDismissed, selectedMissile, onMissileFired }) => {
  const userName = useUserName();

  return (
    <PlacementMapModal
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      actionLabel="Fire Missile"
      actionGradient={Gradients.fire}
      markerCircle={{ radius: 40, fillColor: 'rgba(255, 0, 0, 0.2)', strokeColor: 'rgba(255, 0, 0, 0.8)' }}
      pressDeltas={0.01}
      searchDeltas={0.01}
      validateAction={(marker, currentLocation) => {
        if (marker.latitude === currentLocation.latitude && marker.longitude === currentLocation.longitude) {
          return {
            ok: false,
            alert: {
              title: 'Warning',
              message: 'Firing a Missile at your current location is not recommended! Move the target pin to a different location.',
            },
          };
        }
        return { ok: true };
      }}
      onAction={(marker, currentLocation) => {
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
      }}
    />
  );
};
