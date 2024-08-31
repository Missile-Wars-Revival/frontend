import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LandminePlacementPopup } from './landmineplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../../api/axios-instance';
import useFetchInventory from "../../hooks/websockets/inventoryhook";

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

// Use the websocket hook to fetch inventory
const inventoryItems = useFetchInventory();

//landmine images for both map and library
export const LandmineImages: LandmineImages = {
  BigBertha: require('../../assets/missiles/BigBertha.png'),
  Bombabom: require('../../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../../assets/missiles/BunkerBlocker.png'),
  // ... other landmine images
};

export const LandmineLibraryView: React.FC<LandmineLibraryViewProps> = ({ LandmineModalVisible, landminePlaceHandler }) => {
  const [landmineLibrary, setLandmineLibrary] = useState<LandmineType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPlacementPopup, setShowPlacementPopup] = useState<boolean>(false);
  const [selectedLandmine, setSelectedLandmine] = useState<Landmine | null>(null);
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    // Filter inventory items to get landmines
    const landmineLibraryData = inventoryItems
      .filter(item => item.category === "Landmines" && item.quantity > 0)
      .map(item => ({
        type: item.name,
        quantity: item.quantity
      }));

    setLandmineLibrary(landmineLibraryData);
    setNoItems(landmineLibraryData.length === 0);
    setLoading(false);
  }, [inventoryItems]);

  const handleLandmineClick = (landmineType: string) => {
    setSelectedLandmine({ type: landmineType });
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
      visible={LandmineModalVisible}
      onRequestClose={landminePlaceHandler}
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text>Select your Landmine:</Text>
            {noItems ? (
              <View style={{ alignItems: 'center', marginVertical: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>No Landmines Available</Text>
                <Text style={{ textAlign: 'center' }}>You don't have any landmines in your inventory. Visit the store to purchase some!</Text>
              </View>
            ) : (
              landmineLibrary.map((landmine, index) => (
                <TouchableOpacity key={index} onPress={() => handleLandmineClick(landmine.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                  <Image source={LandmineImages[landmine.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
                  <Text>{landmine.type} - Quantity: {landmine.quantity}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
          <View style={{ alignSelf: 'flex-end', padding: 10 }}>
            <Button title="Done" onPress={landminePlaceHandler} />
          </View>
        </View>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPlacementPopup}>
        {showPlacementPopup && <LandminePlacementPopup visible={showPlacementPopup} onClose={handleClosePopup} selectedLandmine={selectedLandmine} />}
      </Modal>
    </Modal>
  );
};
