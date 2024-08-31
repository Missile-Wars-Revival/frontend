import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Switch, Modal, ScrollView, ImageSourcePropType, FlatList, Alert } from 'react-native';
import { router } from 'expo-router';
import { clearCredentials } from '../util/logincache';
import { useUserName } from '../util/fetchusernameglobal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../api/axios-instance';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { InventoryItem } from '../types/types';
import useFetchInventory from '../hooks/websockets/inventoryhook';

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

const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png");

const ProfilePage: React.FC = () => {
  const userNAME = useUserName();
  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [friends, setFriends] = useState<{ username: string }[]>([]);
  const inventory = useFetchInventory();

  const handleLogout = async () => {
    await clearCredentials();
    router.push("/login");
  };

  const loadPreference = async () => {
    const preference = await AsyncStorage.getItem('useBackgroundLocation');
    setUseBackgroundLocation(preference === 'true');
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

  const saveImageUri = async (uri: string) => {
    await AsyncStorage.setItem('profileImageUri', uri);
    setUserImage(uri);
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const firstAsset = result.assets[0];
      if (firstAsset && firstAsset.uri) {
        setUserImage(firstAsset.uri); 
        saveImageUri(firstAsset.uri)
      }
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const firstAsset = result.assets[0];
      if (firstAsset && firstAsset.uri) {
        setUserImage(firstAsset.uri); 
        saveImageUri(firstAsset.uri)
      }
    }
  };

  const setdefaultasimage = async (image: any) => {
    setUserImage(null)
    await AsyncStorage.removeItem('profileImageUri');
  }

  const removePhoto = () => {
    Alert.alert(
      "Remove Profile Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => setdefaultasimage(resizedplayerimage) },
      ]
    );
  };

  const openImagePicker = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove Photo", onPress: removePhoto },
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
      ]
    );
  };

  const fetchFriends = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) throw new Error("No authentication token found.");
      const response = await axiosInstance.get('/api/friends', { params: { token } });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Failed to fetch friends', error);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    loadPreference();
    (async () => {
      // Request media library permissions
      const mediaLibraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaLibraryStatus.status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }

      // Request camera permissions
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
      }
      const savedImageUri = await AsyncStorage.getItem('profileImageUri');
      if (savedImageUri) {
        setUserImage(savedImageUri);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={openSettings}>
          <Ionicons name="settings" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileContainer}>
          <TouchableOpacity onPress={openImagePicker}>
            <Image
              source={userImage ? { uri: userImage } : resizedplayerimage}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>{userNAME}</Text>
          <Text style={styles.profileDetails}>Email: example@example.com</Text>
          
          <View style={styles.badgesContainer}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesList}>
              {/* Placeholder badges */}
              <View style={styles.badge}><Text>🏆</Text></View>
              <View style={styles.badge}><Text>🎖️</Text></View>
              <View style={styles.badge}><Text>🥇</Text></View>
            </View>
          </View>

          <View style={styles.settingContainer}>
            <Text style={styles.settingText}>
              {useBackgroundLocation ? 'Background Location Access is enabled.' : 'Foreground Location Access'}
            </Text>
            <Switch onValueChange={toggleSwitch} value={useBackgroundLocation} />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {inventory.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setModalVisible(true)} style={styles.sliderItem}>
                <Image style={styles.itemImage} source={itemimages[item.name]} />
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Friends</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {friends.map((friend, index) => (
              <TouchableOpacity key={index} style={styles.sliderItem}>
                <Image source={resizedplayerimage} style={styles.friendImage} />
                <Text style={styles.friendName}>{friend.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#4a5568',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileDetails: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 15,
  },
  badgesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  badgesList: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#edf2f7',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  settingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  settingText: {
    fontSize: 16,
    color: '#4a5568',
  },
  logoutButton: {
    backgroundColor: '#e53e3e',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#2d3748',
  },
  slider: {
    flexDirection: 'row',
  },
  sliderItem: {
    marginRight: 15,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  itemName: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#718096',
  },
  friendImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  friendName: {
    marginTop: 5,
    fontSize: 14,
    textAlign: 'center',
  },
  fullModalView: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  gridItem: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 150,
    margin: 5,
  },
  gridItemImage: {
    width: '100%',
    height: 100,
    resizeMode: 'contain',
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
    alignSelf: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    textAlign: 'center',
  },
});

export default ProfilePage;