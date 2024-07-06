import React, { useState, useEffect } from 'react';
import { Modal, View, Button, Dimensions, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import { LandminePlacementPopup } from './landmineplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../../api/axios-instance';

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
      .filter((item: { category: string; }) => item.category === "Landmines")
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
  Amplifier: require('../../assets/missiles/Amplifier.png'),
  Ballista: require('../../assets/missiles/Ballista.png'),
  BigBertha: require('../../assets/missiles/BigBertha.png'),
  Bombabom: require('../../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../../assets/missiles/BunkerBlocker.png'),
  // ... other landmine images
};

export const LandmineLibraryView: React.FC<LandmineLibraryViewProps> = ({ LandmineModalVisible, landminePlaceHandler }) => {
  const [landmineLibrary, setLandmineLibrary] = useState<LandmineType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedLandmine, setSelectedLandmine] = useState<Landmine | null>(null);

  useEffect(() => {
    fetchLandmineLib().then(data => {
      setLandmineLibrary(data);
      setLoading(false);
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
            {landmineLibrary.map((landmine, index) => (
              <TouchableOpacity key={index} onPress={() => handleLandmineClick(landmine.type)} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
                <Image source={LandmineImages[landmine.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
                <Text>{landmine.type} - Quantity: {landmine.quantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={{ alignSelf: 'flex-end', padding: 10 }}>
            <Button title="Done" onPress={landminePlaceHandler} />
          </View>
        </View>
      </View>
      {showplacmentPopup && <LandminePlacementPopup visible={showplacmentPopup} onClose={handleClosePopup} selectedLandmine={selectedLandmine} />}
    </Modal>
  );
};
