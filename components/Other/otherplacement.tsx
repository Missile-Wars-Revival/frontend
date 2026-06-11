import React from 'react';
import { useUserName } from '../../util/fetchusernameglobal';
import { placeOther } from '../../api/fireentities';
import { triggerGameEffect } from '../effects/game-effects';
import { Gradients } from '../ui/theme';
import { PlacementMapModal } from '../placement/PlacementMapModal';

interface OtherPlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedOther: { type: string };
  onOtherPlaced: () => void;
}

export const OtherPlacementPopup: React.FC<OtherPlacementPopupProps> = ({ visible, onClose, onDismissed, selectedOther, onOtherPlaced }) => {
  const userName = useUserName();

  return (
    <PlacementMapModal
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      actionLabel="Place Item"
      actionGradient={Gradients.brand}
      markerCircle={{ radius: 20, fillColor: 'rgba(0, 0, 255, 0.2)', strokeColor: 'rgba(0, 0, 255, 0.8)' }}
      onAction={(marker, currentLocation) => {
        // Power-up feedback: pulsing haptic + full-screen Skia shield animation.
        triggerGameEffect('shieldUp');

        // The parent owns closing: it dismisses this popup first, then the sheet.
        onOtherPlaced();

        // Place the Other in the background
        console.log(`PLACING Other: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Other Type: ${selectedOther.type}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
        placeOther(marker.latitude.toString(), marker.longitude.toString(), selectedOther.type)
          .catch(error => {
            console.error('Error placing Other:', error);
          });
      }}
    />
  );
};
