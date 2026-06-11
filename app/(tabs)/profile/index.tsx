import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, Switch, Modal, ScrollView, FlatList, Alert, Dimensions, Pressable, AlertButton, Linking, TextInput, useColorScheme } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from "expo-secure-store";
import Ionicons from '@react-native-vector-icons/ionicons';
import MaterialCommunityIcons from '@react-native-vector-icons/material-design-icons';
import * as ImagePicker from 'expo-image-picker';
import useFetchInventory from '../../../hooks/websockets/inventoryhook';
import { getselfprofile } from '../../../api/getprofile';
import { Statistics } from './user-profile';
import firebase from '../../../util/firebase/config';
import useFetchFriends from '../../../hooks/websockets/friendshook';
import { Avatar } from '../../../components/ui/Avatar';
import { editUser } from '../../../api/editUser';
import * as Clipboard from 'expo-clipboard';
import { getImages } from '../../../api/store';
import AnimatedEntrance from '../../../components/ui/AnimatedEntrance';
import PressableScale from '../../../components/ui/PressableScale';
import haptics from '../../../components/ui/haptics';
import { getPalette, Gradients, Radius, Spacing, cardShadow } from '../../../components/ui/theme';

const { width } = Dimensions.get('window');

interface SelfProfile {
  username: string;
  email: string;
  rankpoints: number;
  profileImageUrl: string | null;
  mutualFriends: { username: string; profileImageUrl: string | null }[];
  statistics: Statistics;
}

export interface ApiResponse {
  success: boolean;
  userProfile: SelfProfile;
  message?: string;
}

const badgeImages: { [key: string]: any } = {
  Founder: require('../../../assets/icons/founder.png'),
  Staff: require('../../../assets/icons/staff.png'),
  Early: require('../../../assets/icons/earlysupporter.png'),
  Bronze: require('../../../assets/leagues/bronze.png'),
  Silver: require('../../../assets/leagues/silver.png'),
  Gold: require('../../../assets/leagues/gold.png'),
  Diamond: require('../../../assets/leagues/diamond.png'),
  Legend: require('../../../assets/leagues/legend.png'),
};

const STAT_META: { key: keyof Statistics; label: string; icon: any; colors: readonly [string, string] }[] = [
  { key: 'numKills', label: 'Kills', icon: 'flame', colors: Gradients.fire },
  { key: 'numDeaths', label: 'Deaths', icon: 'skull', colors: ['#94A3B8', '#475569'] },
  { key: 'numMissilesPlaced', label: 'Missiles', icon: 'rocket', colors: ['#6D5BF8', '#9B5BF0'] },
  { key: 'numLandminesPlaced', label: 'Landmines', icon: 'warning', colors: Gradients.gold },
  { key: 'numLootPlaced', label: 'Loot Placed', icon: 'cube', colors: ['#38BDF8', '#0EA5E9'] },
  { key: 'numLootPickups', label: 'Loot Pickups', icon: 'gift', colors: Gradients.success },
];

