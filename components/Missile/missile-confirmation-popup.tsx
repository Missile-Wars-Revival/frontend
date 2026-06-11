import React from 'react';
import { MissilePlacementPopup } from './missileplacement';
import { PlacementLibraryView } from '../ui/placement-library';
import { Gradients } from '../ui/theme';

interface MissileLibView {
  MissileModalVisible: boolean;
  MissileModalHandler: () => void;
}

export const MissileLibraryView = (props: MissileLibView) => (
  <PlacementLibraryView
    visible={props.MissileModalVisible}
    onClose={props.MissileModalHandler}
    title="Missile Library"
    subtitle="Select a missile to place on the map"
    accentColors={Gradients.fire}
    inventoryCategory="Missiles"
    renderPlacementPopup={({ visible, selectedType, onClose, onDismissed, onPlaced }) => (
      <MissilePlacementPopup
        visible={visible}
        onClose={onClose}
        onDismissed={onDismissed}
        selectedMissile={selectedType}
        onMissileFired={onPlaced}
      />
    )}
  />
);