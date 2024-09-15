import React, { useEffect, useState, useMemo } from 'react';
import { SafeAreaView, StyleSheet, Text, View, TouchableOpacity, Switch, Modal, ScrollView, FlatList, Alert, Image, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { router } from 'expo-router';
import { clearCredentials } from '../util/logincache';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as SecureStore from "expo-secure-store";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useFetchInventory from '../hooks/websockets/inventoryhook';
import { getselfprofile } from '../api/getprofile';
import { Statistics } from './user-profile';
import firebase from '../util/firebase/config';
import { fetchAndCacheImage } from '../util/imagecache';
import { useAuth } from '../util/Context/authcontext';
import useFetchFriends from '../hooks/websockets/friendshook';
import { useColorScheme } from 'react-native';

const DEFAULT_IMAGE = require('../assets/mapassets/Female_Avatar_PNG.png');

interface ItemImages {
  [key: string]: any;
}

const { width } = Dimensions.get('window');

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
  Shield: require('../assets/mapassets/shield.png'),
  UltraShield: require('../assets/mapassets/shield.png'),

  // Add other missile images here
};

interface SelfProfile {
  username: string;
  email: string;
  rankpoints: number;
  mutualFriends: string[];
  statistics: Statistics;
}

export interface ApiResponse {
  success: boolean;
  userProfile: SelfProfile;
}

interface Friend {
  username: string;
  profileImageUrl: string;
}

// Add this near the top of the file, after other imports
const badgeImages: { [key: string]: any } = {
  Founder: require('../assets/icons/founder.png'),
  Staff: require('../assets/icons/staff.png'),

  //leagues
  Bronze: require('../assets/leagues/bronze.png'),
  Silver: require('../assets/leagues/silver.png'),
  Gold: require('../assets/leagues/gold.png'),
  Diamond: require('../assets/leagues/diamond.png'),
  Legend: require('../assets/leagues/legend.png'),
};

