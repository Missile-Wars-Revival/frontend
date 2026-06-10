import React, { useEffect, useRef, useState } from 'react';
import { View, Pressable, FlatList, Text, useColorScheme, Platform } from 'react-native';
import { Image } from 'expo-image';
import { OtherPlacementPopup } from './otherplacement';
import { InventoryBottomSheet } from '../ui/inventory-bottom-sheet';
import { InventoryItem } from '../../types/types';
import useFetchInventory from '../../hooks/websockets/inventoryhook';

import { router } from 'expo-router';
import { removeItem } from '../../api/add-item';
import { useLandmine } from '../../util/Context/landminecontext';
import { getImages } from "../../api/store";
import { tw } from '../../util/twrnc';

interface OtherType {
  type: string;
  quantity: number;
}

interface OtherLibraryViewProps {
  OtherModalVisible: boolean;
  OtherPlaceHandler: () => void;
}

interface Other {
  type: string;
}

const useOtherLib = (): OtherType[] => {
  const inventory = useFetchInventory();

  return inventory.reduce<OtherType[]>((acc, item: InventoryItem) => {
    if (item.category === "Other" && item.quantity > 0) {
      acc.push({ type: item.name, quantity: item.quantity });
    }
    return acc;
  }, []);
};

const OtherSelector = ({ onSelect, Others }: { onSelect: (Other: string) => void, Others: OtherType[] }) => {
  const isDarkMode = useColorScheme() === 'dark';
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  return (
    <FlatList
      data={Others}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item: Other }) => (
        <Pressable
          onPress={() => onSelect(Other.type)}
          style={({ pressed }) => [
            tw`flex-row items-center p-2 mb-1 rounded-lg shadow`,
            isDarkMode ? tw`bg-gray-900` : tw`bg-white`,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Image source={getImageForProduct(Other.type)} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={[tw`text-sm font-semibold`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>{Other.type}</Text>
            <Text style={[tw`text-xs`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>Quantity: {Other.quantity}</Text>
          </View>
        </Pressable>
      )}
      style={[tw`flex-1`, isDarkMode ? tw`bg-black` : tw`bg-white`]}
      contentContainerStyle={tw`p-2`}
    />
  );
};

export const OtherLibraryView: React.FC<OtherLibraryViewProps> = ({ OtherModalVisible, OtherPlaceHandler }) => {
  const OtherLibrary = useOtherLib();
  const [showplacmentPopup, setShowplacementPopup] = useState<boolean>(false);
  const [selectedOther, setSelectedOther] = useState<Other | null>(null);
  const [showBriefPopup, setShowBriefPopup] = useState<boolean>(false);
  const isDarkMode = useColorScheme() === 'dark';
  const { activateLandmineSweeper } = useLandmine();

  const handleOtherClick = (OtherType: string) => {
    if (OtherType === "LandmineSweep") {
      setShowBriefPopup(true);
      removeItem("LandmineSweep", 1);
      activateLandmineSweeper();
      setTimeout(() => {
        setShowBriefPopup(false);
        OtherPlaceHandler(); // Close the library after the popup disappears
      }, 2000); // Popup will disappear after 2 seconds
    } else {
      setSelectedOther({ type: OtherType });
      setShowplacementPopup(true);
    }
  };

  const handleClosePopup = () => {
    setShowplacementPopup(false);
  };

  const closeLibraryAfterPopupRef = useRef(false);

  const handleOtherPlaced = () => {
    // Close the placement popup first; the sheet is closed once the popup has
    // fully dismissed (iOS serializes modal transitions, so dismissing both at
    // once leaves one of them stuck).
    closeLibraryAfterPopupRef.current = true;
    setShowplacementPopup(false);
    if (Platform.OS !== 'ios') {
      OtherPlaceHandler();
    }
  };

  const handlePopupDismissed = () => {
    if (closeLibraryAfterPopupRef.current) {
      closeLibraryAfterPopupRef.current = false;
      OtherPlaceHandler();
    }
  };

  const noItems = OtherLibrary.length === 0;

  return (
    <>
      <InventoryBottomSheet
        visible={OtherModalVisible}
        onClose={OtherPlaceHandler}
        backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
      >
        <View style={[tw`flex-1 px-4 pt-2 pb-4`, isDarkMode ? tw`bg-black` : tw`bg-white`]}>
          <Text style={[tw`text-xl font-bold mb-2`, isDarkMode ? tw`text-white` : tw`text-gray-800`]}>Select your Special Item:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={[tw`text-center mb-4`, isDarkMode ? tw`text-gray-400` : tw`text-gray-500`]}>No items in inventory</Text>
              <Pressable
                onPress={() => {
                  OtherPlaceHandler(); // Close the Other sheet
                  router.navigate('/store'); // Navigate to the store
                }}
                style={({ pressed }) => [tw`bg-blue-500 px-6 py-3 rounded-lg`, pressed && { opacity: 0.7 }]}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </Pressable>
            </View>
          ) : (
            <OtherSelector onSelect={handleOtherClick} Others={OtherLibrary} />
          )}
          <Pressable
            style={({ pressed }) => [tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`, pressed && { opacity: 0.7 }]}
            onPress={OtherPlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </Pressable>
        </View>
      </InventoryBottomSheet>
      {/* Stays mounted while hidden: unmounting an open RN Modal on iOS skips
          onDismiss, which would break the close sequencing above. */}
      {selectedOther && (
        <OtherPlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          onDismissed={handlePopupDismissed}
          selectedOther={selectedOther}
          onOtherPlaced={handleOtherPlaced}
        />
      )}
      {showBriefPopup && (
        <View style={tw`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50`}>
          <View style={[tw`p-6 rounded-lg items-center`, isDarkMode ? tw`bg-gray-800` : tw`bg-white`]}>
            <Image
              source={require("../../assets/mapassets/landminesweeper.png")}
              style={tw`w-16 h-16 mb-4`}
            />
            <Text style={[tw`text-lg font-bold`, isDarkMode ? tw`text-white` : tw`text-black`]}>
              Landmine Sweeper used!
            </Text>
          </View>
        </View>
      )}
    </>
  );
};