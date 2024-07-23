import React, { useEffect, useState } from "react";
import { View, Platform, Alert, Image, StyleSheet, TouchableOpacity, Text, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../api/axios-instance";
import axios from "axios";

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
import { getCredentials } from "../util/logincache";
import { router } from "expo-router";
import HealthBar from "../components/healthbar";
import { getHealth, getisAlive, setHealth, updateisAlive } from "../api/health";
import CountdownTimer from "../components/countdown";
import { useCountdown } from "../util/Context/countdown";
import { playDeathSound } from "../util/sounds/deathsound";
import { RewardedAd, RewardedAdEventType, TestIds } from "react-native-google-mobile-ads";
import useFetchHealth from "../hooks/websockets/healthhook";

const adUnitId = Platform.OS === 'android' ? 'ca-app-pub-4035842398612787/2779084579' : 'ca-app-pub-4035842398612787/8310612855'

//const adUnitId =  __DEV__ ? TestIds.REWARDED : 'ca-app-pub-4035842398612787/8310612855';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['games', 'clothing'], //ads category
});

export default function Map() {
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);
  const [userNAME, setUsername] = useState("");
  const [isAlive, setisAlive] = useState(true);
  const [deathsoundPlayed, setdeathSoundPlayed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const health = useFetchHealth()//WS hook

  // Fetch username from secure storage
  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await getCredentials();
      if (credentials) {
        setUsername(credentials.username);
      } else {
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
          setisAlive(false); // Default to false if no status is found
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
    rewarded.show();
    const token = SecureStore.getItem("token");
  
    if (token === null) {
      console.error("Token is null, cannot proceed with setting items");
      return; // Stop execution if token is null
    }
  
    await AsyncStorage.setItem(`isAlive`, `true`);
    updateisAlive(token, true);
    await AsyncStorage.setItem('health', '100');
    setHealth(token, 100);
  };
  const { countdownIsActive, stopCountdown } = useCountdown();

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      {(isAlive) && (
        <>
        <MapComp selectedMapStyle={selectedMapStyle} />
        <HealthBar health={health} />
        {countdownIsActive && <CountdownTimer duration={30} onExpire={stopCountdown} />}
          {Platform.OS === 'android' && (
            <ThemeSelectButton onPress={showPopup}>Theme</ThemeSelectButton>
          )}
          <MapStylePopup
            visible={themePopupVisible}
            transparent={true}
            onClose={closePopup}
            onSelect={selectMapStyle}
          />     
            <FireSelector
              selectedMapStyle={selectedMapStyle}
              getStoredMapStyle={getStoredMapStyle}
              selectMapStyle={selectMapStyle}
            />
        </>
      )}
      {(!isAlive) && (
        <View style={styles.containerdeath}>
          <TouchableOpacity
            onPress={() => respawn()}
            style={styles.bannerdeath}
            activeOpacity={0.7}
          >
            <Image source={require('../assets/deathscreen.jpg')} style={styles.bannerdeath} />
          </TouchableOpacity>
          {/* Button added below the image */}
          <TouchableOpacity
            onPress={() => console.log('Retry button pressed')}
            style={styles.retryButton}
            activeOpacity={0.7} // Optional: adjust the opacity feedback on touch
          >
            <TouchableOpacity onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}>
              <Text style={styles.retryButtonText}>Contact Support</Text>
            </TouchableOpacity>

          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  containerdeath: {
    flex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerdeath: {
    width: 500,
    height: 500,
    resizeMode: 'contain',
  },
  retryButton: {
    backgroundColor: 'red', // Choose any color
    padding: 10,
    marginTop: 20, // Adds space between the image and the button
    borderRadius: 5, // Rounded corners
  },
  retryButtonText: {
    color: 'white', // Text color
    fontSize: 16, // Adjust text size as needed
    textAlign: 'center', // Center the text inside the button
  },
});