import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, FlatList, Text, Image } from 'react-native';
import { OtherPlacementPopup } from './otherplacement';
import { create } from 'twrnc';
import { InventoryItem } from '../../types/types';
import useFetchInventory from '../../hooks/websockets/inventoryhook';
import { useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { removeItem } from '../../api/add-item';
import { useLandmine } from '../../util/Context/landminecontext';
import { itemimages } from '../../app/profile';

const tw = create(require('../../tailwind.config.js'));

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

  const OtherLibrary = inventory
    .filter((item: InventoryItem) => item.category === "Other" && item.quantity > 0)
    .map((item: InventoryItem) => ({
      type: item.name,
      quantity: item.quantity
    }));

  return OtherLibrary;
};

const OtherSelector = ({ onSelect, Others }: { onSelect: (Other: string) => void, Others: OtherType[] }) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <FlatList
      data={Others}
      keyExtractor={(item, index) => `${item.type}-${index}`}
      renderItem={({ item: Other }) => (
        <TouchableOpacity 
          onPress={() => onSelect(Other.type)} 
          style={tw`flex-row items-center ${isDarkMode ? 'bg-gray-900' : 'bg-white'} p-2 mb-1 rounded-lg shadow`}
        >
          <Image source={itemimages[Other.type]} style={tw`w-8 h-8 mr-2`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{Other.type}</Text>
            <Text style={tw`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Quantity: {Other.quantity}</Text>
          </View>
        </TouchableOpacity>
      )}
      style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'}`}
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

  const handleOtherPlaced = () => {
    // Close the popup immediately
    setShowplacementPopup(false);
    OtherPlaceHandler(); // This closes the entire library
  };

  const getModalHeight = () => {
    const itemCount = OtherLibrary.length;
    if (itemCount <= 3) return 'h-1/3';
    if (itemCount <= 6) return 'h-1/2';
    return 'h-2/3';
  };

  const noItems = OtherLibrary.length === 0;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={OtherModalVisible}
      onRequestClose={OtherPlaceHandler}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`${isDarkMode ? 'bg-black' : 'bg-white'} rounded-lg p-4 w-11/12 ${getModalHeight()} max-h-[90%]`}>
          <Text style={tw`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>Select your Other:</Text>
          {noItems ? (
            <View style={tw`flex-1 justify-center items-center`}>
              <Text style={tw`text-center mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No items in inventory</Text>
              <TouchableOpacity 
                onPress={() => {
                  OtherPlaceHandler(); // Close the Other modal
                  router.navigate('/store'); // Navigate to the store
                }}
                style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
              >
                <Text style={tw`text-white font-bold`}>Go to Shop</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <OtherSelector onSelect={handleOtherClick} Others={OtherLibrary} />
          )}
          <TouchableOpacity
            style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={OtherPlaceHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
      {showplacmentPopup && selectedOther && (
        <OtherPlacementPopup
          visible={showplacmentPopup}
          onClose={handleClosePopup}
          selectedOther={selectedOther}
          onOtherPlaced={handleOtherPlaced}
        />
      )}
      {showBriefPopup && (
        <View style={tw`absolute inset-0 flex items-center justify-center bg-black bg-opacity-50`}>
          <View style={tw`${isDarkMode ? 'bg-gray-800' : 'bg-white'} p-6 rounded-lg items-center`}>
            <Image 
              source={require("../../assets/mapassets/landminesweeper.png")} 
              style={tw`w-16 h-16 mb-4`} 
            />
            <Text style={tw`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>
              Landmine Sweeper used!
            </Text>
          </View>
        </View>
      )}
    </Modal>
  );
};
