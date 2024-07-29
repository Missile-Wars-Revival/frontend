import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LootPlacementPopup } from './lootplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../../api/axios-instance';

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

interface LootImages {
  [key: string]: any;
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



//Loot images for both map and library

export const LootLibraryView: React.FC<LootLibraryViewProps> = ({ LootModalVisible, LootPlaceHandler }) => {
  const [LootLibrary, setLootLibrary] = useState<LootType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLoot, setSelectedLoot] = useState<Loot | null>(null);
  const resizedlootimage = require("../../assets/mapassets/Airdropicon.png");

  useEffect(() => {
    fetchLootLib().then(data => {
      setLootLibrary(data);
      setLoading(false);
    }).catch(error => {
      console.error('Error fetching Loot library:', error);
    });
  }, []);

  const handleLootClick = (LootType: string) => {
    setSelectedLoot({ type: LootType });
    setShowplacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={LootModalVisible}
      onRequestClose={LootPlaceHandler}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text>Select your Loot:</Text>
            {LootLibrary.map((Loot, index) => (
              <TouchableOpacity key={index} onPress={() => handleLootClick(Loot.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <Image source={resizedlootimage} style={{ width: 50, height: 50, marginRight: 10 }} />
                <Text>{Loot.type} - Quantity: {Loot.quantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ alignSelf: 'flex-end', padding: 10 }}>
            <Button title="Done" onPress={LootPlaceHandler} />
          </View>
        </View>
      </View>
      {showplacmentPopup && <LootPlacementPopup visible={showplacmentPopup} onClose={handleClosePopup} selectedLoot={selectedLoot} />}
    </Modal>
  );
};
