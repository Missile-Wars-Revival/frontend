import React, { useEffect, useState } from "react";
import { View, Platform, Alert, Image, StyleSheet, TouchableOpacity, Text, Linking, Dimensions, useColorScheme, Switch, Modal } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../api/axios-instance";
import axios from "axios";
import * as Location from 'expo-location';

// Android Themes
import { androidDefaultMapStyle } from "../map-themes/Android-themes/defaultMapStyle";
import { androidRadarMapStyle } from "../map-themes/Android-themes/radarMapStyle";
import { androidCherryBlossomMapStyle } from "../map-themes/Android-themes/cherryBlossomMapStyle";
import { androidCyberpunkMapStyle } from "../map-themes/Android-themes/cyberpunkstyle";
import { androidColorblindMapStyle } from "../map-themes/Android-themes/colourblindstyle";

// IOS Themes
import { IOSDefaultMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSRadarMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSCherryBlossomMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSCyberpunkMapStyle } from "../map-themes/IOS-themes/themestemp";
import { IOSColorblindMapStyle } from "../map-themes/IOS-themes/themestemp";

// Components
import { MapStylePopup } from "../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle } from "../util/mapstore";
import { ThemeSelectButton } from "../components/theme-select-button";
import { FireSelector } from "../components/fire-selector";
import { MapComp } from "../components/map-comp";
import { MapStyle } from "../types/types";
import { router } from "expo-router";
import HealthBar from "../components/healthbar";
import { getisAlive, setHealth, updateisAlive } from "../api/health";
import { playDeathSound } from "../util/sounds/deathsound";
import { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";
import useFetchHealth from "../hooks/websockets/healthhook";
import { getlocActive } from "../api/locActive";
import PlayerViewButton from "../components/PlayerViewButton";
import { MissileLibrary } from "../components/Missile/missile";
import MissileFiringAnimation from "../components/Animations/MissileFiring";

const adUnitId = Platform.select({
  ios: 'ca-app-pub-4035842398612787~7024601286',
  android: 'ca-app-pub-4035842398612787~8146111264',
  default: 'ca-app-pub-4035842398612787~8146111264',
});

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['games', 'clothing'], //ads category
});

const { width, height } = Dimensions.get('window');

export default function Map() {
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);
  const [userNAME, setUsername] = useState("");
  const [isAlive, setisAlive] = useState(true);
  const [deathsoundPlayed, setdeathSoundPlayed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const health = useFetchHealth()//WS hook
  const [locationPermission, setLocationPermission] = useState(false);
  const [locActive, setLocActive] = useState<boolean>(true);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [showMissileFiringAnimation, setShowMissileFiringAnimation] = useState(false);

  const colorScheme = useColorScheme();
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

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        let { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
        
        if (foregroundStatus !== 'granted') {
          Alert.alert(
            "Permission Denied",
            "Please allow location access to use the map features.",
            [
              { text: "OK", onPress: () => console.log("OK Pressed") },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          setLocationPermission(false);
          return;
        }

        if (Platform.OS === 'android' && parseInt(Platform.Version.toString(), 10) >= 29) {
          let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            console.log('Background location permission not granted');
            // Optionally, inform the user about limited functionality
          }
        }

        setLocationPermission(true);
      } catch (error) {
        console.error("Error requesting location permission:", error);
        setLocationPermission(false);
      }
    };

    requestLocationPermission();
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
          token, amount: 500
        });

        if (response.data) {
          console.log('Money added successfully:', response.data.message);
          Alert.alert("Claimed!", `You have clamed your daily reward! 500 Coins`);
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
            setdeathSoundPlayed(true); // Ensure the sound is played only once
          }

          setisAlive(isAliveStatus.isAlive);
        } else {
          setisAlive(true); // Default to true if no status is found
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();

    const intervalId = setInterval(initializeApp, 1000);

    return () => clearInterval(intervalId);
  }, [deathsoundPlayed]);
    
  useEffect(() => {
      const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setLoaded(true);
      });
      const unsubscribeEarned = rewarded.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        reward => {
          console.log('User earned reward of ', reward);
        },
      );
  
      // Start loading the rewarded ad straight away
      rewarded.load();
  
      // Unsubscribe from events on unmount
      return () => {
        unsubscribeLoaded();
        unsubscribeEarned();
      };
    }, []);

    useEffect(() => {
      // Fetch immediately on component mount
      fetchLocActiveStatus();
      // Set up interval to fetch every 30 seconds (adjust as needed)
      const intervalId = setInterval(fetchLocActiveStatus, 30000);
  
      // Clean up interval on component unmount
      return () => {
        clearInterval(intervalId);
      };
    }, []);
    
    const fetchLocActiveStatus = async () => {
      try {
        const status = await getlocActive();
        setLocActive(status);
      } catch (error) {
        console.error("Failed to fetch locActive status:", error);
      } finally {
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
  const respawn = async () => {
    const token = SecureStore.getItem("token");
  
    if (!token) {
      console.error("Token is null, cannot proceed with setting items");
      return; // Stop execution if token is null
    }
  
    await AsyncStorage.setItem(`isAlive`, `true`);
    updateisAlive(token, true);
    await AsyncStorage.setItem('health', '100');
    setHealth(token, 100);
    rewarded.show();
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
      {(isAlive && locationPermission) && (
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
      )}
      {(!isAlive) && (
        <View style={[styles.containerdeath, isDarkMode && styles.containerdeathDark]}>
          <TouchableOpacity
            onPress={() => respawn()}
            style={styles.bannerdeath}
            activeOpacity={0.7}
          >
            <Image source={require('../assets/deathscreen.jpg')} style={styles.bannerdeath} />
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
      {(isAlive && !locationPermission) && (
        <View style={[styles.container, isDarkMode && styles.containerDark]}>
          <Text style={[styles.permissionText, isDarkMode && styles.permissionTextDark]}>
            Location permission is required to use the map.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, isDarkMode && styles.permissionButtonDark]}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.permissionButtonText}>Open Settings</Text>
          </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  containerdeathDark: {
    backgroundColor: '#1E1E1E',
  },
  bannerdeath: {
    width: width * 0.9,
    height: height * 0.6,
    resizeMode: 'contain',
  },
  retryButton: {
    backgroundColor: 'red',
    padding: 10,
    marginTop: height * 0.02,
    borderRadius: 5,
    width: width * 0.5,
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
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionTextDark: {
    color: '#FFF',
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
  },
  permissionButtonDark: {
    backgroundColor: '#0A84FF',
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
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
});