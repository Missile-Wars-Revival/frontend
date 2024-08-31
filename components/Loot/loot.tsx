import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LootPlacementPopup } from './lootplacement';
import useFetchInventory from "../../hooks/websockets/inventoryhook";

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

// Use the websocket hook to fetch inventory
const inventoryItems = useFetchInventory();

// Loot images for both map and library
export const LootImages: LootImages = {
  // Add your loot images here, for example:
  Airdrop: require("../../assets/mapassets/Airdropicon.png"),
  // Add other loot images as needed
};

export const LootLibraryView: React.FC<LootLibraryViewProps> = ({ LootModalVisible, LootPlaceHandler }) => {
  const [LootLibrary, setLootLibrary] = useState<LootType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPlacementPopup, setShowPlacementPopup] = useState<boolean>(false);
  const [selectedLoot, setSelectedLoot] = useState<Loot | null>(null);
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    // Filter inventory items to get loot
    const LootLibraryData = inventoryItems
      .filter(item => item.category === "Loot Drops" && item.quantity > 0)
      .map(item => ({
        type: item.name,
        quantity: item.quantity
      }));

    setLootLibrary(LootLibraryData);
    setNoItems(LootLibraryData.length === 0);
    setLoading(false);
  }, [inventoryItems]);

  const handleLootClick = (LootType: string) => {
    setSelectedLoot({ type: LootType });
    setShowPlacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowPlacementPopup(false);
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
            {noItems ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>No Loot Available</Text>
                <Text style={{ textAlign: 'center' }}>You don't have any loot in your inventory. Visit the store to purchase some!</Text>
              </View>
            ) : (
              LootLibrary.map((Loot, index) => (
                <TouchableOpacity key={index} onPress={() => handleLootClick(Loot.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                  <Image source={LootImages[Loot.type] || LootImages.Airdrop} style={{ width: 50, height: 50, marginRight: 10 }} />
                  <Text>{Loot.type} - Quantity: {Loot.quantity}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={{ alignSelf: 'flex-end', padding: 10 }}>
            <Button title="Done" onPress={LootPlaceHandler} />
          </View>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPlacementPopup}>
        {showPlacementPopup && <LootPlacementPopup visible={showPlacementPopup} onClose={handleClosePopup} selectedLoot={selectedLoot} />}
      </Modal>
    </Modal>
  );
};
