import { useEffect, useState } from "react";
import { Missilelib } from "../../types/types";
import { Text, View, TouchableOpacity, Image, Dimensions, Modal, ScrollView, StyleSheet } from "react-native";
import React from "react";
import { MissilePlacementPopup } from './missileplacement';
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../../api/axios-instance";
import { firemissileplayer } from "../../api/fireentities";
import { create } from 'twrnc';

const tw = create(require('../../tailwind.config.js'));

//Missile types
//   Amplifier:
//   Ballista: 
//   BigBertha:
//   Bombabom: 
//   BunkerBlocker:
//   Buzzard: 
//   ClusterBomb: 
//   CorporateRaider: 
//   GutShot: 
//   TheNuke: 
//   Yokozuna: 
//   Zippy: 

//Missile Library needs to be fetched by backend:


const fetchMissileLib = async (): Promise<Missilelib[]> => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) {
      throw new Error("No authentication token found.");
    }

    const response = await axiosInstance.get('/api/getInventory', {
      params: { token }
    });

    const inventory = response.data;

    // Filter the inventory to include only items with the category "Missiles"
    const missileLibraryData = inventory
      .filter((item: { category: string; quantity: number;}) => item.category === "Missiles" && item.quantity > 0)
      .map((item: { name: any; quantity: any; }) => ({
        type: item.name,
        quantity: item.quantity
      }));

    return missileLibraryData;
  } catch (error) {
    console.error('Failed to fetch missile library', error);
    throw error;
  }
};

interface MissileImages {
  [key: string]: any;
}
// For Missile Images for both markers and library
export const missileImages: MissileImages = {
  Amplifier: require('../../assets/missiles/Amplifier.png'),
  Ballista: require('../../assets/missiles/Ballista.png'),
  BigBertha: require('../../assets/missiles/BigBertha.png'),
  Bombabom: require('../../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../../assets/missiles/BunkerBlocker.png'),
  Buzzard: require('../../assets/missiles/Buzzard.png'),
  ClusterBomb: require('../../assets/missiles/ClusterBomb.png'),
  CorporateRaider: require('../../assets/missiles/CorporateRaider.png'),
  GutShot: require('../../assets/missiles/GutShot.png'),
  TheNuke: require('../../assets/missiles/TheNuke.png'),
  Yokozuna: require('../../assets/missiles/Yokozuna.png'),
  Zippy: require('../../assets/missiles/Zippy.png'),

  // Add other missile images here
};

const MissileSelector = ({ onSelect, missiles }: { onSelect: (missile: string) => void, missiles: Missilelib[] }) => (
  <ScrollView style={tw`max-h-[60%]`}>
    {missiles.map((missile, index) => (
      <TouchableOpacity key={index} onPress={() => onSelect(missile.type)} style={tw`flex-row items-center bg-white p-4 mb-2 rounded-lg shadow`}>
        <Image source={missileImages[missile.type]} style={tw`w-12 h-12 mr-4`} />
        <View style={tw`flex-1`}>
          <Text style={tw`text-lg font-semibold`}>{missile.type}</Text>
          <Text style={tw`text-gray-500`}>Quantity: {missile.quantity}</Text>
        </View>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

export const MissileLibrary = ({ playerName, onMissileFired, onClose }: { playerName?: string, onMissileFired: () => void, onClose: () => void }) => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [noItems, setNoItems] = useState<boolean>(false);

  useEffect(() => {
    const fetchMissileLibrary = async () => {
      try {
        const missileLibraryData = await fetchMissileLib();
        setMissileLibrary(missileLibraryData);
        setNoItems(missileLibraryData.length === 0);
      } catch (error) {
        console.error('Error fetching missile library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissileLibrary();
  }, []);

  const handleMissileClick = (missileType: string) => {
    setSelectedMissile(missileType);
    setShowPopup(true);
  };

  const handleFire = async () => {
    if (selectedMissile) {
      try {
        if (playerName) {
          await firemissileplayer(playerName, selectedMissile);
        } else {
          // Handle firing at location (implement this function)
          // await firemissilelocation(selectedMissile, location);
        }
        // ... update library, etc.
        onMissileFired();
        onClose();
      } catch (error) {
        console.error("Error firing missile:", error);
      }
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
  };

  if (loading) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={tw`bg-white rounded-lg p-4 max-h-[80%]`}>
      <Text style={tw`text-xl font-bold mb-4`}>Select Missile to Fire at {playerName}</Text>
      <MissileSelector onSelect={handleMissileClick} missiles={missileLibrary} />
      <Modal visible={showPopup} animationType="fade" transparent={true}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`bg-white rounded-lg p-4 w-11/12 max-h-[90%]`}>
            <Text style={tw`text-lg font-bold mb-2`}>Confirm Missile Launch</Text>
            <Text>Target: {playerName}</Text>
            <Text>Missile Type: {selectedMissile}</Text>
            <Image source={missileImages[selectedMissile || ""]} style={tw`w-24 h-24 mx-auto my-4`} />
            <View style={tw`flex-row justify-around w-full mt-4`}>
              <TouchableOpacity style={tw`bg-red-500 px-6 py-2 rounded-lg`} onPress={handleFire}>
                <Text style={tw`text-white font-bold`}>Fire</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`bg-gray-500 px-6 py-2 rounded-lg`} onPress={handleCancel}>
                <Text style={tw`text-white font-bold`}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

//For when fire button is used without player
//This is what should be used when using fire-selector button
export const MissilefireposLibrary = ({ onClose }: { onClose: () => void }) => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPlacementPopup, setShowPlacementPopup] = useState(false);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);

  useEffect(() => {
    const fetchMissileLibrary = async () => {
      try {
        const missileLibraryData = await fetchMissileLib();
        setMissileLibrary(missileLibraryData);
      } catch (error) {
        console.error('Error fetching missile library:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMissileLibrary();
  }, []);

  const handleMissileClick = (selectedMissile: string) => {
    setSelectedMissile(selectedMissile);
    setShowPlacementPopup(true);
  };

  const handleCancel = () => {
    setShowPlacementPopup(false);
    setSelectedMissile(null);
  };

  if (loading) {
    return (
      <View style={tw`bg-white rounded-lg p-4 max-h-[80%]`}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={tw`bg-white rounded-lg p-4 max-h-[80%]`}>
      <Text style={tw`text-xl font-bold mb-4`}>Select Missile to Fire at Location</Text>
      <MissileSelector onSelect={handleMissileClick} missiles={missileLibrary} />
      {showPlacementPopup && selectedMissile && (
        <MissilePlacementPopup
          visible={showPlacementPopup}
          onClose={handleCancel}
          selectedMissile={selectedMissile}
          onMissileFired={() => {
            // Handle successful missile fire
            onClose();
          }}
        />
      )}
    </View>
  );
};