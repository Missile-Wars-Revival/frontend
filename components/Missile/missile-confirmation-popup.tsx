import { View, Text, Pressable, Platform, useColorScheme } from "react-native";
import React, { useRef, useState } from "react";
import { MissilefireposLibrary } from "./missile";
import { MissilePlacementPopup } from './missileplacement';
import { InventoryBottomSheet } from '../ui/inventory-bottom-sheet';
import { tw } from '../../util/twrnc';

interface MissileLibView {
  MissileModalVisible: boolean;
  MissileModalHandler: () => void;
  selectedPlayerUsername: string;
}

export const MissileLibraryView = (props: MissileLibView) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPlacementPopup, setShowPlacementPopup] = useState(false);
  const closeLibraryAfterPopupRef = useRef(false);

  const handleSelectMissile = (missile: string) => {
    setSelectedMissile(missile);
    setShowPlacementPopup(true);
  };

  const handleCancelPlacement = () => {
    setShowPlacementPopup(false);
  };

  const handleMissileFired = () => {
    closeLibraryAfterPopupRef.current = true;
    setShowPlacementPopup(false);
    if (Platform.OS !== 'ios') {
      props.MissileModalHandler();
    }
  };

  const handlePopupDismissed = () => {
    if (closeLibraryAfterPopupRef.current) {
      closeLibraryAfterPopupRef.current = false;
      props.MissileModalHandler();
    }
  };

  return (
    <>
      <InventoryBottomSheet
        visible={props.MissileModalVisible}
        onClose={props.MissileModalHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={[tw`flex-1 px-4 pt-2 pb-4`, isDarkMode ? tw`bg-black` : tw`bg-white`]}>
          <MissilefireposLibrary onSelectMissile={handleSelectMissile} onClose={props.MissileModalHandler} />
          <Pressable
            style={({ pressed }) => [tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`, pressed && { opacity: 0.7 }]}
            onPress={props.MissileModalHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </Pressable>
        </View>
      </InventoryBottomSheet>
      {selectedMissile && (
        <MissilePlacementPopup
          visible={showPlacementPopup}
          onClose={handleCancelPlacement}
          onDismissed={handlePopupDismissed}
          selectedMissile={selectedMissile}
          onMissileFired={handleMissileFired}
        />
      )}
    </>
  );
};