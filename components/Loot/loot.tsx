import React from 'react';
import { LootPlacementPopup } from './lootplacement';
import { PlacementLibraryView } from '../ui/placement-library';

interface LootLibraryViewProps {
  LootModalVisible: boolean;
  LootPlaceHandler: () => void;
}

const LOOT_GRADIENT = ['#F7B733', '#FC4A1A'] as const;

export const LootLibraryView: React.FC<LootLibraryViewProps> = ({
  LootModalVisible,
  LootPlaceHandler,
}) => (
  <PlacementLibraryView
    visible={LootModalVisible}
    onClose={LootPlaceHandler}
    title="Loot Library"
    subtitle="Select a loot drop to request"
    accentColors={LOOT_GRADIENT}
    inventoryCategory="Loot Drops"
    getImageSource={(_name, getImage) => getImage('LootDrop')}
    renderPlacementPopup={({ visible, selectedType, onClose, onDismissed, onPlaced }) => (
      <LootPlacementPopup
        visible={visible}
        onClose={onClose}
        onDismissed={onDismissed}
        selectedLoot={{ type: selectedType }}
        onLootPlaced={onPlaced}
      />
    )}
  />
);