const ProfilePage: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);

  const [modalVisible, setModalVisible] = useState(false);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const friends = useFetchFriends(); //WS
  const inventory = useFetchInventory();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rankPoints, setRankPoints] = useState<number | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [isDebugMenuVisible, setIsDebugMenuVisible] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [newUsername, setNewUsername] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [newMoney, setNewMoney] = useState<string>('');
  const [newRankPoints, setNewRankPoints] = useState<string>('');
  const [newHealth, setNewHealth] = useState<string>('');
  const [newIsAlive, setNewIsAlive] = useState<boolean>(true);
  const [isLocationActive, setIsLocationActive] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../../assets/logo.png'));

  useEffect(() => {
    const fetchUsername = async () => {
      const name = await SecureStore.getItemAsync("username");
      const token = await SecureStore.getItemAsync("token");
      const cachedFirebaseToken = await SecureStore.getItemAsync("firebaseUID");
      const cachedNotificationToken = await AsyncStorage.getItem('notificaitonToken');
      setUsername(name);
      setToken(token);
      setFirebaseToken(cachedFirebaseToken);
      setNotificationToken(cachedNotificationToken);
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => item.quantity > 0);
  }, [inventory]);

  const openSettings = () => {
    haptics.select();
    router.navigate("/profile/settings");
  };

  const navigateToLeagues = () => {
    haptics.select();
    router.navigate("/league");
  };

  const uploadImageToFirebase = async (uri: string) => {
    const name = await SecureStore.getItemAsync("username");
    const response = await fetch(uri);
    const blob = await response.blob();
    const ref = firebase.storage().ref().child(`profileImages/${name}`);
    await ref.put(blob);
    const url = await ref.getDownloadURL();
    setUserImageUrl(url); // reflect the freshly uploaded image immediately
    return url;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Sorry, we need camera roll permissions to make this work. Please enable it in your phone's settings.", [{ text: "OK" }]);
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const firstAsset = result.assets[0];
      if (firstAsset && firstAsset.uri) {
        await uploadImageToFirebase(firstAsset.uri);
        haptics.success();
      }
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "Sorry, we need camera permissions to make this work. Please enable it in your phone's settings.", [{ text: "OK" }]);
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const firstAsset = result.assets[0];
      if (firstAsset && firstAsset.uri) {
        await uploadImageToFirebase(firstAsset.uri);
        haptics.success();
      }
    }
  };

  const setdefaultasimage = async () => {
    setUserImageUrl(null);
    try {
      await firebase.storage().ref(`profileImages/${username}`).delete();
    } catch (error) {
      console.error('Error deleting image from Firebase:', error);
    }
  };

  const removePhoto = () => {
    Alert.alert("Remove Profile Photo", "Are you sure you want to remove your profile photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", onPress: () => setdefaultasimage() },
    ]);
  };

  const openImagePicker = async () => {
    haptics.tap();
    const requestPermission = async (permissionType: 'camera' | 'mediaLibrary') => {
      let permission;
      if (permissionType === 'camera') {
        permission = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }
      return permission.status === 'granted';
    };

    const handleCameraOption = async () => {
      const hasPermission = await requestPermission('camera');
      if (hasPermission) {
        takePhoto();
      } else {
        Alert.alert("Permission Required", "Camera access is required to take a photo. Please grant permission in Settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]);
      }
    };

    const handleLibraryOption = async () => {
      const hasPermission = await requestPermission('mediaLibrary');
      if (hasPermission) {
        pickImage();
      } else {
        Alert.alert("Permission Required", "Photo library access is required to choose a photo. Please grant permission in Settings.", [
          { text: "Cancel", style: "cancel" },
          { text: "Open Settings", onPress: () => Linking.openSettings() }
        ]);
      }
    };

    const options: AlertButton[] = [
      { text: "Take Photo", onPress: handleCameraOption },
      { text: "Choose from Library", onPress: handleLibraryOption },
      { text: "Remove Photo", onPress: removePhoto },
      { text: "Cancel", style: "cancel" }
    ];

    Alert.alert("Change Profile Photo", "Choose an option", options);
  };

  const navigateToUserProfile = (username: string) => {
    haptics.select();
    router.navigate({ pathname: "/profile/user-profile", params: { username } });
  };

  useEffect(() => {
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
        setUserImageUrl(response.userProfile.profileImageUrl);
      } else if (response.message !== "Not signed in") {
        console.error('Failed to fetch user statistics: Invalid response structure');
      }
    } catch (error) {
      console.error('Failed to fetch user statistics', error);
    }
  };

  const renderBadge = (badge: string) => {
    const badgeKey = Object.keys(badgeImages).find(key => badge.toLowerCase().includes(key.toLowerCase()));
    if (badgeKey) {
      return (
        <PressableScale key={badge} haptic="select" style={styles.badge} onPress={() => setSelectedBadge(badge)}>
          <Image source={badgeImages[badgeKey]} style={styles.badgeImage} />
        </PressableScale>
      );
    }
    return null;
  };

  const handleEditUser = async (updates: any) => {
    try {
      await editUser(selectedUsername, updates);
      Alert.alert('Success', 'User updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const truncateToken = (token: string | null) => {
    if (!token) return 'No token';
    if (token.length <= 20) return token;
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
  };

  const handleDeleteAccount = () => {
    Alert.alert("Delete Account", "Are you sure you want to delete this account? This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          handleEditUser({ deleteAccount: true });
          Alert.alert("Account Deleted", "The account has been successfully deleted.");
        }
      }
    ]);
  };

  const renderDebugMenu = () => (
    <ScrollView style={[styles.debugMenu, { backgroundColor: c.surface }]}>
      <Text style={[styles.debugMenuTitle, { color: c.text }]}>Debug Menu</Text>
      <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="Enter username to edit" value={selectedUsername} onChangeText={setSelectedUsername} placeholderTextColor={c.textFaint} />
      <View style={styles.debugMenuSection}>
        <Text style={[styles.debugMenuSectionTitle, { color: c.text }]}>User Details</Text>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New username" value={newUsername} onChangeText={setNewUsername} placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ username: newUsername })}>
          <Text style={styles.debugMenuButtonText}>Edit Username</Text>
        </PressableScale>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ password: newPassword })}>
          <Text style={styles.debugMenuButtonText}>Edit Password</Text>
        </PressableScale>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New email" value={newEmail} onChangeText={setNewEmail} placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ email: newEmail })}>
          <Text style={styles.debugMenuButtonText}>Edit Email</Text>
        </PressableScale>
      </View>
      <View style={styles.debugMenuSection}>
        <Text style={[styles.debugMenuSectionTitle, { color: c.text }]}>Game Stats</Text>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New money amount" value={newMoney} onChangeText={setNewMoney} keyboardType="numeric" placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ money: parseInt(newMoney) })}>
          <Text style={styles.debugMenuButtonText}>Edit Money</Text>
        </PressableScale>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New rank points" value={newRankPoints} onChangeText={setNewRankPoints} keyboardType="numeric" placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ rankPoints: parseInt(newRankPoints) })}>
          <Text style={styles.debugMenuButtonText}>Edit Rank Points</Text>
        </PressableScale>
        <TextInput style={[styles.debugMenuInput, { backgroundColor: c.surfaceAlt, color: c.text }]} placeholder="New health" value={newHealth} onChangeText={setNewHealth} keyboardType="numeric" placeholderTextColor={c.textFaint} />
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ health: parseInt(newHealth) })}>
          <Text style={styles.debugMenuButtonText}>Edit Health</Text>
        </PressableScale>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: c.text }]}>Is Alive:</Text>
          <Switch value={newIsAlive} onValueChange={setNewIsAlive} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={newIsAlive ? "#f5dd4b" : "#f4f3f4"} />
        </View>
        <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ isAlive: newIsAlive })}>
          <Text style={styles.debugMenuButtonText}>Edit Is Alive</Text>
        </PressableScale>
      </View>
      <View style={styles.debugMenuSection}>
        <Text style={[styles.debugMenuSectionTitle, { color: c.text }]}>Location Settings</Text>
        <View style={styles.switchContainer}>
          <Text style={[styles.switchLabel, { color: c.text }]}>Location Active:</Text>
          <Switch value={isLocationActive} onValueChange={setIsLocationActive} trackColor={{ false: "#767577", true: "#81b0ff" }} thumbColor={isLocationActive ? "#f5dd4b" : "#f4f3f4"} />
          <PressableScale haptic="tap" style={styles.debugMenuButton} onPress={() => handleEditUser({ isLocationActive: isLocationActive })}>
            <Text style={styles.debugMenuButtonText}>Edit Is Loc Active</Text>
          </PressableScale>
        </View>
      </View>

      <View style={styles.debugMenuSection}>
        <Text style={[styles.debugMenuSectionTitle, { color: c.text }]}>Cached Data</Text>
        {[
          { label: 'Cached Token:', value: token },
          { label: 'Cached Notification Token:', value: notificationToken },
          { label: 'Cached Firebase Auth Token:', value: firebaseToken },
        ].map((row) => (
          <View key={row.label} style={styles.cachedDataItem}>
            <Text style={[styles.cachedDataLabel, { color: c.text }]}>{row.label}</Text>
            <View style={styles.tokenContainer}>
              <Text style={[styles.cachedDataValue, { color: c.textMuted }]}>{truncateToken(row.value)}</Text>
              <PressableScale haptic="select" style={styles.copyButton} onPress={() => row.value && copyToClipboard(row.value)}>
                <Text style={styles.copyButtonText}>{isCopied ? 'Copied!' : 'Copy'}</Text>
              </PressableScale>
            </View>
          </View>
        ))}
        <View style={styles.cachedDataItem}>
          <Text style={[styles.cachedDataLabel, { color: c.text }]}>Cached Username:</Text>
          <Text style={[styles.cachedDataValue, { color: c.textMuted }]}>{username}</Text>
        </View>
      </View>

      <View style={styles.debugMenuSection}>
        <Text style={[styles.debugMenuSectionTitle, { color: c.text }]}>Danger Zone</Text>
        <PressableScale haptic="heavy" style={[styles.debugMenuButton, styles.deleteAccountButton]} onPress={handleDeleteAccount}>
          <Text style={styles.debugMenuButtonText}>Delete Account</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );

  const league = statistics?.league;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero header */}
        <LinearGradient
          colors={isDarkMode ? ['#2A1F52', '#15172B'] : Gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroTopRow}>
            <Text style={styles.heroHeading}>Profile</Text>
            <View style={styles.heroActions}>
              <PressableScale haptic="select" style={styles.heroIconBtn} onPress={navigateToLeagues}>
                <MaterialCommunityIcons name="trophy" size={22} color="#fff" />
              </PressableScale>
              <PressableScale haptic="select" style={styles.heroIconBtn} onPress={openSettings}>
                <Ionicons name="settings-sharp" size={20} color="#fff" />
              </PressableScale>
            </View>
          </View>

          <AnimatedEntrance fromScale={0.9} style={styles.heroBody}>
            <PressableScale haptic="tap" onPress={openImagePicker} style={styles.avatarWrap}>
              <Avatar
                uri={userImageUrl}
                style={styles.avatar}
                transition={250}
              />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </PressableScale>
            <Text style={styles.heroName} numberOfLines={1}>{username}</Text>
            {!!email && <Text style={styles.heroEmail} numberOfLines={1}>{email}</Text>}

            <View style={styles.pillRow}>
              <View style={styles.pill}>
                <Ionicons name="medal" size={14} color="#FFD56B" />
                <Text style={styles.pillText}>
                  {rankPoints !== null ? rankPoints : '—'} RP
                </Text>
              </View>
              {!!league && (
                <View style={styles.pill}>
                  <Ionicons name="ribbon" size={14} color="#fff" />
                  <Text style={styles.pillText}>{league}</Text>
                </View>
              )}
            </View>
          </AnimatedEntrance>
        </LinearGradient>

        {/* Badges */}
        <AnimatedEntrance index={0} style={[styles.card, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>Badges</Text>
          <View style={styles.badgesList}>
            {statistics && statistics.badges && statistics.badges.length > 0 ? (
              statistics.badges.map(renderBadge)
            ) : (
              <Text style={[styles.muted, { color: c.textMuted }]}>No badges yet</Text>
            )}
          </View>
        </AnimatedEntrance>

        {/* Statistics grid */}
        <AnimatedEntrance index={1} style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: c.text }]}>Statistics</Text>
          {statistics ? (
            <View style={styles.statsGrid}>
              {STAT_META.map((s) => (
                <View key={s.key} style={[styles.statCard, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
                  <LinearGradient colors={s.colors} style={styles.statIcon}>
                    <Ionicons name={s.icon} size={18} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.statValue, { color: c.text }]}>{statistics[s.key] as number}</Text>
                  <Text style={[styles.statLabel, { color: c.textMuted }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>Loading statistics...</Text>
          )}
        </AnimatedEntrance>

        {/* Inventory */}
        <AnimatedEntrance index={2} style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: c.text }]}>Inventory</Text>
            {filteredInventory.length > 0 && (
              <PressableScale haptic="select" onPress={() => setModalVisible(true)}>
                <Text style={[styles.seeAll, { color: c.accent }]}>See all</Text>
              </PressableScale>
            )}
          </View>
          {filteredInventory.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContent}>
              {filteredInventory.map(item => (
                <PressableScale key={item.id} haptic="select" onPress={() => setModalVisible(true)} style={[styles.sliderItem, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
                  <Image source={getImageForProduct(item.name)} style={styles.itemImage} cachePolicy="memory-disk" />
                  <Text style={[styles.itemName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.itemQty, { color: c.accent }]}>x{item.quantity}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>Your inventory is empty.</Text>
          )}
        </AnimatedEntrance>

        {/* Friends */}
        <AnimatedEntrance index={3} style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionHeading, { color: c.text }]}>Friends</Text>
            <PressableScale haptic="select" onPress={() => router.navigate('/friends')}>
              <Text style={[styles.seeAll, { color: c.accent }]}>View all</Text>
            </PressableScale>
          </View>
          {friends.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderContent}>
              {friends.map((friend, index) => (
                <PressableScale key={index} haptic="select" style={styles.friendItem} onPress={() => navigateToUserProfile(friend.username)}>
                  <Avatar
                    uri={friend.profileImageUrl}
                    style={[styles.friendImage, { borderColor: c.surface }]}
                  />
                  <Text style={[styles.friendName, { color: c.textMuted }]} numberOfLines={1}>{friend.username}</Text>
                </PressableScale>
              ))}
            </ScrollView>
          ) : (
            <Text style={[styles.muted, { color: c.textMuted }]}>No friends yet.</Text>
          )}
        </AnimatedEntrance>

        {statistics && statistics.badges.includes('Debug') && (
          <PressableScale haptic="select" onPress={() => setIsDebugMenuVisible(!isDebugMenuVisible)}>
            <Text style={[styles.debugMenuToggle, { color: c.accent }]}>
              {isDebugMenuVisible ? 'Hide' : 'Show'} Debug Menu
            </Text>
          </PressableScale>
        )}
        {isDebugMenuVisible && renderDebugMenu()}
      </ScrollView>

      {/* Inventory modal */}
      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalSafeArea, { backgroundColor: c.bg }]}>
          <LinearGradient colors={isDarkMode ? ['#2A1F52', '#15172B'] : Gradients.brand} style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Your Inventory</Text>
            <PressableScale haptic="select" style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </PressableScale>
          </LinearGradient>
          <View style={styles.fullModalView}>
            {filteredInventory.length > 0 ? (
              <FlatList
                data={filteredInventory}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                  <AnimatedEntrance index={index} style={[styles.inventoryItem, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
                    <Image source={getImageForProduct(item.name)} style={styles.inventoryItemImage} cachePolicy="memory-disk" />
                    <Text style={[styles.inventoryItemName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.inventoryItemQty, { color: c.textMuted }]}>Quantity: {item.quantity}</Text>
                  </AnimatedEntrance>
                )}
                numColumns={2}
                columnWrapperStyle={styles.inventoryColumnWrapper}
                contentContainerStyle={styles.inventoryContentContainer}
              />
            ) : (
              <Text style={[styles.muted, { color: c.textMuted }]}>Your inventory is empty.</Text>
            )}
          </View>
        </View>
      </Modal>

      {/* Badge detail modal */}
      <Modal visible={!!selectedBadge} transparent animationType="fade" onRequestClose={() => setSelectedBadge(null)}>
        <Pressable onPress={() => setSelectedBadge(null)}>
          <View style={styles.modalOverlay}>
            <AnimatedEntrance fromScale={0.9} style={[styles.badgeModal, { backgroundColor: c.surface }]}>
              {(() => {
                const key = selectedBadge && Object.keys(badgeImages).find(k => selectedBadge.toLowerCase().includes(k.toLowerCase()));
                return key ? <Image source={badgeImages[key]} style={styles.badgeModalImage} /> : null;
              })()}
              <Text style={[styles.badgeModalText, { color: c.text }]}>{selectedBadge}</Text>
            </AnimatedEntrance>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const CARD_GAP = Spacing.md;
