import React, { useEffect, useState } from "react";
import { View, Platform, Alert, Image, StyleSheet, TouchableOpacity, Text, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../api/axios-instance";
import axios from "axios";
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';

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

const adUnitId =  __DEV__ ? TestIds.REWARDED : 'ca-app-pub-9160450369509545/6677957247';

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['fashion', 'clothing'],
});

export default function Map() {
  const [userNAME, setUsername] = useState("");
  const [isAlive, setisAlive] = useState(true);


  // State for location enabled
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(true);
  const [health, setHealthUI] = useState(100); // Initial health value

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
    const getHealthOnStart = async () => {
      const token = await SecureStore.getItemAsync("token");
      try {
        if (!token) {
          console.log('Token not found');
          return;
        }
        getisAlive(token)
        const response = await getHealth(token);
        if (response && response.health !== undefined) {
          setHealthUI(response.health);
          await AsyncStorage.setItem('health', response.health.toString()); // Note the change here
        } else {
          console.error('Health data is invalid:', response);
        }
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Axios error:', error.message);
        } else {
          console.error('Error fetching health:', error);
        }
      }
    };
    getHealthOnStart();

    const intervalId = setInterval(getHealthOnStart, 5000); //5 secss -- NEED CHANGE TO WEBSOCKET
    return () => clearInterval(intervalId);
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
          const isAliveStatus = JSON.parse(isAliveStatusString); // Parse the JSON string into an object

          if (isAliveStatus.isAlive) {
            setisAlive(true);
          } else {
            setisAlive(false);
          }
        } else {
          setisAlive(false);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp()

    const intervalId = setInterval(initializeApp, 1000);

    return () => {
      clearInterval(intervalId);
    };
  },
    []);


  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);

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

  const [loaded, setLoaded] = useState(false);

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

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 1 }}>
        {/* Add in advert button here */}
        {/* {(!isAlive) && (
            <View style={mapstyles.overlay}>
              <Text style={mapstyles.overlayText}>Map is disabled due to your death</Text>
              <Text style={mapstyles.overlaySubText}>Please check wait the designated time or watch an advert!</Text>
            </View>
          )} */}
      </View>
      {(isAlive) && (
        <><MapComp selectedMapStyle={selectedMapStyle} /><HealthBar health={health} />
          {Platform.OS === 'android' && (
            <ThemeSelectButton onPress={showPopup}>Theme</ThemeSelectButton>
          )}
          <MapStylePopup
            visible={themePopupVisible}
            transparent={true}
            onClose={closePopup}
            onSelect={selectMapStyle}
          />
          {isLocationEnabled && (
            <FireSelector
              selectedMapStyle={selectedMapStyle}
              getStoredMapStyle={getStoredMapStyle}
              selectMapStyle={selectMapStyle}
            />
          )}
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