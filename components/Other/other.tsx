import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import { OtherPlacementPopup } from './otherplacement';
import { PlacementLibraryView } from '../ui/placement-library';
import { getPalette, Gradients, Radius, Spacing, Type } from '../ui/theme';
import { removeItem } from '../../api/add-item';
import { useLandmine } from '../../util/Context/landminecontext';

interface OtherLibraryViewProps {
  OtherModalVisible: boolean;
  OtherPlaceHandler: () => void;
}

export const OtherLibraryView: React.FC<OtherLibraryViewProps> = ({
  OtherModalVisible,
  OtherPlaceHandler,
}) => {
  const isDarkMode = useColorScheme() === 'dark';
  const c = getPalette(isDarkMode);
  const { activateLandmineSweeper } = useLandmine();
  const [showBriefPopup, setShowBriefPopup] = useState(false);

  return (
    <>
      <PlacementLibraryView
        visible={OtherModalVisible}
        onClose={OtherPlaceHandler}
        title="Special Items"
        subtitle="Select an item to place"
        accentColors={Gradients.brand}
        inventoryCategory="Other"
        onSelectItem={(type, { openPlacement }) => {
          if (type === 'LandmineSweep') {
            setShowBriefPopup(true);
            removeItem('LandmineSweep', 1);
            activateLandmineSweeper();
            setTimeout(() => {
              setShowBriefPopup(false);
              OtherPlaceHandler();
            }, 2000);
            return;
          }
          openPlacement(type);
        }}
        renderPlacementPopup={({ visible, selectedType, onClose, onDismissed, onPlaced }) => (
          <OtherPlacementPopup
            visible={visible}
            onClose={onClose}
            onDismissed={onDismissed}
            selectedOther={{ type: selectedType }}
            onOtherPlaced={onPlaced}
          />
        )}
      />
      {showBriefPopup && (
        <View style={[briefStyles.overlay, { backgroundColor: c.overlay }]}>
          <View style={[briefStyles.card, { backgroundColor: c.surface }]}>
            <Image
              source={require('../../assets/mapassets/landminesweeper.png')}
              style={briefStyles.image}
            />
            <Text style={[briefStyles.title, { color: c.text }]}>Landmine Sweeper used!</Text>
          </View>
        </View>
      )}
    </>
  );
};

const briefStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  image: {
    width: 64,
    height: 64,
    marginBottom: Spacing.md,
  },
  title: {
    ...Type.headline,
    fontSize: 17,
  },
});
