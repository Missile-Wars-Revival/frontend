import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Image, StyleSheet, useColorScheme, Dimensions, ActivityIndicator, Animated, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAndCacheImage } from "../util/imagecache";
import * as SecureStore from 'expo-secure-store';
import { addFriend } from "../api/friends";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getlocActive } from "../api/locationOptions";
import useFetchFriends from '../hooks/websockets/friendshook'; 
import useFetchPlayerlocations from '../hooks/websockets/playerlochook';
import { isInactiveFor12Hours, getTimeDifference, convertimestampfuturemissile } from '../util/get-time-difference';
import { useRouter } from "expo-router";
import useFetchMissiles from '../hooks/websockets/missilehook';
import { Missile } from "middle-earth";
import MapView, { Marker } from 'react-native-maps';
import { MapStyle } from '../types/types';
import { androidCherryBlossomMapStyle } from '../map-themes/Android-themes/cherryBlossomMapStyle';
import { androidColorblindMapStyle } from '../map-themes/Android-themes/colourblindstyle';
import { androidCyberpunkMapStyle } from '../map-themes/Android-themes/cyberpunkstyle';
import { androidDefaultMapStyle } from '../map-themes/Android-themes/defaultMapStyle';
import { androidRadarMapStyle } from '../map-themes/Android-themes/radarMapStyle';
import { IOSDefaultMapStyle, IOSRadarMapStyle, IOSCherryBlossomMapStyle, IOSCyberpunkMapStyle, IOSColorblindMapStyle } from '../map-themes/IOS-themes/themestemp';
import FriendAddedAnimation from "../components/Animations/FriendAddedAnimation";
import { itemimages } from '../app/profile';

interface Player {
  username: string;
  profileImageUrl: string;
  isFriend: boolean;
  updatedAt: string;
}

interface PlayerViewButtonProps {
  onFireMissile: (username: string) => void;
}

const { width, height } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');