const ProfilePage: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const friends = useFetchFriends() //WS
  const inventory = useFetchInventory();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [friendImages, setFriendImages] = useState<{ [key: string]: string }>({});
  const [rankPoints, setRankPoints] = useState<number | null>(null);
  const { setIsSignedIn } = useAuth();
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);

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
    router.navigate("/login");
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
    router.navigate("/settings");
  };

  const navigateToLeagues = () => {
    router.navigate("/league");
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

  const navigateToUserProfile = (username: string) => {
    router.navigate({
      pathname: "/user-profile",
      params: { username }
    });
  };

  useEffect(() => {
    loadProfileImage();
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
        await SecureStore.setItem("email", response.userProfile.email);

        setRankPoints(response.userProfile.rankpoints);
      } else {
        console.error('Failed to fetch user statistics: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user statistics', error);
    }
  };

  useEffect(() => {
    const loadFriendImages = async () => {
      const imagePromises = friends.map(async (friend) => {
        const imageUrl = await fetchAndCacheImage(friend.username);
        return { [friend.username]: imageUrl };
      });
      const imageResults = await Promise.all(imagePromises);
      const newFriendImages = Object.assign({}, ...imageResults);
      setFriendImages(newFriendImages);
    };

    if (friends.length > 0) {
      loadFriendImages();
    }
  }, [friends]);

  const renderBadge = (badge: string) => {
    const badgeKey = Object.keys(badgeImages).find(key => badge.toLowerCase().includes(key.toLowerCase()));
    if (badgeKey) {
      return (
        <TouchableOpacity 
          key={badge} 
          style={styles.badge}
          onPress={() => setSelectedBadge(badge)}
        >
          <Image 
            source={badgeImages[badgeKey]} 
            style={styles.badgeImage} 
          />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.header, isDarkMode && styles.headerDark]}>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Profile</Text>
        <View style={styles.headerButtons}>
          {/* Leagues: */}
          {/* <TouchableOpacity style={styles.headerButton} onPress={navigateToLeagues}>
            <MaterialCommunityIcons name="trophy" size={24} color={isDarkMode ? "white" : "white"} />
          </TouchableOpacity> */}
          <TouchableOpacity style={styles.headerButton} onPress={openSettings}>
            <Ionicons name="settings" size={24} color={isDarkMode ? "white" : "white"} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.profileContainer, isDarkMode && styles.profileContainerDark]}>
          <TouchableOpacity onPress={openImagePicker}>
            <Image
              source={{ uri: userImageUrl || Image.resolveAssetSource(DEFAULT_IMAGE).uri }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
          <Text style={[styles.profileName, isDarkMode && styles.profileNameDark]}>{username}</Text>
          <Text style={[styles.profileDetails, isDarkMode && styles.profileDetailsDark]}>Email: {email}</Text>
          
          <View style={styles.rankPointsContainer}>
            <Text style={[styles.rankPoints, isDarkMode && styles.rankPointsDark]}>
              🏅 {rankPoints !== null ? rankPoints : 'Loading...'} Rank Points
              {statistics && statistics.league && (
                <Text style={[styles.leagueText, isDarkMode && styles.leagueTextDark]}> • {statistics.league}</Text>
              )}
            </Text>
          </View>
          
          <View style={styles.badgesContainer}>
            <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Badges</Text>
            <View style={styles.badgesList}>
              {statistics && statistics.badges && statistics.badges.length > 0 ? (
                statistics.badges.map(renderBadge)
              ) : (
                <Text style={[styles.emptyInventoryText, isDarkMode && styles.emptyInventoryTextDark]}>No badges yet</Text>
              )}
            </View>
          </View>

          <View style={styles.settingContainer}>
            <Text style={[styles.settingText, isDarkMode && styles.settingTextDark]}>
              {useBackgroundLocation ? 'Background Location Access is enabled.' : 'Foreground Location Access'}
            </Text>
            <Switch onValueChange={toggleSwitch} value={useBackgroundLocation} />
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.sectionContainerDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Statistics</Text>
          {statistics ? (
            <View style={styles.statisticsContainer}>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Deaths: {statistics.numDeaths}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Missiles Fired: {statistics.numMissilesPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Landmines Placed: {statistics.numLandminesPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Loot Placed: {statistics.numLootPlaced}</Text>
              <Text style={[styles.statItem, isDarkMode && styles.statItemDark]}>Loot Pickups: {statistics.numLootPickups}</Text>
            </View>
          ) : (
            <Text style={[styles.emptyInventoryText, isDarkMode && styles.emptyInventoryTextDark]}>Loading statistics...</Text>
          )}
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.sectionContainerDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Inventory</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slider}>
            {filteredInventory.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setModalVisible(true)} style={styles.sliderItem}>
                <Image
                  source={itemimages[item.name]}
                  style={styles.itemImage}
                />
                <Text style={[styles.itemName, isDarkMode && styles.itemNameDark]}>{item.name}</Text>
                <Text style={[styles.itemQuantity, isDarkMode && styles.itemQuantityDark]}>x{item.quantity}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.sectionContainer, isDarkMode && styles.sectionContainerDark]}>
          <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>Friends</Text>
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
                <Text style={[styles.friendName, isDarkMode && styles.friendNameDark]}>{friend.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <SafeAreaView style={[styles.modalSafeArea, isDarkMode && styles.modalSafeAreaDark]}>
          <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
            <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Your Inventory</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={[styles.closeButtonText, isDarkMode && styles.closeButtonTextDark]}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.fullModalView}>
            {filteredInventory.length > 0 ? (
              <FlatList
                data={filteredInventory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.inventoryItem, isDarkMode && styles.inventoryItemDark]}>
                    <Image
                      source={itemimages[item.name]}
                      style={styles.inventoryItemImage}
                    />
                    <View style={styles.inventoryItemDetails}>
                      <Text style={[styles.inventoryItemName, isDarkMode && styles.inventoryItemNameDark]}>{item.name}</Text>
                      <Text style={[styles.inventoryItemQuantity, isDarkMode && styles.inventoryItemQuantityDark]}>Quantity: {item.quantity}</Text>
                    </View>
                  </View>
                )}
                numColumns={2}
                columnWrapperStyle={styles.inventoryColumnWrapper}
                contentContainerStyle={styles.inventoryContentContainer}
              />
            ) : (
              <Text style={[styles.emptyInventoryText, isDarkMode && styles.emptyInventoryTextDark]}>Your inventory is empty.</Text>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={!!selectedBadge}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedBadge(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>{selectedBadge}</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 10,
    marginLeft: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    overflow: 'hidden',
  },
  badgeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
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
  leagueText: {
    fontSize: 16,
    color: '#718096',
  },

  // Dark mode styles
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
  },
  headerTextDark: {
    color: '#FFF',
  },
  profileContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  profileNameDark: {
    color: '#FFF',
  },
  profileDetailsDark: {
    color: '#B0B0B0',
  },
  settingTextDark: {
    color: '#FFF',
  },
  sectionContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  sectionTitleDark: {
    color: '#FFF',
  },
  itemNameDark: {
    color: '#FFF',
  },
  itemQuantityDark: {
    color: '#B0B0B0',
  },
  friendNameDark: {
    color: '#FFF',
  },
  modalSafeAreaDark: {
    backgroundColor: '#1E1E1E',
  },
  modalHeaderDark: {
    backgroundColor: '#2C2C2C',
    borderBottomColor: '#3D3D3D',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  closeButtonTextDark: {
    color: '#4CAF50',
  },
  inventoryItemDark: {
    backgroundColor: '#2C2C2C',
  },
  inventoryItemNameDark: {
    color: '#FFF',
  },
  inventoryItemQuantityDark: {
    color: '#B0B0B0',
  },
  statItemDark: {
    color: '#FFF',
  },
  emptyInventoryTextDark: {
    color: '#B0B0B0',
  },
  rankPointsDark: {
    color: '#4CAF50',
  },
  leagueTextDark: {
    color: '#B0B0B0',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalText: {
    fontSize: 18,
    color: '#333',
  },
  modalTextDark: {
    color: '#FFF',
  },
});

export default ProfilePage;