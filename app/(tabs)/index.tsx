import React, { useEffect, useState } from "react";
import { View, Platform, Alert, StyleSheet, TouchableOpacity, Text, Linking, Dimensions, useColorScheme, Modal, ImageBackground } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../../api/axios-instance";
import axios from "axios";
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Android Themes
import { androidDefaultMapStyle } from "../../map-themes/Android-themes/defaultMapStyle";
import { androidRadarMapStyle } from "../../map-themes/Android-themes/radarMapStyle";
import { androidCherryBlossomMapStyle } from "../../map-themes/Android-themes/cherryBlossomMapStyle";
import { androidCyberpunkMapStyle } from "../../map-themes/Android-themes/cyberpunkstyle";
import { androidColorblindMapStyle } from "../../map-themes/Android-themes/colourblindstyle";

// IOS Themes
import { IOSDefaultMapStyle } from "../../map-themes/IOS-themes/themestemp";
import { IOSRadarMapStyle } from "../../map-themes/IOS-themes/themestemp";
import { IOSCherryBlossomMapStyle } from "../../map-themes/IOS-themes/themestemp";
import { IOSCyberpunkMapStyle } from "../../map-themes/IOS-themes/themestemp";
import { IOSColorblindMapStyle } from "../../map-themes/IOS-themes/themestemp";

// Components
import { MapStylePopup } from "../../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle } from "../../util/mapstore";
import { ThemeSelectButton } from "../../components/theme-select-button";
import { FireSelector } from "../../components/fire-selector";
import { MapComp } from "../../components/map-comp";
import { MapStyle } from "../../types/types";
import { router } from "expo-router";
import HealthBar from "../../components/healthbar";
import { getisAlive, setHealth, updateisAlive } from "../../api/health";
import { playDeathSound } from "../../util/sounds/deathsound";
import useFetchHealth from "../../hooks/websockets/healthhook";
import { getlocActive } from "../../api/locationOptions";
import PlayerViewButton from "../../components/PlayerViewButton";
import { MissileLibrary } from "../../components/Missile/missile";
import MissileFiringAnimation from "../../components/Animations/MissileFiring";
import { useOnboarding } from '../../util/Context/onboardingContext';

const { width, height } = Dimensions.get('window');

