import React from 'react';
import { useUserName } from '../../util/fetchusernameglobal';
import { placeLoot } from '../../api/fireentities';
import { triggerGameEffect } from '../effects/game-effects';
import { Gradients } from '../ui/theme';
import { PlacementMapModal } from '../placement/PlacementMapModal';

interface LootPlacementPopupProps {
  visible: boolean;
  onClose: () => void;
  onDismissed?: () => void;
  selectedLoot: { type: string };
  onLootPlaced: () => void;
}

export const LootPlacementPopup: React.FC<LootPlacementPopupProps> = ({ visible, onClose, onDismissed, selectedLoot, onLootPlaced }) => {
  const userName = useUserName();

  return (
    <PlacementMapModal
      visible={visible}
      onClose={onClose}
      onDismissed={onDismissed}
      actionLabel="Place Loot"
      actionGradient={Gradients.success}
      markerCircle={{ radius: 20, fillColor: 'rgba(0, 0, 255, 0.2)', strokeColor: 'rgba(0, 0, 255, 0.8)' }}
      onAction={(marker, currentLocation) => {
        // Drop feedback: thud haptic + full-screen Skia supply-drop animation.
        triggerGameEffect('lootDrop');

        // The parent owns closing: it dismisses this popup first, then the sheet.
        onLootPlaced();

        // Place the Loot in the background
        console.log(`PLACING Loot: Dest coords: ${marker.latitude}, ${marker.longitude}; sentbyUser: ${userName} Loot Type: ${selectedLoot.type}, current coords: ${currentLocation.latitude}, ${currentLocation.longitude}`);
        placeLoot(marker.latitude.toString(), marker.longitude.toString())
          .then(() => {
            console.log('Loot placed successfully');
          })
          .catch(error => {
            console.error('Error placing loot:', error);
          });
      }}
    />
  );
};
