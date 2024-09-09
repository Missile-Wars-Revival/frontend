import { Dimensions, Modal, StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { MissilefireposLibrary } from "./missile";
import { useColorScheme } from 'react-native';
import { create } from 'twrnc';

const tw = create(require('../../tailwind.config.js'));

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
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.MissileModalVisible}
      onRequestClose={props.MissileModalHandler}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
        <View style={tw`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 w-11/12 h-[90%]`}>
          <MissilefireposLibrary onClose={props.MissileModalHandler} />
          <TouchableOpacity
            style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={props.MissileModalHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export const MissileFireConfirmationPopup = (props: MissileFireProps) => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.MissilefireposModalVisible}
      onRequestClose={props.exitHandler}
    >
      <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
      <View style={tw`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 w-11/12 h-[90%]`}>
          <MissilefireposLibrary onClose={props.exitHandler} />
          <TouchableOpacity
            style={tw`bg-red-500 px-6 py-2 rounded-lg mt-4 self-end`}
            onPress={props.exitHandler}
          >
            <Text style={tw`text-white font-bold`}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};