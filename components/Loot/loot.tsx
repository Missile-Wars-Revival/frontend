import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity, FlatList, Text, Image , useColorScheme } from 'react-native';
import { LootPlacementPopup } from './lootplacement';
import { InventoryBottomSheet } from '../ui/inventory-bottom-sheet';
import { InventoryItem } from '../../types/types';
import useFetchInventory from '../../hooks/websockets/inventoryhook';

import { router } from 'expo-router';
import { getImages } from '../../api/store';
import { tw } from '../../util/twrnc';

interface LootType {
  type: string;
  quantity: number;
}

interface LootLibraryViewProps {
  LootModalVisible: boolean;
  LootPlaceHandler: () => void;
}

interface Loot {
  type: string;
}

const useLootLib = (): LootType[] => {
  const inventory = useFetchInventory();

  const lootLibrary = inventory
    .filter((item: InventoryItem) => item.category === "Loot Drops" && item.quantity > 0)
    .map((item: InventoryItem) => ({
      type: item.name,
      quantity: item.quantity
    }));

  return lootLibrary;
};

const LootSelector = ({ onSelect, loots }: { onSelect: (loot: string) => void, loots: LootType[] }) => {
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
      data={loots}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item: loot }) => (
        <TouchableOpacity 
          onPress={() => onSelect(loot.type)} 
          style={tw`flex-row items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-2 mb-1 rounded-lg shadow`}
        >
          <Image source={getImageForProduct("LootDrop")} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{loot.type}</Text>
            <Text style={tw`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity: {loot.quantity}</Text>
          </View>
        </TouchableOpacity>
      )}
      style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
      contentContainerStyle={tw`p-2`}
    />
  );
};

export const LootLibraryView: React.FC<LootLibraryViewProps> = ({ LootModalVisible, LootPlaceHandler }) => {
  const LootLibrary = useLootLib();
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLoot, setSelectedLoot] = useState<Loot | null>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const handleLootClick = (LootType: string) => {
    setSelectedLoot({ type: LootType });
    setShowplacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  const handleLootPlaced = () => {
    // Close the popup immediately
    setShowplacementPopup(false);
    LootPlaceHandler(); // This closes the entire library
  };

  const noItems = LootLibrary.length === 0;

  return (
    <>
      <InventoryBottomSheet
        visible={LootModalVisible}
        onClose={LootPlaceHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'} px-4 pt-2 pb-4`}>
          <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select your Loot:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items in inventory</Text>
              <TouchableOpacity
                onPress={() => {
                  LootPlaceHandler(); // Close the loot sheet
                  router.navigate('/store'); // Navigate to the store
                }}
                style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <LootSelector onSelect={handleLootClick} loots={LootLibrary} />
          )}
          <TouchableOpacity
            style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={LootPlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </InventoryBottomSheet>
      {showplacmentPopup && selectedLoot && (
        <LootPlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          selectedLoot={selectedLoot}
          onLootPlaced={handleLootPlaced}
        />
      )}
    </>
  );
};
