import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Switch, Modal, ScrollView, ImageSourcePropType, FlatList } from 'react-native';
import { router } from 'expo-router';
import { clearCredentials } from '../util/logincache';
import { useUserName } from '../util/fetchusernameglobal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../api/axios-instance';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '../types/types';

interface ItemImages {
  [key: string]: any;
}

export const itemimages: ItemImages = {
  Amplifier: require('../assets/missiles/Amplifier.png'),
  Ballista: require('../assets/missiles/Ballista.png'),
  BigBertha: require('../assets/missiles/BigBertha.png'),
  Bombabom: require('../assets/missiles/Bombabom.png'),
  BunkerBlocker: require('../assets/missiles/BunkerBlocker.png'),
  Buzzard: require('../assets/missiles/Buzzard.png'),
  ClusterBomb: require('../assets/missiles/ClusterBomb.png'),
  CorporateRaider: require('../assets/missiles/CorporateRaider.png'),
  GutShot: require('../assets/missiles/GutShot.png'),
  TheNuke: require('../assets/missiles/TheNuke.png'),
  Yokozuna: require('../assets/missiles/Yokozuna.png'),
  Zippy: require('../assets/missiles/Zippy.png'),
  LootDrop: require('../assets/mapassets/Airdropicon.png'),

  // Add other missile images here
};

const ProfilePage: React.FC = () => {

  const userNAME = useUserName(); //logged in user

  const handleLogout = async () => {
    await clearCredentials();
    router.push("/login");
  };

  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    fetchInventory().then(setInventory).catch(console.error);
    loadPreference();
  }, []);


  const loadPreference = async () => {
    const preference = await AsyncStorage.getItem('useBackgroundLocation');
    setUseBackgroundLocation(preference === 'true');
  };

  const fetchInventory = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        throw new Error("No authentication token found.");
      }
      const response = await axiosInstance.get('/api/getInventory', {
        params: { token }
      });
      return response.data.map((item: { category: any; name: string | number; }, index: any) => ({
        ...item,
        id: `${item.category}-${item.name}-${index}`, // Unique ID
        image: itemimages[item.name] as ImageSourcePropType
      }));
    } catch (error) {
      console.error('Failed to fetch inventory', error);
      throw error;
    }
  };


  const toggleSwitch = async () => {
    const newValue = !useBackgroundLocation;
    setUseBackgroundLocation(newValue);
    await Location.requestBackgroundPermissionsAsync()
    await AsyncStorage.setItem('useBackgroundLocation', newValue.toString());
  };

  const openSettings = () => {
    router.push("/settings");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile Page</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.profileContainer}>
        <Image style={styles.profileImage} source={{ uri: 'https://via.placeholder.com/150' }} />
        <Text style={styles.profileName}>{userNAME}</Text>
        <Text style={styles.profileDetails}>Email: example@example.com</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        <Text></Text>
        <Text>{useBackgroundLocation ? 'Background Location Access is enabled.' : 'Foreground Location Access'}</Text>
        <Switch onValueChange={toggleSwitch} value={useBackgroundLocation} />
        <Text></Text>
        <Text>Inventory</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewBar}>
          {inventory.map(item => (
            <TouchableOpacity key={item.id} onPress={() => setModalVisible(true)}>
              <Image style={styles.itemPreview} source={item.image} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View style={styles.fullModalView}>
            <FlatList
              data={inventory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.gridItem}>
                  <Image style={styles.gridItemImage} source={item.image} />
                  <Text style={styles.gridItemText}>{item.name} - Quantity: {item.quantity}</Text>
                </View>
              )}
              numColumns={4}
              columnWrapperStyle={styles.columnWrapper}
              contentContainerStyle={styles.contentContainer}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200ea',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  settingsButton: {
    position: 'absolute',
    top: 25,
    left: 330,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileDetails: {
    fontSize: 16,
    color: '#606060',
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#d9534f',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  previewBar: {
    marginTop: 20,
    flexDirection: 'row',
  },
  itemPreview: {
    width: 80,
    height: 80,
    marginRight: 10,
  },
  modalView: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullModalView: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%', // Adjust to full width
    height: '100%', // Adjust to full height
  },
  gridItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100, // Increased width for better visibility
    height: 150, // Height adjusted for better layout
    margin: 5,
  },
  gridItemImage: {
    width: '100%', // Use full width of the grid item
    height: 100, // Height reduced for better proportionality
    resizeMode: 'contain', // Ensure the image fits well
  },
  gridItemText: {
    fontSize: 12,
    textAlign: 'center',
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingVertical: 20,
  },
  closeButton: {
    padding: 10,
    backgroundColor: 'grey',
    borderRadius: 5,
    alignSelf: 'center', // Ensure the button is centered
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default ProfilePage;