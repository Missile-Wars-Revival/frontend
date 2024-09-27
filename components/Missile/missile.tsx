import { useState } from "react";
import { Missilelib } from "../../types/types";
import { Text, View, TouchableOpacity, Image, Dimensions, Modal, ScrollView, StyleSheet, useColorScheme } from "react-native";
import React from "react";
import { MissilePlacementPopup } from './missileplacement';
import { firemissileplayer } from "../../api/fireentities";
import { create } from 'twrnc';
import useFetchInventory from "../../hooks/websockets/inventoryhook";
import { InventoryItem } from '../../types/types';
import { router } from 'expo-router';

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


const useMissileLib = (): Missilelib[] => {
  const inventory = useFetchInventory();

  const missileLibrary = inventory
    .filter((item: InventoryItem) => item.category === "Missiles" && item.quantity > 0)
    .map((item: InventoryItem) => ({
      type: item.name,
      quantity: item.quantity
    }));

  return missileLibrary;
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
  ShieldBreaker: require('../../assets/missiles/Yokozuna.png'),
  Zippy: require('../../assets/missiles/Zippy.png'),

  // Add other missile images here
};

const MissileSelector = ({ onSelect, missiles, onClose }: { onSelect: (missile: string) => void, missiles: Missilelib[], onClose: () => void }) => {
  const isDarkMode = useColorScheme() === 'dark';

  if (missiles.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text style={tw`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          No missiles available.
        </Text>
        <TouchableOpacity 
          onPress={() => {
            onClose(); 
            router.navigate('/store'); 
          }}
          style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
        >
          <Text style={tw`text-white font-bold`}>Go to Shop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1`}>
      {missiles.map((missile, index) => (
        <TouchableOpacity 
          key={index} 
          onPress={() => onSelect(missile.type)} 
          style={tw`flex-row items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-2 mb-1 rounded-lg shadow`}
        >
          <Image source={missileImages[missile.type]} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{missile.type}</Text>
            <Text style={tw`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity: {missile.quantity}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const MissileLibrary = ({ playerName, onMissileFired, onClose }: { playerName?: string, onMissileFired: () => void, onClose: () => void }) => {
  const missileLibrary = useMissileLib();
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';

  const handleMissileClick = (missileType: string) => {
    setSelectedMissile(missileType);
    setShowPopup(true);
  };

  const handleFire = () => {
    if (selectedMissile) {
      // Close the popup and trigger callbacks immediately
      onMissileFired();
      onClose();
      setShowPopup(false);

      // Fire the missile in the background
      if (playerName) {
        firemissileplayer(playerName, selectedMissile)
          .catch(error => {
            console.error("Error firing missile:", error);
            // Optionally, you can show an error message to the user here
          });
      }
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
  };

  return (
    <View style={tw`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-lg p-4 h-[90%]`}>
      <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select Missile to Fire at {playerName}</Text>
      <MissileSelector onSelect={handleMissileClick} missiles={missileLibrary} onClose={onClose} />
      <Modal visible={showPopup} animationType="fade" transparent={true}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={tw`${isDarkMode ? 'bg-gray-900' : 'bg-white'} rounded-lg p-4 w-11/12 max-h-[90%]`}>
            <Text style={tw`text-lg font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Confirm Missile Launch</Text>
            <Text style={tw`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Target: {playerName}</Text>
            <Text style={tw`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Missile Type: {selectedMissile}</Text>
            <Image source={missileImages[selectedMissile || ""]} style={tw`w-24 h-24 mx-auto my-4`} />
            <View style={tw`flex-row justify-around w-full mt-4`}>
              <TouchableOpacity style={tw`bg-red-500 px-6 py-2 rounded-lg`} onPress={handleFire}>
                <Text style={tw`text-white font-bold`}>Fire</Text>
              </TouchableOpacity>
              <TouchableOpacity style={tw`${isDarkMode ? 'bg-gray-800' : 'bg-gray-500'} px-6 py-2 rounded-lg`} onPress={handleCancel}>
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
  const missileLibrary = useMissileLib();
  const [showPlacementPopup, setShowPlacementPopup] = useState(false);
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const handleMissileClick = (selectedMissile: string) => {
    setSelectedMissile(selectedMissile);
    setShowPlacementPopup(true);
  };

  const handleCancel = () => {
    setShowPlacementPopup(false);
    setSelectedMissile(null);
  };

  return (
    <View style={tw`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-lg p-4 h-[90%]`}>
      <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select Missile to Fire at Location</Text>
      <MissileSelector onSelect={handleMissileClick} missiles={missileLibrary} onClose={onClose} />
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