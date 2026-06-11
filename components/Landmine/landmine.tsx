import React from 'react';
import { LandminePlacementPopup } from './landmineplacement';
import { PlacementLibraryView } from '../ui/placement-library';
import { Gradients } from '../ui/theme';
import { useOnboarding } from '../../util/Context/onboardingContext';

interface LandmineLibraryViewProps {
  LandmineModalVisible: boolean;
  landminePlaceHandler: () => void;
}

export const LandmineLibraryView: React.FC<LandmineLibraryViewProps> = ({
  LandmineModalVisible,
  landminePlaceHandler,
}) => {
  const { currentStep, moveToNextStep } = useOnboarding();

  return (
    <PlacementLibraryView
      visible={LandmineModalVisible}
      onClose={landminePlaceHandler}
      title="Landmine Library"
      subtitle="Select a landmine to place"
      accentColors={Gradients.gold}
      inventoryCategory="Landmines"
      onSelectItem={(type, { openPlacement }) => {
        if (currentStep === 'choosefire_landmine') {
          moveToNextStep();
        }
        openPlacement(type);
      }}
      renderPlacementPopup={({ visible, selectedType, onClose, onDismissed, onPlaced }) => (
        <LandminePlacementPopup
          visible={visible}
          onClose={onClose}
          onDismissed={onDismissed}
          selectedLandmine={{ type: selectedType }}
          onLandminePlaced={onPlaced}
        />
      )}
    />
  );
};