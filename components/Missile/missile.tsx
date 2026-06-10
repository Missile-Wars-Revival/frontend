import React, { useEffect, useRef, useState } from "react";
import { Missilelib , InventoryItem } from "../../types/types";
import { Text, View, Pressable, Dimensions, Modal, ScrollView, StyleSheet, useColorScheme, Platform } from "react-native";
import { Image } from "expo-image";
import { firemissileplayer } from "../../api/fireentities";
import useFetchInventory from "../../hooks/websockets/inventoryhook";

import { router } from 'expo-router';
import { getImages } from "../../api/store";
import { useOnboarding } from "../../util/Context/onboardingContext";
import { tw } from '../../util/twrnc';

const useMissileLib = (): Missilelib[] => {
  const inventory = useFetchInventory();

  return inventory.reduce<Missilelib[]>((acc, item: InventoryItem) => {
    if (item.category === "Missiles" && item.quantity > 0) {
      acc.push({ type: item.name, quantity: item.quantity });
    }
    return acc;
  }, []);
};

const MissileSelector = ({ onSelect, missiles, onClose }: { onSelect: (missile: string) => void, missiles: Missilelib[], onClose: () => void }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  if (missiles.length === 0) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text style={[tw`text-lg mb-4`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>
          No missiles available.
        </Text>
        <Pressable
          onPress={() => {
            onClose();
            router.navigate('/store');
          }}
          style={({ pressed }) => [tw`bg-blue-500 px-6 py-3 rounded-lg`, pressed && { opacity: 0.7 }]}
        >
          <Text style={tw`text-white font-bold`}>Go to Shop</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={tw`flex-1`}>
      {missiles.map((missile, index) => (
        <Pressable
          key={index}
          onPress={() => onSelect(missile.type)}
          style={({ pressed }) => [
            tw`flex-row items-center p-2 mb-1 rounded-lg shadow`,
            isDarkMode ? tw`bg-gray-900` : tw`bg-white`,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image source={getImageForProduct(missile.type)} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={[tw`text-sm font-semibold`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>{missile.type}</Text>
            <Text style={[tw`text-xs`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>Quantity: {missile.quantity}</Text>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
};

export const MissileLibrary = ({ playerName, onMissileFired, onClose }: { playerName?: string, onMissileFired: () => void, onClose: () => void }) => {
  const missileLibrary = useMissileLib();
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));
  const { currentStep, isOnboardingComplete, moveToNextStep } = useOnboarding();

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  const handleMissileClick = (missileType: string) => {
    if (currentStep === 'choosemissile_fireplayermenu') {
      moveToNextStep();
    }
    setSelectedMissile(missileType);
    setShowPopup(true);
  };

  const fireCompletionPendingRef = useRef(false);

  const completeFire = () => {
    if (!fireCompletionPendingRef.current) return;
    fireCompletionPendingRef.current = false;
    onMissileFired();
    onClose();
  };

  const handleFire = () => {
    if (selectedMissile) {
      fireCompletionPendingRef.current = true;
      setShowPopup(false);
      if (Platform.OS !== 'ios') {
        completeFire();
      }

      if (playerName) {
        firemissileplayer(playerName, selectedMissile)
          .catch(error => {
            console.error("Error firing missile:", error);
          });
      }
    }
    if (currentStep === 'confirmmissile_fireplayermenu') {
      moveToNextStep();
    }
  };

  const handleCancel = () => {
    setShowPopup(false);
  };

  return (
    <View style={[tw`rounded-lg p-4 h-[90%]`, isDarkMode ? tw`bg-black` : tw`bg-white`]}>
      <Text style={[tw`text-xl font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Select Missile to Fire at {playerName}</Text>
      <MissileSelector onSelect={handleMissileClick} missiles={missileLibrary} onClose={onClose} />
      <Modal visible={showPopup} animationType="fade" transparent={true} onDismiss={completeFire}>
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <View style={[tw`rounded-lg p-4 w-11/12 max-h-[90%]`, isDarkMode ? tw`bg-gray-900` : tw`bg-white`]}>
            <Text style={[tw`text-lg font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Confirm Missile Launch</Text>
            <Text style={isDarkMode ? tw`text-gray-300` : tw`text-gray-600`}>Target: {playerName}</Text>
            <Text style={isDarkMode ? tw`text-gray-300` : tw`text-gray-600`}>Missile Type: {selectedMissile}</Text>
            <Image source={getImageForProduct(selectedMissile || "")} style={tw`w-24 h-24 mx-auto my-4`} />
            <View style={tw`flex-row justify-around w-full mt-4`}>
              <Pressable style={({ pressed }) => [tw`bg-red-500 px-6 py-2 rounded-lg`, pressed && { opacity: 0.7 }]} onPress={handleFire}>
                <Text style={tw`text-white font-bold`}>Fire</Text>
              </Pressable>
              <Pressable style={({ pressed }) => [tw`px-6 py-2 rounded-lg`, isDarkMode ? tw`bg-gray-800` : tw`bg-gray-500`, pressed && { opacity: 0.7 }]} onPress={handleCancel}>
                <Text style={tw`text-white font-bold`}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export const MissilefireposLibrary = ({ onSelectMissile, onClose }: { onSelectMissile: (missile: string) => void, onClose: () => void }) => {
  const missileLibrary = useMissileLib();
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <View style={tw`flex-1`}>
      <Text style={[tw`text-xl font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Select Missile to Fire at Location</Text>
      <MissileSelector onSelect={onSelectMissile} missiles={missileLibrary} onClose={onClose} />
    </View>
  );
};