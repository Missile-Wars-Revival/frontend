import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LandminePlacementPopup } from './landmineplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../../api/axios-instance';
import { create } from 'twrnc';

const tw = create(require('../../tailwind.config.js'));

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

//backend needs to fetch users landmine library
const fetchLandmineLib = async (): Promise<LandmineType[]> => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("No authentication token found.");
    }

    const response = await axiosInstance.get('/api/getInventory', {
      params: { token }
    });

    const inventory = response.data;

    // Filter the inventory to include only items with the category "Landmines"
    const landmineLibraryData = inventory
      .filter((item: { category: string; quantity: number;}) => item.category === "Landmines" && item.quantity > 0)
      .map((item: { name: any; quantity: any; }) => ({
        type: item.name,
        quantity: item.quantity
      }));

    return landmineLibraryData;
  } catch (error) {
    console.error('Failed to fetch landmine library', error);
    throw error;
  }
};

//landmine images for both map and library
export const LandmineImages: LandmineImages = {
  BigBertha: require('../../assets/missiles/BigBertha.png'),
  Bombabom: require('../../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../../assets/missiles/BunkerBlocker.png'),
  // ... other landmine images
};

const LandmineSelector = ({ onSelect, landmines }: { onSelect: (landmine: string) => void, landmines: LandmineType[] }) => (
  <ScrollView style={tw`flex-1`}>
    {landmines.map((landmine, index) => (
      <TouchableOpacity key={index} onPress={() => onSelect(landmine.type)} style={tw`flex-row items-center bg-white p-2 mb-1 rounded-lg shadow`}>
        <Image source={LandmineImages[landmine.type]} style={tw`w-8 h-8 mr-2`} />
        <View style={tw`flex-1`}>
          <Text style={tw`text-sm font-semibold`}>{landmine.type}</Text>
          <Text style={tw`text-xs text-gray-500`}>Quantity: {landmine.quantity}</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export const LandmineLibraryView: React.FC<LandmineLibraryViewProps> = ({ LandmineModalVisible, landminePlaceHandler }) => {
  const [landmineLibrary, setLandmineLibrary] = useState<LandmineType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLandmine, setSelectedLandmine] = useState<Landmine | null>(null);
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    fetchLandmineLib().then(data => {
      setLandmineLibrary(data);
      setLoading(false);
      setNoItems(data.length === 0);
    }).catch(error => {
      console.error('Error fetching Landmine library:', error);
    });
  }, []);

  const handleLandmineClick = (landmineType: string) => {
    setSelectedLandmine({ type: landmineType });
    setShowplacementPopup(true);
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  const getModalHeight = () => {
    if (loading || noItems) return 'h-1/3';
    const itemCount = landmineLibrary.length;
    if (itemCount <= 3) return 'h-1/3';
    if (itemCount <= 6) return 'h-1/2';
    return 'h-2/3';
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
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`bg-white rounded-lg p-4 w-11/12 ${getModalHeight()} max-h-[90%]`}>
          <Text style={tw`text-xl font-bold mb-2`}>Select your Landmine:</Text>
          {loading ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text>Loading...</Text>
            </View>
          ) : noItems ? (
            <Text style={tw`text-center mt-4`}>No items in inventory</Text>
          ) : (
            <LandmineSelector onSelect={handleLandmineClick} landmines={landmineLibrary} />
          )}
          <TouchableOpacity
            style={tw`bg-blue-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={landminePlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showplacmentPopup && (
        <LandminePlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          selectedLandmine={selectedLandmine}
        />
      )}
    </Modal>
  );
};
