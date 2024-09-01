import { Dimensions, Modal, Button, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { MissilefireposLibrary } from "./missile";

interface MissileFireProps {
  MissilefireposModalVisible: boolean;
  exitHandler: () => void;
}

interface MissileLibView {
  MissileModalVisible: boolean;
  MissileModalHandler: () => void;
  selectedPlayerUsername: string;
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height - 200,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export const MissileLibraryView = (props: MissileLibView) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.MissileModalVisible}
      onRequestClose={props.MissileModalHandler}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <MissilefireposLibrary onClose={props.MissileModalHandler} />
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#4A5568' }]}
              onPress={props.MissileModalHandler}
            >
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export const MissileFireConfirmationPopup = (props: MissileFireProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={props.MissilefireposModalVisible}
      onRequestClose={props.exitHandler}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <MissilefireposLibrary onClose={props.exitHandler} />
        </View>
      </View>
    </Modal>
  );
};