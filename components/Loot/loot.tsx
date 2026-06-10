import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, FlatList, Text, useColorScheme, Platform } from 'react-native';
import { Image } from 'expo-image';
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

  return inventory.reduce<LootType[]>((acc, item: InventoryItem) => {
    if (item.category === "Loot Drops" && item.quantity > 0) {
      acc.push({ type: item.name, quantity: item.quantity });
    }
    return acc;
  }, []);
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
        <Pressable
          onPress={() => onSelect(loot.type)}
          style={({ pressed }) => [
            tw`flex-row items-center p-2 mb-1 rounded-lg shadow`,
            isDarkMode ? tw`bg-gray-900` : tw`bg-white`,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image source={getImageForProduct("LootDrop")} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={[tw`text-sm font-semibold`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>{loot.type}</Text>
            <Text style={[tw`text-xs`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>Quantity: {loot.quantity}</Text>
          </View>
        </Pressable>
      )}
      style={[tw`flex-1`, isDarkMode ? tw`bg-black` : tw`bg-white`]}
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

  const closeLibraryAfterPopupRef = useRef(false);

  const handleLootPlaced = () => {
    // Close the placement popup first; the sheet is closed once the popup has
    // fully dismissed (iOS serializes modal transitions, so dismissing both at
    // once leaves one of them stuck).
    closeLibraryAfterPopupRef.current = true;
    setShowplacementPopup(false);
    if (Platform.OS !== 'ios') {
      LootPlaceHandler();
    }
  };

  const handlePopupDismissed = () => {
    if (closeLibraryAfterPopupRef.current) {
      closeLibraryAfterPopupRef.current = false;
      LootPlaceHandler();
    }
  };

  const noItems = LootLibrary.length === 0;

  return (
    <>
      <InventoryBottomSheet
        visible={LootModalVisible}
        onClose={LootPlaceHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={[tw`flex-1 px-4 pt-2 pb-4`, isDarkMode ? tw`bg-black` : tw`bg-white`]}>
          <Text style={[tw`text-xl font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Select your Loot:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={[tw`text-center mb-4`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>No items in inventory</Text>
              <Pressable
                onPress={() => {
                  LootPlaceHandler(); // Close the loot sheet
                  router.navigate('/store'); // Navigate to the store
                }}
                style={({ pressed }) => [tw`bg-blue-500 px-6 py-3 rounded-lg`, pressed && { opacity: 0.7 }]}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </Pressable>
            </View>
          ) : (
            <LootSelector onSelect={handleLootClick} loots={LootLibrary} />
          )}
          <Pressable
            style={({ pressed }) => [tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`, pressed && { opacity: 0.7 }]}
            onPress={LootPlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </Pressable>
        </View>
      </InventoryBottomSheet>
      {/* Stays mounted while hidden: unmounting an open RN Modal on iOS skips
          onDismiss, which would break the close sequencing above. */}
      {selectedLoot && (
        <LootPlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          onDismissed={handlePopupDismissed}
          selectedLoot={selectedLoot}
          onLootPlaced={handleLootPlaced}
        />
      )}
    </>
  );
};