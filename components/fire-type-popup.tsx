import React, { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, useColorScheme, Dimensions } from "react-native";
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface FireTypeProps {
  landmineFireHandler: () => void;
  missileFireHandler: () => void;
  lootrequesthandler: () => void;
}

export const FireType = (props: FireTypeProps) => {
  const [FirepopupVisible, setFirePopupVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const FireshowPopup = () => {
    setFirePopupVisible(true);
  };

  const FireclosePopup = () => {
    setFirePopupVisible(false);
  };

  const selectFiretype = (style: string) => {
    FireclosePopup();
    switch (style) {
      case "firelandmine":
        props.landmineFireHandler();
        break;
      case "firemissile":
        props.missileFireHandler();
        break;
      case "lootdrop":
        props.lootrequesthandler();
        break;
      default:
        break;
    }
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.fireButton, isDarkMode && styles.fireButtonDark]}
        onPress={FireshowPopup}
      >
        <Ionicons name="flame" size={24} color={isDarkMode ? "#FFF" : "#000"} />
      </TouchableOpacity>

      <FireTypeStyle
        visible={FirepopupVisible}
        transparent={true}
        onClose={FireclosePopup}
        onSelect={selectFiretype}
        isDarkMode={isDarkMode}
      />
    </View>
  )
};

interface MapStylePopupProps {
  visible: boolean;
  transparent: boolean;
  onClose: () => void;
  onSelect: (style: string) => void;
  isDarkMode: boolean;
}

export const FireTypeStyle = ({
  visible,
  transparent,
  onClose,
  onSelect,
  isDarkMode,
}: MapStylePopupProps) => {
  return (
    <Modal
      animationType="slide"
      transparent={transparent}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Select Action</Text>
          <TouchableOpacity
            onPress={() => onSelect("firelandmine")}
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
          >
            <Ionicons name="radio-button-on" size={24} color={isDarkMode ? "#FFF" : "#000"} />
            <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Place Landmine</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("firemissile")}
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
          >
            <Ionicons name="rocket" size={24} color={isDarkMode ? "#FFF" : "#000"} />
            <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Fire Missile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onSelect("lootdrop")}
            style={[styles.actionButton, isDarkMode && styles.actionButtonDark]}
          >
            <Ionicons name="gift" size={24} color={isDarkMode ? "#FFF" : "#000"} />
            <Text style={[styles.actionText, isDarkMode && styles.actionTextDark]}>Request Loot Drop</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fireButton: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.04,
    backgroundColor: '#FFF',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  fireButtonDark: {
    backgroundColor: '#2C2C2C',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlayDark: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalContentDark: {
    backgroundColor: "#1E1E1E",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  modalTitleDark: {
    color: "#FFF",
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  actionButtonDark: {
    backgroundColor: "#2C2C2C",
  },
  actionText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#000",
  },
  actionTextDark: {
    color: "#FFF",
  },
});
