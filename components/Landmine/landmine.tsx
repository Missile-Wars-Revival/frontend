import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, FlatList, Text, Image , useColorScheme } from 'react-native';
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

  const landmineLibrary = inventory
    .filter((item: InventoryItem) => item.category === "Landmines" && item.quantity > 0)
    .map((item: InventoryItem) => ({
      type: item.name,
      quantity: item.quantity
    }));

  return landmineLibrary;
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
        <TouchableOpacity 
          onPress={() => onSelect(landmine.type)} 
          style={tw`flex-row items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-2 mb-1 rounded-lg shadow`}
        >
          <Image source={getImageForProduct(landmine.type)} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{landmine.type}</Text>
            <Text style={tw`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity: {landmine.quantity}</Text>
          </View>
        </TouchableOpacity>
      )}
      style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
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

  const noItems = landmineLibrary.length === 0;

  return (
    <>
      <InventoryBottomSheet
        visible={LandmineModalVisible}
        onClose={landminePlaceHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'} px-4 pt-2 pb-4`}>
          <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select your Landmine:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items in inventory</Text>
              <TouchableOpacity
                onPress={() => {
                  landminePlaceHandler(); // Close the landmine sheet
                  router.navigate('/store'); // Navigate to the store
                }}
                style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <LandmineSelector onSelect={handleLandmineClick} landmines={landmineLibrary} />
          )}
          <TouchableOpacity
            style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={landminePlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </InventoryBottomSheet>
      {showplacmentPopup && selectedLandmine && (
        <LandminePlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          selectedLandmine={selectedLandmine}
          onLandminePlaced={() => {
            setShowplacementPopup(false);
            landminePlaceHandler(); // This should close the entire library
          }}
        />
      )}
    </>
  );
};
