import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, Modal, StyleSheet, Image, Alert, useColorScheme } from 'react-native';
import * as AlternateAppIcon from 'expo-alternate-app-icons';

const iconOptions = [
  { name: 'default', path: require('../assets/appIcons/default.png') },
  { name: 'retro', path: require('../assets/appIcons/retro.png') },
  { name: 'graphic', path: require('../assets/appIcons/graphic.png') },
];

const AppIconChanger: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIcon, setCurrentIcon] = useState<string | null>(null);
  const [supportsAlternateIcons, setSupportsAlternateIcons] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const loadCurrentIcon = async () => {
      try {
        const supported = await AlternateAppIcon.supportsAlternateIcons;
        setSupportsAlternateIcons(supported);

        if (supported) {
          const iconName = await AlternateAppIcon.getAppIconName();
          setCurrentIcon(iconName || 'default');
        }
      } catch (error) {
        console.error('Error in loadCurrentIcon:', error);
        Alert.alert('Error', 'Failed to load current app icon information.');
      }
    };
    loadCurrentIcon();
  }, []);

  const changeAppIcon = async (iconName: string) => {
    try {
      if (iconName === 'default') {
        await AlternateAppIcon.setAlternateAppIcon(null);
      } else {
        await AlternateAppIcon.setAlternateAppIcon(iconName);
      }
      setCurrentIcon(iconName);
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to change app icon:', error);
      Alert.alert('Error', 'Failed to change app icon. Please try again.');
    }
  };

  if (!supportsAlternateIcons) {
    return null;
  }

  return (
    <View>
      <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.button, isDarkMode && styles.buttonDark]}>
        <Text style={styles.buttonText}>Change App Icon</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, isDarkMode && styles.modalViewDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Choose an App Icon</Text>
            {iconOptions.map((icon) => (
              <TouchableOpacity
                key={icon.name}
                style={[styles.iconOption, isDarkMode && styles.iconOptionDark]}
                onPress={() => changeAppIcon(icon.name)}
              >
                <Image source={icon.path} style={styles.iconImage} />
                <Text style={[styles.iconName, isDarkMode && styles.iconNameDark]}>{icon.name}</Text>
                {currentIcon === icon.name && (
                  <Text style={[styles.currentIcon, isDarkMode && styles.currentIconDark]}> (Current)</Text>
                )}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.closeButton, isDarkMode && styles.closeButtonDark]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#773765',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  buttonDark: {
    backgroundColor: '#5c2a4f',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalViewDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2d3748',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  iconOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
  },
  iconOptionDark: {
    backgroundColor: '#3C3C3C',
  },
  iconImage: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  iconName: {
    fontSize: 16,
    color: '#2d3748',
  },
  iconNameDark: {
    color: '#FFF',
  },
  currentIcon: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 5,
  },
  currentIconDark: {
    color: '#81C784',
  },
  closeButton: {
    backgroundColor: '#773765',
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginTop: 15,
    width: '100%',
    alignItems: 'center',
  },
  closeButtonDark: {
    backgroundColor: '#5c2a4f',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default AppIconChanger;


//for app.json
// [
//     "expo-alternate-app-icons",
//     ["./assets/appIcons/default.png", "./assets/appIcons/retro.png", "./assets/appIcons/graphic.png"]
//   ]