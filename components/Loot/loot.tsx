import React, { useState, useEffect } from 'react';
import { Modal, View, TouchableOpacity, Dimensions, ScrollView, Text, Image } from 'react-native';
import { LootPlacementPopup } from './lootplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../../api/axios-instance';
import { create } from 'twrnc';

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

//backend needs to fetch users Loot library
const fetchLootLib = async (): Promise<LootType[]> => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("No authentication token found.");
    }

    const response = await axiosInstance.get('/api/getInventory', {
      params: { token }
    });

    const inventory = response.data;

    // Filter the inventory to include only items with the category "Loots"
    const LootLibraryData = inventory
      .filter((item: { category: string; quantity: number;}) => item.category === "Loot Drops" && item.quantity > 0)
      .map((item: { name: any; quantity: any; }) => ({
        type: item.name,
        quantity: item.quantity
      }));

    return LootLibraryData;
  } catch (error) {
    console.error('Failed to fetch Loot library', error);
    throw error;
  }
};

const LootSelector = ({ onSelect, loots }: { onSelect: (loot: string) => void, loots: LootType[] }) => (
  <ScrollView style={tw`flex-1`}>
    {loots.map((loot, index) => (
      <TouchableOpacity key={index} onPress={() => onSelect(loot.type)} style={tw`flex-row items-center bg-white p-2 mb-1 rounded-lg shadow`}>
        <Image source={require("../../assets/mapassets/Airdropicon.png")} style={tw`w-8 h-8 mr-2`} />
        <View style={tw`flex-1`}>
          <Text style={tw`text-sm font-semibold`}>{loot.type}</Text>
          <Text style={tw`text-xs text-gray-500`}>Quantity: {loot.quantity}</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export const LootLibraryView: React.FC<LootLibraryViewProps> = ({ LootModalVisible, LootPlaceHandler }) => {
  const [LootLibrary, setLootLibrary] = useState<LootType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLoot, setSelectedLoot] = useState<Loot | null>(null);
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    fetchLootLib().then(data => {
      setLootLibrary(data);
      setLoading(false);
      setNoItems(data.length === 0);
    }).catch(error => {
      console.error('Error fetching Loot library:', error);
      setLoading(false);
    });
  }, []);

  const handleLootClick = (LootType: string) => {
    setSelectedLoot({ type: LootType });
    setShowplacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  const getModalHeight = () => {
    if (loading || noItems) return 'h-1/3';
    const itemCount = LootLibrary.length;
    if (itemCount <= 3) return 'h-1/3';
    if (itemCount <= 6) return 'h-1/2';
    return 'h-2/3';
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={LootModalVisible}
      onRequestClose={LootPlaceHandler}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white rounded-lg p-4 w-11/12 ${getModalHeight()} max-h-[90%]`}>
          <Text style={tw`text-xl font-bold mb-2`}>Select your Loot:</Text>
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text>Loading...</Text>
            </View>
          ) : noItems ? (
            <Text style={tw`text-center mt-4`}>No items in inventory</Text>
          ) : (
            <LootSelector onSelect={handleLootClick} loots={LootLibrary} />
          )}
          <TouchableOpacity
            style={tw`bg-blue-500 px-6 py-2 rounded-lg mt-4 self-end`}
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
        />
      )}
    </Modal>
  );
};