const PlayerViewButton: React.FC<PlayerViewButtonProps> = ({ onFireMissile }) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [locActive, setLocActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'players' | 'missiles'>('players');
  const [selectedMissile, setSelectedMissile] = useState<Missile | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const otherPlayersData = useFetchPlayerlocations();
  const friends = useFetchFriends();
  const missiles = useFetchMissiles();
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (modalVisible && isInitialLoad) {
      setIsLoading(true);
      processPlayerData().finally(() => {
        setIsLoading(false);
        setIsInitialLoad(false);
      });
    } else if (modalVisible) {
      processPlayerData();
    }
  }, [modalVisible, otherPlayersData, friends]);

  useEffect(() => {
    if (!modalVisible) {
      setIsInitialLoad(true);
    }
  }, [modalVisible]);

  useEffect(() => {
    const fetchUsername = async () => {
      const name = await SecureStore.getItemAsync("username");
      if (name) {
        setCurrentUsername(name);
      }
    };
    fetchUsername();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isAliveStatusString = await AsyncStorage.getItem('isAlive');
        if (isAliveStatusString) {
          const isAliveStatus = JSON.parse(isAliveStatusString);
          setIsAlive(isAliveStatus.isAlive);
        } else {
          setIsAlive(true); // Default to true if no status is found
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const loadStoredMapStyle = async () => {
      try {
        const storedStyle = await AsyncStorage.getItem('selectedMapStyle');
        if (storedStyle) {
          console.log('Stored style:', storedStyle);
          
          // Check if the stored value is a simple string (like "default")
          if (['default', 'radar', 'cherry', 'cyber', 'colourblind'].includes(storedStyle)) {
            // Convert the string to the corresponding map style
            switch (storedStyle) {
              case 'default':
                setCurrentMapStyle(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
                break;
              case 'radar':
                setCurrentMapStyle(Platform.OS === 'android' ? androidRadarMapStyle : IOSRadarMapStyle);
                break;
              case 'cherry':
                setCurrentMapStyle(Platform.OS === 'android' ? androidCherryBlossomMapStyle : IOSCherryBlossomMapStyle);
                break;
              case 'cyber':
                setCurrentMapStyle(Platform.OS === 'android' ? androidCyberpunkMapStyle : IOSCyberpunkMapStyle);
                break;
              case 'colourblind':
                setCurrentMapStyle(Platform.OS === 'android' ? androidColorblindMapStyle : IOSColorblindMapStyle);
                break;
            }
          } else {
            // If it's not a simple string, try to parse it as JSON
            const parsedStyle = JSON.parse(storedStyle) as MapStyle[];
            setCurrentMapStyle(parsedStyle);
          }
        }
      } catch (error) {
        console.error('Error loading stored map style:', error);
        // Fallback to default style
        setCurrentMapStyle(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
      }
    };

    loadStoredMapStyle();
  }, []);

  const processPlayerData = async () => {
    try {
      const currentUserUsername = await SecureStore.getItemAsync("username");
      
      if (currentUserUsername === null) {
        console.error("No username found in secure storage.");
        return;
      }

      // Create a Map to remove duplicates and filter out inactive players
      const uniquePlayers = new Map();
      otherPlayersData
        .filter(player => !isInactiveFor12Hours(player.updatedAt))
        .forEach(player => {
          if (player.username !== currentUserUsername) {
            uniquePlayers.set(player.username, player);
          }
        });

      const playersWithImages = await Promise.all(
        Array.from(uniquePlayers.values()).map(async (player) => ({
          ...player,
          profileImageUrl: await fetchAndCacheImage(player.username),
          isFriend: friends.some(friend => friend.username === player.username)
        }))
      );
      
      setPlayers(playersWithImages);
    } catch (error) {
      console.error("Failed to process player data:", error);
    }
  };

  const handleAddFriend = async (friendUsername: string) => {
    const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found')
        return; 
      }
      const result = await addFriend(token, friendUsername);
      if (result.message === "Friend added successfully") {
        // Update the players state to reflect the new friend status
        setPlayers(prevPlayers => 
          prevPlayers.map(player =>
            player.username === friendUsername ? { ...player, isFriend: true } : player
          )
        );
        setShowAnimation(true); // Trigger the animation
      } else {
        Alert.alert("Error", result.message || "Failed to add friend.");
      }
    } catch (error) {
      console.warn('Error adding friend:', error);
      Alert.alert("This player is already your friend!");
    }
  };

  const fireMissile = (username: string) => {
    onFireMissile(username);
    setModalVisible(false);
  };

  const navigateToUserProfile = (username: string) => {
    setModalVisible(false);
    router.navigate({
      pathname: "/user-profile",
      params: { username }
    });
  };

  const switchTab = (tab: 'players' | 'missiles') => {
    if (activeTab !== tab) {
      setIsLoading(true);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setActiveTab(tab);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setIsLoading(false));
      });
    }
  };

  const renderPlayerItem = ({ item }: { item: Player }) => {
    const { text } = getTimeDifference(item.updatedAt);
    return (
      <TouchableOpacity 
        style={[styles.playerItem, isDarkMode && styles.playerItemDark]}
        onPress={() => navigateToUserProfile(item.username)}
      >
        <Image source={{ uri: item.profileImageUrl }} style={styles.playerImage} />
        <View style={styles.playerInfo}>
          <Text style={[styles.playerName, isDarkMode && styles.playerNameDark]} numberOfLines={1} ellipsizeMode="tail">
            {item.username}
          </Text>
          <Text style={[styles.playerStatus, isDarkMode && styles.playerStatusDark]}>
            {item.isFriend ? 'ALLY' : 'UNKNOWN'} • {text}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          {isAlive && locActive && (
            <TouchableOpacity
              style={[styles.actionButton, styles.fireButton]}
              onPress={(e) => {
                e.stopPropagation();
                fireMissile(item.username);
              }}
            >
              <Text style={styles.actionButtonText}>ENGAGE</Text>
            </TouchableOpacity>
          )}
          {!item.isFriend && (
            <TouchableOpacity
              style={[styles.actionButton, styles.addButton]}
              onPress={(e) => {
                e.stopPropagation();
                handleAddFriend(item.username);
              }}
            >
              <Text style={styles.actionButtonText}>RECRUIT</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMissileItem = ({ item }: { item: Missile }) => (
    <TouchableOpacity 
      style={[styles.playerItem, isDarkMode && styles.playerItemDark]}
      onPress={() => setSelectedMissile(item)}
    >
      <Image 
        source={itemimages[item.type] || require('../assets/logo.png')} 
        style={styles.missileImage} 
      />
      <View style={styles.playerInfo}>
        <Text style={[styles.playerName, isDarkMode && styles.playerNameDark]} numberOfLines={1} ellipsizeMode="tail">
          {item.type}
        </Text>
        <Text style={[styles.playerStatus, isDarkMode && styles.playerStatusDark]}>
          Status: {item.status} • ETA: {convertimestampfuturemissile(item.etatimetoimpact).text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderMissileList = () => {
    const myMissiles = missiles.filter(missile => missile.sentbyusername === currentUsername);
    const otherMissiles = missiles.filter(missile => missile.sentbyusername !== currentUsername);

    return (
      <>
        <FlatList
          data={[
            ...myMissiles,
            { type: 'separator', id: 'separator' },
            ...otherMissiles
          ]}
          renderItem={({ item }) => {
            if (item.type === 'separator') {
              return (
                <View style={[styles.separatorContainer, isDarkMode && styles.separatorContainerDark]}>
                  <Text style={[styles.separatorText, isDarkMode && styles.separatorTextDark]}>
                    ---- All Missiles ----
                  </Text>
                </View>
              );
            }
            return renderMissileItem({ item: item as Missile });
          }}
          keyExtractor={(item, index) => 
            item.type === 'separator' ? 'separator' : `${item.type}-${index}`
          }
          extraData={missiles}
        />
      </>
    );
  };

  const renderMissileDetails = () => {
    if (!selectedMissile) return null;

    return (
      <View style={[styles.missileDetails, isDarkMode && styles.missileDetailsDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setSelectedMissile(null)}
        >
          <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>← Back</Text>
        </TouchableOpacity>
        <Image 
          source={itemimages[selectedMissile.type] || require('../assets/logo.png')} 
          style={styles.missileDetailImage} 
        />
        <Text style={[styles.missileDetailTitle, isDarkMode && styles.missileDetailTitleDark]}>{selectedMissile.type}</Text>
        <View style={styles.missileInfoContainer}>
          <View style={styles.missileInfoItem}>
            <Text style={styles.missileInfoLabel}>Status</Text>
            <Text style={[styles.missileInfoValue, isDarkMode && styles.missileInfoValueDark]}>{selectedMissile.status}</Text>
          </View>
          <View style={styles.missileInfoItem}>
            <Text style={styles.missileInfoLabel}>ETA</Text>
            <Text style={[styles.missileInfoValue, isDarkMode && styles.missileInfoValueDark]}>
              {convertimestampfuturemissile(selectedMissile.etatimetoimpact).text}
            </Text>
          </View>
        </View>
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            showsUserLocation={true}
            showsMyLocationButton={true}
            pitchEnabled={true}
            rotateEnabled={true}
            scrollEnabled={true}
            zoomEnabled={true}
            initialRegion={{
              latitude: selectedMissile.destination.latitude,
              longitude: selectedMissile.destination.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            customMapStyle={currentMapStyle}
          >
            <Marker
              coordinate={{
                latitude: selectedMissile.destination.latitude,
                longitude: selectedMissile.destination.longitude,
              }}
            />
          </MapView>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.playerViewButton,
          isDarkMode && styles.playerViewButtonDark,
          styles.responsiveButton
        ]}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="clipboard-outline" size={24} color={isDarkMode ? '#FFFFFF' : '#000000'} />
      </TouchableOpacity>

      <Modal
        animationType="slide" 
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'players' && styles.activeTabButton]}
                onPress={() => switchTab('players')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'players' && styles.activeTabButtonText]}>PLAYERS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'missiles' && styles.activeTabButton]}
                onPress={() => switchTab('missiles')}
              >
                <Text style={[styles.tabButtonText, activeTab === 'missiles' && styles.activeTabButtonText]}>MY MISSILES</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.closeButtonText, isDarkMode && styles.closeButtonTextDark]}>X</Text>
              </TouchableOpacity>
            </View>
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
              {isLoading ? (
                <ActivityIndicator size="large" color={isDarkMode ? '#FFFFFF' : '#000000'} />
              ) : activeTab === 'players' ? (
                <FlatList
                  data={players}
                  renderItem={renderPlayerItem}
                  keyExtractor={(item) => item.username}
                  extraData={[friends, otherPlayersData]}
                />
              ) : selectedMissile ? (
                renderMissileDetails()
              ) : (
                renderMissileList()
              )}
            </Animated.View>
          </View>
          
          {showAnimation && (
            <View style={styles.animationOverlay}>
              <FriendAddedAnimation
                onAnimationComplete={() => {
                  setShowAnimation(false);
                  Alert.alert("Success", "Friend added successfully!");
                }}
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  playerViewButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  playerViewButtonDark: {
    backgroundColor: '#2C2C2C',
  },
  responsiveButton: {
    width: Platform.OS === 'ios' ? Math.min(screenWidth * 0.13, 60) : Math.min(screenWidth * 0.13, 70),
    height: Platform.OS === 'ios' ? Math.min(screenWidth * 0.13, 60) : Math.min(screenWidth * 0.13, 70),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#4a5568',
    overflow: 'hidden',
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#2C2C2C',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#4a5568',
  },
  modalHeaderDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButtonTextDark: {
    color: '#FFFFFF',
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4a5568',
  },
  playerItemDark: {
    borderBottomColor: '#2C2C2C',
  },
  playerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#4a5568',
  },
  playerInfo: {
    flex: 1,
    marginRight: 10,
  },
  playerName: {
    fontSize: 16,
    color: '#000000', // Black for light mode
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  playerNameDark: {
    color: '#FFFFFF', // White for dark mode
  },
  playerStatus: {
    fontSize: 14,
    color: '#4a5568',
    fontFamily: 'monospace',
  },
  playerStatusDark: {
    color: '#808080',
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    minWidth: 80,
  },
  fireButton: {
    backgroundColor: '#e53e3e',
  },
  addButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  tabButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
  },
  tabButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  missileImage: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  missileDetails: {
    padding: 20,
    alignItems: 'center',
  },
  missileDetailsDark: {
    backgroundColor: '#1E1E1E',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4a5568',
  },
  backButtonTextDark: {
    color: '#B0B0B0',
  },
  missileDetailImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  missileDetailTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', // Changed from '#FFFFFF' to a darker color
    marginBottom: 15,
  },
  missileDetailTitleDark: {
    color: '#FFFFFF', // Keep white for dark mode
  },
  missileInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  missileInfoItem: {
    alignItems: 'center',
  },
  missileInfoLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  missileInfoValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  missileInfoValueDark: {
    color: '#B0B0B0',
  },
  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    height: height * 0.6, // Set a fixed height for the content area
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  separatorContainer: {
    padding: 10,
    alignItems: 'center', // Center the text horizontally
    backgroundColor: 'transparent', // Make the container transparent
  },
  separatorContainerDark: {
    // Remove the background color for dark mode
  },
  separatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4a5568',
  },
  separatorTextDark: {
    color: '#B0B0B0',
  },
});

export default PlayerViewButton;