export default function Map() {
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);
  const [userNAME, setUsername] = useState("");
  const [isAlive, setIsAlive] = useState<boolean | null>(null);
  const [deathsoundPlayed, setdeathSoundPlayed] = useState(false);
  const health = useFetchHealth()//WS hook
  const [locActive, setLocActive] = useState<boolean>(true);
  const [locPermsActive, setLocPermsActive] = useState<boolean>(false);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [showMissileFiringAnimation, setShowMissileFiringAnimation] = useState(false);
  const [isAdFree, setIsAdFree] = useState(false);
  const colorScheme = useColorScheme();
  const { isOnboardingComplete, currentStep } = useOnboarding();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    const loadStoredMapStyle = async () => {
      const storedStyle = await getStoredMapStyle();
      if (storedStyle) {
        selectMapStyle(storedStyle);
      }
    };

    loadStoredMapStyle();
  }, []);

  // Fetch username from secure storage
  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await SecureStore.getItemAsync("username");
      if (credentials) {
        setUsername(credentials);
      } else {
        await AsyncStorage.setItem('signedIn', 'false');
        router.navigate("/login");
      }
    };

    fetchCredentials();
    checkAdFreeStatus();
  }, []);


  useEffect(() => {
    const addCurrencyAmount = async () => {
      const lastRewardedDate = await AsyncStorage.getItem('lastRewardedDate');
      const today = new Date().toISOString().slice(0, 10);

      if (lastRewardedDate === today) {
        //console.log('Daily reward already claimed');
        return;
      }

      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.log('Token not found');
        return;
      }

      try {
        const response = await axiosInstance.post('/api/addMoney', {
          token, amount: 1000
        });

        if (response.data) {
          console.log('Money added successfully:', response.data.message);
          Alert.alert("Claimed!", `You have clamed your daily reward! 1000 Coins`);
          await AsyncStorage.setItem('lastRewardedDate', today); // Update the last rewarded date
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.response?.data.message || error.message);
        } else {
          console.error('Error adding currency:', error);
        }
      }
    };

    addCurrencyAmount();
  }, []);

  useEffect(() => {
    const getisAliveeffect = async () => {
      const token = await SecureStore.getItemAsync("token");
      try {
        if (!token) {
          console.log('Token not found');
          return;
        }
        getisAlive(token)
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message);
        } else {
          console.error('Error fetching health:', error);
        }
      }
    };
    getisAliveeffect();

    const intervalId = setInterval(getisAliveeffect, 5000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const isAliveStatusString = await AsyncStorage.getItem('isAlive');
        if (isAliveStatusString) {
          const isAliveStatus = JSON.parse(isAliveStatusString);

          if (!isAliveStatus.isAlive && !deathsoundPlayed) {
            playDeathSound();
            setdeathSoundPlayed(true);
          }

          setIsAlive(isAliveStatus.isAlive);
        } else {
          setIsAlive(true); // Default to true if no status is found
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsAlive(true); // Default to true in case of error
      }
    };

    initializeApp();

    const intervalId = setInterval(initializeApp, 1000);

    return () => clearInterval(intervalId);
  }, [deathsoundPlayed]);

  const fetchLocActiveStatus = async () => {
    try {
      const status = await getlocActive();
      setLocActive(status);
    } catch (error) {
      console.error("Failed to fetch locActive status:", error);
    } finally {
    }
  };

  useEffect(() => {
    fetchLocActiveStatus();
    checkPermissions();
    const locActiveIntervalId = setInterval(fetchLocActiveStatus, 3000);
    const permsIntervalId = setInterval(checkPermissions, 6000);

    return () => {
      clearInterval(locActiveIntervalId);
      clearInterval(permsIntervalId);
    };
  }, []);

  const checkPermissions = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      setLocPermsActive(true);
    } else {
      setLocPermsActive(false);
    }
  };

  const checkAdFreeStatus = async () => {
    try {
      const storedAdFreeStatus = await AsyncStorage.getItem('isAdFree');
      if (storedAdFreeStatus !== null) {
        setIsAdFree(JSON.parse(storedAdFreeStatus));
      }
    } catch (error) {
      console.error('Error fetching ad-free status:', error);
    }
  };

  const showPopup = () => {
    setThemePopupVisible(true);
  };

  const closePopup = () => {
    setThemePopupVisible(false);
  };

  const selectMapStyle = (style: string) => {
    closePopup();
    let selectedStyle;
    switch (style) {
      case "default":
        selectedStyle = Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle;
        break;
      case "radar":
        selectedStyle = Platform.OS === 'android' ? androidRadarMapStyle : IOSRadarMapStyle;
        break;
      case "cherry":
        selectedStyle = Platform.OS === 'android' ? androidCherryBlossomMapStyle : IOSCherryBlossomMapStyle;
        break;
      case "cyber":
        selectedStyle = Platform.OS === 'android' ? androidCyberpunkMapStyle : IOSCyberpunkMapStyle;
        break;
      case "colourblind":
        selectedStyle = Platform.OS === 'android' ? androidColorblindMapStyle : IOSColorblindMapStyle;
        break;
      default:
        selectedStyle = Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle;
    }
    setSelectedMapStyle(selectedStyle);
    storeMapStyle(style);
  };

  const handleRespawn = async () => {
    const token = await SecureStore.getItemAsync("token");

    if (!token) {
      console.error("Token is null, cannot proceed with setting items");
      return;
    }

    await AsyncStorage.setItem(`isAlive`, `true`);
    updateisAlive(token, true);
    await AsyncStorage.setItem('health', '100');
    setHealth(token, 100);
    setIsAlive(true);
    setdeathSoundPlayed(false);
  };

  const respawn = async () => {
      handleRespawn();
  };

  const handleFireMissile = (username: string) => {
    setSelectedPlayer(username);
    setShowMissileLibrary(true);
  };

  const handleMissileFired = () => {
    setShowMissileLibrary(false);
    setShowMissileFiringAnimation(true);
  };

  const handleMissileAnimationComplete = () => {
    setShowMissileFiringAnimation(false);
    setSelectedPlayer("");
  };

  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      {isAlive === null ? (
        <View style={[styles.loadingContainer, isDarkMode && styles.loadingContainerDark]}>
          <Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Loading for the first time...</Text>
        </View>
      ) : isAlive ? (
        // Render the map and game UI when the user is alive
        <>
          <MapComp selectedMapStyle={selectedMapStyle} />
          <View style={styles.healthBarContainer}>
            <HealthBar health={health} />
          </View>
          {Platform.OS === 'android' && (
            <ThemeSelectButton onPress={selectMapStyle} showPopup={showPopup} />
          )}
          <MapStylePopup
            visible={themePopupVisible}
            transparent={true}
            onClose={closePopup}
            onSelect={selectMapStyle}
          />
          {locActive && (
            <View style={styles.fireSelectorContainer}>
              <FireSelector
                selectedMapStyle={selectedMapStyle}
                getStoredMapStyle={getStoredMapStyle}
                selectMapStyle={selectMapStyle}
              />
            </View>
          )}
          {locActive && (
            <View style={styles.switchContainer}>
              <PlayerViewButton onFireMissile={handleFireMissile} />
            </View>
          )}
        </>
      ) : (
        // Render the death screen when the user is not alive
        <View style={[styles.containerdeath, isDarkMode && styles.containerdeathDark]}>
          <TouchableOpacity
            onPress={() => respawn()}
            style={styles.bannerdeathContainer}
            activeOpacity={0.7}
          >
            <ImageBackground 
              source={require('../../assets/deathscreen.png')} 
              style={styles.bannerdeath}
              resizeMode="contain"
            >
              <View style={styles.deathTextContainer}>
                <Text style={styles.deathText}>You Died!!</Text>
              </View>
            </ImageBackground>
            <View style={styles.respawnTextContainer}>
              <Text style={[styles.respawnText, isDarkMode && styles.respawnTextDark]}>
                Tap here to respawn
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}
            style={[styles.retryButton, isDarkMode && styles.retryButtonDark]}
            activeOpacity={0.7}
          >
            <Text style={[styles.retryButtonText, isDarkMode && styles.retryButtonTextDark]}>Contact Support</Text>
          </TouchableOpacity>
        </View>
      )}
      {(isAlive && !locActive || !locPermsActive) && (
        <View style={[
          styles.permissionContainer, 
          isDarkMode && styles.permissionContainerDark,
          styles.fullScreenOverlay // Add this new style
        ]}>
          <Ionicons name="location-outline" size={80} color={isDarkMode ? "#FFF" : "#007AFF"} />
          <Text style={[styles.permissionTitle, isDarkMode && styles.permissionTitleDark]}>
            Location Access Required
          </Text>
          <Text style={[styles.permissionText, isDarkMode && styles.permissionTextDark]}>
            To enjoy the full game experience, we need access to your location. This allows us to show your position on the map and enable exciting gameplay features.
          </Text>
          <Text style={[styles.permissionSubText, isDarkMode && styles.permissionSubTextDark]}>
            Please enable location services for this app in your device settings.
          </Text>
          {(!locActive &&
          <TouchableOpacity
            style={[styles.permissionButton, isDarkMode && styles.permissionButtonDark]}
            onPress={() => router.navigate('/settings')}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          )}
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMissileLibrary}
        onRequestClose={() => setShowMissileLibrary(false)}
      >
        <View style={[styles.missileLibraryContainer, isDarkMode && styles.missileLibraryContainerDark]}>
          <View style={[styles.missileLibraryHeader, isDarkMode && styles.missileLibraryHeaderDark]}>
            <Text style={[styles.missileLibraryTitle, isDarkMode && styles.missileLibraryTitleDark]}>Missile Library</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => setShowMissileLibrary(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
          <MissileLibrary
            playerName={selectedPlayer}
            onMissileFired={handleMissileFired}
            onClose={() => setShowMissileLibrary(false)}
          />
        </View>
      </Modal>

      {showMissileFiringAnimation && (
        <View style={styles.animationOverlay}>
          <MissileFiringAnimation onAnimationComplete={handleMissileAnimationComplete} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  healthBarContainer: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    width: width * 0.9,
  },
  themeButton: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.05,
  },
  fireSelectorContainer: {
    position: 'absolute',
    bottom: height * 0.0001,
    left: width * 0.000001,
  },
  containerdeath: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
  },
  containerdeathDark: {
    backgroundColor: '#1E1E1E',
  },
  bannerdeathContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',  // Add this
  },
  bannerdeath: {
    width: width * 0.9,
    height: height * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, 
  },
  respawnTextContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 10,
  },
  respawnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
  respawnTextDark: {
    color: '#FFF',
  },
  topAdContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 100,
  },
  bottomAdContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40
  },
  retryButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
    width: width * 0.5,
    marginTop: 10,
    marginBottom: 10, // Add some space below the button
  },
  retryButtonDark: {
    backgroundColor: '#FF4136',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  retryButtonTextDark: {
    color: '#FFF',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    padding: 20,
  },
  permissionContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionTitleDark: {
    color: '#FFF',
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionTextDark: {
    color: '#CCC',
  },
  permissionSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  permissionSubTextDark: {
    color: '#AAA',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  permissionButtonDark: {
    backgroundColor: '#0A84FF',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  switchContainer: {
    position: 'absolute',
    top: height * 0.15,
    right: width * 0.05,
    flexDirection: 'column',
    alignItems: 'center',
  },
  missileLibraryContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 60,
  },
  missileLibraryContainerDark: {
    backgroundColor: '#1E1E1E',
    paddingTop: 60,
  },
  missileLibraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f7fafc',
  },
  missileLibraryHeaderDark: {
    backgroundColor: '#2C2C2C',
  },
  missileLibraryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  missileLibraryTitleDark: {
    color: '#FFF',
  },
  doneButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50, // Adjust based on your banner ad size
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissAdButton: {
    position: 'absolute',
    right: 5,
    top: 5,
    zIndex: 1,
  },
  rewardedAdButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
  },
  rewardedAdButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingContainerDark: {
    backgroundColor: '#1E1E1E',
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
  },
  loadingTextDark: {
    color: '#FFFFFF',
  },
  deathTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deathText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    textShadowColor: 'black',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 3,
  },
});
