import React, { useEffect, useState } from 'react';
import { Modal, View, TouchableOpacity, FlatList, Text, Image } from 'react-native';
import { LootPlacementPopup } from './lootplacement';
import { create } from 'twrnc';
import { InventoryItem } from '../../types/types';
import useFetchInventory from '../../hooks/websockets/inventoryhook';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { getImages } from '../../api/store';

const tw = create(require('../../tailwind.config.js'));

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

  const getModalHeight = () => {
    const itemCount = LootLibrary.length;
    if (itemCount <= 3) return 'h-1/3';
    if (itemCount <= 6) return 'h-1/2';
    return 'h-2/3';
  };

  const noItems = LootLibrary.length === 0;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={LootModalVisible}
      onRequestClose={LootPlaceHandler}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-lg p-4 w-11/12 ${getModalHeight()} max-h-[90%]`}>
          <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select your Loot:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items in inventory</Text>
              <TouchableOpacity 
                onPress={() => {
                  LootPlaceHandler(); // Close the loot modal
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
      </View>
      {showplacmentPopup && selectedLoot && (
        <LootPlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          selectedLoot={selectedLoot}
          onLootPlaced={handleLootPlaced}
        />
      )}
    </Modal>
  );
};