const STAT_CARD_WIDTH = (width - Spacing.lg * 2 - CARD_GAP * 2) / 3;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxl * 2 },
  hero: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroHeading: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroActions: { flexDirection: 'row', gap: Spacing.sm },
  heroIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBody: { alignItems: 'center', marginTop: Spacing.lg },
  avatarWrap: { position: 'relative' },
  avatar: { width: 108, height: 108, borderRadius: 54, borderWidth: 3, borderColor: 'rgba(255,255,255,0.6)' },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5B5BF0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: Spacing.md },
  heroEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 2 },
  pillRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  card: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  sectionWrap: { marginTop: Spacing.xl, paddingHorizontal: Spacing.lg },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md },
  sectionHeading: { fontSize: 19, fontWeight: '800' },
  seeAll: { fontSize: 14, fontWeight: '700' },
  muted: { fontSize: 14, textAlign: 'left' },
  badgesList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  badge: { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  badgeImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },
  statCard: {
    width: STAT_CARD_WIDTH,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  statIcon: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  sliderContent: { gap: Spacing.md, paddingVertical: Spacing.xs, paddingRight: Spacing.lg },
  sliderItem: { width: 100, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center' },
  itemImage: { width: 56, height: 56, borderRadius: 12, marginBottom: Spacing.sm },
  itemName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  itemQty: { fontSize: 13, fontWeight: '800', marginTop: 2 },
  friendItem: { width: 76, alignItems: 'center' },
  friendImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 2 },
  friendName: { fontSize: 12, marginTop: 6, textAlign: 'center' },
  debugMenuToggle: { padding: Spacing.lg, fontSize: 15, fontWeight: '700', textAlign: 'center' },
  // Modals
  modalSafeArea: { flex: 1 },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalHeaderTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullModalView: { flex: 1, padding: Spacing.lg },
  inventoryItem: { flex: 1, margin: Spacing.sm, padding: Spacing.lg, borderRadius: Radius.md, alignItems: 'center' },
  inventoryItemImage: { width: 80, height: 80, resizeMode: 'contain', marginBottom: Spacing.md },
  inventoryItemName: { fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  inventoryItemQty: { fontSize: 13 },
  inventoryColumnWrapper: { justifyContent: 'space-between' },
  inventoryContentContainer: { paddingBottom: Spacing.xl },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: Spacing.xl },
  badgeModal: { borderRadius: Radius.lg, padding: Spacing.xl, alignItems: 'center' },
  badgeModalImage: { width: 80, height: 80, resizeMode: 'contain', marginBottom: Spacing.md },
  badgeModalText: { fontSize: 18, fontWeight: '700' },
  // Debug menu
  debugMenu: { padding: Spacing.lg, borderRadius: Radius.md, margin: Spacing.lg, maxHeight: 800 },
  debugMenuTitle: { fontSize: 22, fontWeight: '800', marginBottom: Spacing.lg, textAlign: 'center' },
  debugMenuSection: { marginBottom: Spacing.lg },
  debugMenuSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md },
  debugMenuInput: { padding: 12, borderRadius: Radius.sm, marginBottom: Spacing.md, fontSize: 16 },
  debugMenuButton: { backgroundColor: '#5B5BF0', padding: 12, borderRadius: Radius.sm, alignItems: 'center', marginBottom: Spacing.md },
  debugMenuButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  deleteAccountButton: { backgroundColor: '#E11D48' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  switchLabel: { fontSize: 16 },
  cachedDataItem: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: Spacing.md },
  cachedDataLabel: { fontSize: 15, fontWeight: '700', marginBottom: 5 },
  cachedDataValue: { fontSize: 14 },
  tokenContainer: { flexDirection: 'row', alignItems: 'center' },
  copyButton: { backgroundColor: '#5B5BF0', padding: 6, borderRadius: 4, marginLeft: Spacing.md },
  copyButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});

export default ProfilePage;
