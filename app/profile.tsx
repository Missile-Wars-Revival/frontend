import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Switch, Modal, ScrollView, FlatList, Alert, Image } from 'react-native';
import { router } from 'expo-router';
import { clearCredentials } from '../util/logincache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SecureStore from "expo-secure-store";
import axiosInstance from '../api/axios-instance';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useFetchInventory from '../hooks/websockets/inventoryhook';
import { getselfprofile } from '../api/getprofile';
import { Statistics } from './user-profile';
import firebase from '../util/firebase/config';
import { fetchAndCacheImage } from '../util/imagecache';
import { useAuth } from '../util/Context/authcontext';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

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

interface SelfProfile {
  username: string;
  email: string;
  rankpoints: number;
  mutualFriends: string[];
  statistics: Statistics;
}

interface ApiResponse {
  success: boolean;
  userProfile: SelfProfile;
}

interface Friend {
  username: string;
  profileImageUrl: string;
}

const ProfilePage: React.FC = () => {
  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const inventory = useFetchInventory();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [friendImages, setFriendImages] = useState<{ [key: string]: string }>({});
  const [rankPoints, setRankPoints] = useState<number | null>(null);
  const { setIsSignedIn } = useAuth();

  useEffect(() => {
    const fetchUsername = async () => {
      const name = await SecureStore.getItemAsync("username");
      setUsername(name);
    };
    fetchUsername();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => item.quantity > 0);
  }, [inventory]);

  const handleLogout = async () => {
    await clearCredentials();
    await AsyncStorage.setItem('signedIn', 'false');
    setIsSignedIn(false);
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

  const loadProfileImage = async () => {
    const name = await SecureStore.getItemAsync("username");
    if (name) {
      const imageUrl = await fetchAndCacheImage(name);
      setUserImageUrl(imageUrl);
    }
  };

  const uploadImageToFirebase = async (uri: string) => {
    const name = await SecureStore.getItemAsync("username");
    const response = await fetch(uri);
    const blob = await response.blob();
    const ref = firebase.storage().ref().child(`profileImages/${name}`);
    await ref.put(blob);
    const url = await ref.getDownloadURL();
    return url;
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
        const url = await uploadImageToFirebase(firstAsset.uri);
        await loadProfileImage(); // Reload the image to ensure it's updated in the UI
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
        const url = await uploadImageToFirebase(firstAsset.uri);
        await loadProfileImage(); // Reload the image to ensure it's updated in the UI
      }
    }
  };

  const setdefaultasimage = async () => {
    setUserImageUrl(null);
    await AsyncStorage.removeItem(`profileImage_${username}`);
    
    // Remove the image from Firebase Storage
    try {
      await firebase.storage().ref(`profileImages/${username}`).delete();
    } catch (error) {
      console.error('Error deleting image from Firebase:', error);
    }
    // Reload the default image
    await loadProfileImage();
  };

  const removePhoto = () => {
    Alert.alert(
      "Remove Profile Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", onPress: () => setdefaultasimage() },
      ]
    );
  };

  const openImagePicker = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose an option",
      [
        { text: "Take Photo", onPress: takePhoto },
        { text: "Choose from Library", onPress: pickImage },
        { text: "Remove Photo", onPress: removePhoto },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const fetchFriends = async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) throw new Error("No authentication token found.");
      const response = await axiosInstance.get('/api/friends', { params: { token } });
      const friendsData = response.data.friends || [];
      
      // Fetch and cache friend profile images
      const images: { [key: string]: string } = {};
      for (const friend of friendsData) {
        images[friend.username] = await fetchAndCacheImage(friend.username);
      }
      setFriendImages(images);
      
      setFriends(friendsData);
    } catch (error) {
      console.error('Failed to fetch friends', error);
    }
  };

  const navigateToUserProfile = (username: string) => {
    router.push({
      pathname: "/user-profile",
      params: { username }
    });
  };

  useEffect(() => {
    loadProfileImage();
    fetchFriends();
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
    })();
  }, []);

  useEffect(() => {
    loadPreference();
    fetchUserStatistics();
  }, []);

  const fetchUserStatistics = async () => {
    try {
      const response = await getselfprofile() as ApiResponse;
      if (response.success && response.userProfile) {
        setStatistics(response.userProfile.statistics);
        setEmail(response.userProfile.email);
        setRankPoints(response.userProfile.rankpoints);
      } else {
        console.error('Failed to fetch user statistics: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user statistics', error);
    }
  };
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
              source={{ uri: userImageUrl || Image.resolveAssetSource(DEFAULT_IMAGE).uri }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={styles.profileName}>{username}</Text>
          <Text style={styles.profileDetails}>Email: {email}</Text>
          
          <View style={styles.rankPointsContainer}>
            <Text style={styles.rankPoints}>🏅 {rankPoints !== null ? rankPoints : 'Loading...'} Rank Points</Text>
          </View>
          
          <View style={styles.badgesContainer}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <View style={styles.badgesList}>
              {statistics && statistics.badges && statistics.badges.length > 0 ? (
                statistics.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}><Text>{badge}</Text></View>
                ))
              ) : (
                <Text>No badges yet</Text>
              )}
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
          <Text style={styles.sectionTitle}>Statistics</Text>
          {statistics ? (
            <View style={styles.statisticsContainer}>
              <Text style={styles.statItem}>Deaths: {statistics.numDeaths}</Text>
              <Text style={styles.statItem}>Loot Placed: {statistics.numLootPlaced}</Text>
              <Text style={styles.statItem}>Landmines Placed: {statistics.numLandminesPlaced}</Text>
              <Text style={styles.statItem}>Missiles Placed: {statistics.numMissilesPlaced}</Text>
              <Text style={styles.statItem}>Loot Pickups: {statistics.numLootPickups}</Text>
            </View>
          ) : (
            <Text>Loading statistics...</Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Inventory</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {filteredInventory.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setModalVisible(true)} style={styles.sliderItem}>
                <Image
                  source={itemimages[item.name]}
                  style={styles.itemImage}
                />
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
              <TouchableOpacity 
                key={index} 
                style={styles.sliderItem}
                onPress={() => navigateToUserProfile(friend.username)}
              >
                <Image
                  source={{ uri: friendImages[friend.username] || Image.resolveAssetSource(DEFAULT_IMAGE).uri }}
                  style={styles.friendImage}
                />
                <Text style={styles.friendName}>{friend.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Your Inventory</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fullModalView}>
            {filteredInventory.length > 0 ? (
              <FlatList
                data={filteredInventory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.inventoryItem}>
                    <Image
                      source={itemimages[item.name]}
                      style={styles.inventoryItemImage}
                    />
                    <View style={styles.inventoryItemDetails}>
                      <Text style={styles.inventoryItemName}>{item.name}</Text>
                      <Text style={styles.inventoryItemQuantity}>Quantity: {item.quantity}</Text>
                    </View>
                  </View>
                )}
                numColumns={2}
                columnWrapperStyle={styles.inventoryColumnWrapper}
                contentContainerStyle={styles.inventoryContentContainer}
              />
            ) : (
              <Text style={styles.emptyInventoryText}>Your inventory is empty.</Text>
            )}
          </View>
        </SafeAreaView>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  emptyInventoryText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
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
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  fullModalView: {
    flex: 1,
    padding: 15,
  },
  closeButton: {
    padding: 10,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  inventoryItem: {
    flex: 1,
    margin: 8,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  inventoryItemImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  inventoryItemDetails: {
    alignItems: 'center',
  },
  inventoryItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  inventoryItemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  inventoryColumnWrapper: {
    justifyContent: 'space-between',
  },
  inventoryContentContainer: {
    paddingBottom: 20,
  },
  statisticsContainer: {
    padding: 10,
  },
  statItem: {
    fontSize: 16,
    marginBottom: 5,
  },
  defaultImageButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  defaultImageButtonText: {
    color: '#333',
  },
  rankPointsContainer: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  rankPoints: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4a5568',
  },
});

export default ProfilePage;