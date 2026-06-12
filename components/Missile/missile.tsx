import React, { useEffect, useRef, useState } from "react";
import { Missilelib , InventoryItem } from "../../types/types";
import { Text, View, Pressable, Modal, useColorScheme, Platform } from "react-native";
import { Image } from "expo-image";
import { firemissileplayer } from "../../api/fireentities";
import { triggerGameEffect } from "../effects/game-effects";
import useFetchInventory from "../../hooks/websockets/inventoryhook";
import { router } from 'expo-router';
import { getImages } from "../../api/store";
import { useOnboarding } from "../../util/Context/onboardingContext";
import { InventoryEmptyState, InventoryItemList } from '../ui/inventory-library';
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
      <InventoryEmptyState
        isDark={isDarkMode}
        message="No missiles available"
        onGoToShop={() => {
          onClose();
          router.navigate('/store');
        }}
      />
    );
  }

  return (
    <InventoryItemList
      items={missiles}
      isDark={isDarkMode}
      getImageSource={getImageForProduct}
      onSelect={onSelect}
    />
  );
};

export const MissileLibrary = ({ playerName, onMissileFired, onClose }: { playerName?: string, onMissileFired: () => void, onClose: () => void }) => {
  const missileLibrary = useMissileLib();
  const [selectedMissile, setSelectedMissile] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));
  const { currentStep, moveToNextStep } = useOnboarding();

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
        // Launch feedback: rumble + full-screen Skia launch animation, played at
        // the app root (GameEffectsOverlay) so it survives the modal dismissal.
        triggerGameEffect('missileLaunch');
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

