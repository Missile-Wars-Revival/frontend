import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, FlatList, Text, useColorScheme, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LandminePlacementPopup } from './landmineplacement';
import { InventoryBottomSheet } from '../ui/inventory-bottom-sheet';
import { InventoryItem } from '../../types/types';
import useFetchInventory from '../../hooks/websockets/inventoryhook';

import { router } from 'expo-router';
import { getImages } from '../../api/store';
import { useOnboarding } from '../../util/Context/onboardingContext';
import { tw } from '../../util/twrnc';

interface LandmineType {
  type: string;
  quantity: number;
}

interface LandmineLibraryViewProps {
  LandmineModalVisible: boolean;
  landminePlaceHandler: () => void;
}

interface Landmine {
  type: string;
}

interface LandmineImages {
  [key: string]: any;
}

const useLandmineLib = (): LandmineType[] => {
  const inventory = useFetchInventory();

  return inventory.reduce<LandmineType[]>((acc, item: InventoryItem) => {
    if (item.category === "Landmines" && item.quantity > 0) {
      acc.push({ type: item.name, quantity: item.quantity });
    }
    return acc;
  }, []);
};

const LandmineSelector = ({ onSelect, landmines }: { onSelect: (landmine: string) => void, landmines: LandmineType[] }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  return (
    <FlatList
      data={landmines}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item: landmine }) => (
        <Pressable
          onPress={() => onSelect(landmine.type)}
          style={({ pressed }) => [
            tw`flex-row items-center p-2 mb-1 rounded-lg shadow`,
            isDarkMode ? tw`bg-gray-900` : tw`bg-white`,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image source={getImageForProduct(landmine.type)} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={[tw`text-sm font-semibold`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>{landmine.type}</Text>
            <Text style={[tw`text-xs`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>Quantity: {landmine.quantity}</Text>
          </View>
        </Pressable>
      )}
      style={[tw`flex-1`, isDarkMode ? tw`bg-black` : tw`bg-white`]}
      contentContainerStyle={tw`p-2`}
    />
  );
};

export const LandmineLibraryView: React.FC<LandmineLibraryViewProps> = ({ LandmineModalVisible, landminePlaceHandler }) => {
  const landmineLibrary = useLandmineLib();
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLandmine, setSelectedLandmine] = useState<Landmine | null>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const { currentStep, moveToNextStep, isOnboardingComplete } = useOnboarding();

  const handleLandmineClick = (landmineType: string) => {
    setSelectedLandmine({ type: landmineType });
    if (currentStep === 'choosefire_landmine') {
      moveToNextStep();
    }
    setShowplacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  const closeLibraryAfterPopupRef = useRef(false);

  const handleLandminePlaced = () => {
    // Close the placement popup first; the sheet is closed once the popup has
    // fully dismissed (iOS serializes modal transitions, so dismissing both at
    // once leaves one of them stuck).
    closeLibraryAfterPopupRef.current = true;
    setShowplacementPopup(false);
    if (Platform.OS !== 'ios') {
      landminePlaceHandler();
    }
  };

  const handlePopupDismissed = () => {
    if (closeLibraryAfterPopupRef.current) {
      closeLibraryAfterPopupRef.current = false;
      landminePlaceHandler();
    }
  };

  const noItems = landmineLibrary.length === 0;

  return (
    <>
      <InventoryBottomSheet
        visible={LandmineModalVisible}
        onClose={landminePlaceHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={[tw`flex-1 px-4 pt-2 pb-4`, isDarkMode ? tw`bg-black` : tw`bg-white`]}>
          <Text style={[tw`text-xl font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Select your Landmine:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={[tw`text-center mb-4`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>No items in inventory</Text>
              <Pressable
                onPress={() => {
                  landminePlaceHandler(); // Close the landmine sheet
                  router.navigate('/store'); // Navigate to the store
                }}
                style={({ pressed }) => [tw`bg-blue-500 px-6 py-3 rounded-lg`, pressed && { opacity: 0.7 }]}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </Pressable>
            </View>
          ) : (
            <LandmineSelector onSelect={handleLandmineClick} landmines={landmineLibrary} />
          )}
          <Pressable
            style={({ pressed }) => [tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`, pressed && { opacity: 0.7 }]}
            onPress={landminePlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </Pressable>
        </View>
      </InventoryBottomSheet>
      {/* Stays mounted while hidden: unmounting an open RN Modal on iOS skips
          onDismiss, which would break the close sequencing above. */}
      {selectedLandmine && (
        <LandminePlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          onDismissed={handlePopupDismissed}
          selectedLandmine={selectedLandmine}
          onLandminePlaced={handleLandminePlaced}
        />
      )}
    </>
  );
};