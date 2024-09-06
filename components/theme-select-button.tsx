import React, { useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Modal, useColorScheme, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface ThemeSelectProps {
  onPress: (theme: string) => void;
  showPopup: () => void;  // Add this line
}

export const ThemeSelectButton = (props: ThemeSelectProps) => {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const showModal = () => {
    setModalVisible(true);
    // Remove the call to props.showPopup() here
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const selectTheme = (theme: string) => {
    props.onPress(theme);
    closeModal();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.fabButton, isDarkMode && styles.fabButtonDark]}
        onPress={showModal}
      >
        <Ionicons name="color-palette" size={30} color={isDarkMode ? "#FFF" : "#000"} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Select Theme</Text>
              <TouchableOpacity onPress={closeModal}>
                <Ionicons name="close" size={24} color={isDarkMode ? "#FFF" : "#000"} />
              </TouchableOpacity>
            </View>
            {["default", "radar", "cherry", "cyberpunk", "colorblind"].map((theme) => (
              <TouchableOpacity
                key={theme}
                onPress={() => selectTheme(theme)}
                style={[styles.themeOption, isDarkMode && styles.themeOptionDark]}
              >
                <Ionicons 
                  name={
                    theme === "default" ? "map" :
                    theme === "radar" ? "radio" :
                    theme === "cherry" ? "flower" :
                    theme === "cyberpunk" ? "flash" : "eye"
                  } 
                  size={24} 
                  color={isDarkMode ? "#FFF" : "#000"} 
                />
                <Text style={[styles.themeText, isDarkMode && styles.themeTextDark]}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: width * 0.22,
  },
  fabButton: {
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
  fabButtonDark: {
    backgroundColor: '#2C2C2C',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalOverlayDark: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContentDark: {
    backgroundColor: "#1E1E1E",
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  modalTitleDark: {
    color: "#FFF",
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F0F0F0",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    width: '100%',
  },
  themeOptionDark: {
    backgroundColor: "#2C2C2C",
  },
  themeText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#000",
  },
  themeTextDark: {
    color: "#FFF",
  },
});