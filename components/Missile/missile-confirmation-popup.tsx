import { View, Text, TouchableOpacity , useColorScheme } from "react-native";
import React from "react";
import { MissilefireposLibrary } from "./missile";
import { InventoryBottomSheet } from '../ui/inventory-bottom-sheet';
import { tw } from '../../util/twrnc';

interface MissileFireProps {
  MissilefireposModalVisible: boolean;
  exitHandler: () => void;
}

interface MissileLibView {
  MissileModalVisible: boolean;
  MissileModalHandler: () => void;
  selectedPlayerUsername: string;
}

export const MissileLibraryView = (props: MissileLibView) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <InventoryBottomSheet
      visible={props.MissileModalVisible}
      onClose={props.MissileModalHandler}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
    >
      <View style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'} px-4 pt-2 pb-4`}>
        <MissilefireposLibrary onClose={props.MissileModalHandler} />
        <TouchableOpacity
          style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
          onPress={props.MissileModalHandler}
        >
          <Text style={tw`text-white font-bold`}>Done</Text>
        </TouchableOpacity>
      </View>
    </InventoryBottomSheet>
  )
}

export const MissileFireConfirmationPopup = (props: MissileFireProps) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <InventoryBottomSheet
      visible={props.MissilefireposModalVisible}
      onClose={props.exitHandler}
      backgroundColor={isDarkMode ? '#000000' : '#ffffff'}
    >
      <View style={tw`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'} px-4 pt-2 pb-4`}>
        <MissilefireposLibrary onClose={props.exitHandler} />
        <TouchableOpacity
          style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
          onPress={props.exitHandler}
        >
          <Text style={tw`text-white font-bold`}>Done</Text>
        </TouchableOpacity>
      </View>
    </InventoryBottomSheet>
  );
};
