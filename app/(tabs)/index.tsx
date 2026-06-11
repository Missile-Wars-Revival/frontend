import React, { useEffect, useState, useCallback } from "react";
import { View, Platform, Alert, StyleSheet, Pressable, Text, Linking, Dimensions, useColorScheme, Modal, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import axiosInstance from "../../api/axios-instance";
import { isAxiosError } from "axios";
import Ionicons from '@react-native-vector-icons/ionicons';
import * as Location from 'expo-location';

// Android Themes
import { androidDefaultMapStyle } from "../../map-themes/Android-themes/defaultMapStyle";
import { androidRadarMapStyle } from "../../map-themes/Android-themes/radarMapStyle";
import { androidCherryBlossomMapStyle } from "../../map-themes/Android-themes/cherryBlossomMapStyle";
import { androidCyberpunkMapStyle } from "../../map-themes/Android-themes/cyberpunkstyle";
import { androidColorblindMapStyle } from "../../map-themes/Android-themes/colourblindstyle";

// IOS Themes
import { IOSCherryBlossomMapStyle, IOSColorblindMapStyle, IOSCyberpunkMapStyle, IOSDefaultMapStyle, IOSRadarMapStyle } from "../../map-themes/IOS-themes/themestemp";

// Components
import { MapStylePopup } from "../../components/map-style-popup";
import { getStoredMapStyle, storeMapStyle } from "../../util/mapstore";
import { ThemeSelectButton } from "../../components/theme-select-button";
import { FireSelector } from "../../components/fire-selector";
import { MapComp } from "../../components/map-comp";
import { MapStyle } from "../../types/types";
import { router } from "expo-router";
import { useAuth } from "../../util/Context/authcontext";
import HealthBar from "../../components/healthbar";
import { getisAlive, setHealth, updateisAlive } from "../../api/health";
import { playDeathSound } from "../../util/sounds/deathsound";
import useFetchHealth from "../../hooks/websockets/healthhook";
import { getlocActive } from "../../api/locationOptions";
import PlayerViewButton from "../../components/PlayerViewButton";
import { MissileLibrary } from "../../components/Missile/missile";
import MissileFiringAnimation from "../../components/Animations/MissileFiring";
import { getPalette, Gradients, Spacing, Radius, Type, cardShadow, type ThemePalette } from '../../components/ui/theme';
import { PressableScale } from '../../components/ui/PressableScale';
import { AnimatedEntrance } from '../../components/ui/AnimatedEntrance';

const { width, height } = Dimensions.get('window');
const DEV_OFFLINE_TOKEN = "dev-offline-token";

export default function Map() {
  const { signOut } = useAuth();
  const [selectedMapStyle, setSelectedMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [themePopupVisible, setThemePopupVisible] = useState(false);
  const [isAlive, setIsAlive] = useState<boolean | null>(null);
  const [deathsoundPlayed, setdeathSoundPlayed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const health = useFetchHealth()//WS hook
  const [locActive, setLocActive] = useState<boolean>(true);
  const [locPermsActive, setLocPermsActive] = useState<boolean>(false);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [showMissileFiringAnimation, setShowMissileFiringAnimation] = useState(false);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getStyles(palette, isDarkMode);
  const insets = useSafeAreaInsets();

  const showPopup = useCallback(() => {
    setThemePopupVisible(true);
  }, []);

  const closePopup = useCallback(() => {
    setThemePopupVisible(false);
  }, []);

  const selectMapStyle = useCallback((style: string) => {
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
  }, [closePopup]);

  useEffect(() => {
    const loadStoredMapStyle = async () => {
      const storedStyle = await getStoredMapStyle();
      if (storedStyle) {
        selectMapStyle(storedStyle);
      }
    };

    loadStoredMapStyle();
  }, [selectMapStyle]);

  // Fetch username from secure storage
  useEffect(() => {
    const fetchCredentials = async () => {
      const credentials = await SecureStore.getItemAsync("username");
      if (!credentials) {
        await signOut();
        router.navigate("/login");
      } else {
        setIsLoggedIn(true);
      }
    };

    fetchCredentials();
  }, [signOut]);


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

      if (token === DEV_OFFLINE_TOKEN) {
        await AsyncStorage.setItem('lastRewardedDate', today);
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
        if (isAxiosError(error)) {
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
        if (isAxiosError(error)) {
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
    if (!isLoggedIn) return;

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
  }, [deathsoundPlayed, isLoggedIn]);

  useEffect(() => {
    const fetchLocActiveStatus = async () => {
      const status = await getlocActive().catch((error) => {
        console.error("Failed to fetch locActive status:", error);
        return undefined;
      });
      if (status !== undefined) {
        setLocActive(status);
      }
    };

    const checkPermissions = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocPermsActive(true);
      } else {
        setLocPermsActive(false);
      }
    };

    fetchLocActiveStatus();
    checkPermissions();
    const locActiveIntervalId = setInterval(fetchLocActiveStatus, 3000);
    const permsIntervalId = setInterval(checkPermissions, 6000);

    return () => {
      clearInterval(locActiveIntervalId);
      clearInterval(permsIntervalId);
    };
  }, []);

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

  if (!isLoggedIn) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {isAlive === null ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Preparing the battlefield...</Text>
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
            <View style={[styles.fireSelectorContainer, { bottom: insets.bottom + 40 }]}>
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
        <View style={styles.deathScreen}>
          <AnimatedEntrance offsetY={24} fromScale={0.96} style={styles.deathCard}>
            <Image
              source={require('../../assets/deathscreen.png')}
              style={styles.deathImage}
              contentFit="contain"
            />
            <Text style={styles.deathTitle}>You Died</Text>
            <Text style={styles.deathSubtitle}>
              Your position was eliminated. Respawn to rejoin the battle.
            </Text>
            <PressableScale haptic="tap" onPress={() => respawn()} style={styles.respawnButtonWrap}>
              <LinearGradient colors={Gradients.fire} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.respawnButton}>
                <Ionicons name="refresh" size={20} color="#FFFFFF" />
                <Text style={styles.respawnButtonText}>Respawn</Text>
              </LinearGradient>
            </PressableScale>
            <PressableScale
              haptic="select"
              onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}
              style={styles.supportButton}
            >
              <Ionicons name="help-buoy-outline" size={16} color={palette.textMuted} />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </PressableScale>
          </AnimatedEntrance>
        </View>
      )}
      {(isAlive && !locActive || !locPermsActive) && (
        <View style={[styles.permissionContainer, styles.fullScreenOverlay]}>
          <AnimatedEntrance offsetY={24} fromScale={0.96} style={styles.permissionCard}>
            <View style={styles.permissionIconWrap}>
              <Ionicons name="location" size={40} color={palette.accent} />
            </View>
            <Text style={styles.permissionTitle}>Location Access Required</Text>
            <Text style={styles.permissionText}>
              To enjoy the full game experience, we need access to your location. This allows us to show your position on the map and enable exciting gameplay features.
            </Text>
            <Text style={styles.permissionSubText}>
              Please enable location services for this app in your device settings.
            </Text>
            {(!locActive &&
            <PressableScale haptic="tap" onPress={() => router.navigate('/settings')} style={styles.permissionButtonWrap}>
              <LinearGradient colors={Gradients.brand} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.permissionButton}>
                <Ionicons name="settings-outline" size={18} color="#FFFFFF" />
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </LinearGradient>
            </PressableScale>
            )}
          </AnimatedEntrance>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showMissileLibrary}
        onRequestClose={() => setShowMissileLibrary(false)}
      >
        <View style={styles.missileLibraryContainer}>
          <View style={styles.missileLibraryHeader}>
            <Text style={styles.missileLibraryTitle}>Missile Library</Text>
            <Pressable
              style={styles.doneButton}
              onPress={() => setShowMissileLibrary(false)}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
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

const getStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  healthBarContainer: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.05,
    width: width * 0.9,
  },
  fireSelectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  fullScreenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  deathScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.bg,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 110 : 95,
  },
  deathCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: Spacing.xl,
    ...cardShadow(isDark),
  },
  deathImage: {
    width: width * 0.6,
    height: width * 0.45,
    marginBottom: Spacing.md,
  },
  deathTitle: {
    ...Type.display,
    color: palette.danger,
  },
  deathSubtitle: {
    ...Type.body,
    color: palette.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  respawnButtonWrap: {
    width: '100%',
  },
  respawnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
  },
  respawnButtonText: {
    ...Type.button,
    color: '#FFFFFF',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  supportButtonText: {
    ...Type.caption,
    color: palette.textMuted,
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.bg,
    padding: Spacing.xl,
  },
  permissionCard: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    padding: Spacing.xl,
    ...cardShadow(isDark),
  },
  permissionIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  permissionTitle: {
    ...Type.title,
    color: palette.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  permissionText: {
    ...Type.body,
    color: palette.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  permissionSubText: {
    ...Type.caption,
    fontWeight: '400',
    color: palette.textFaint,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  permissionButtonWrap: {
    width: '100%',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
  },
  permissionButtonText: {
    ...Type.button,
    color: '#FFFFFF',
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
    backgroundColor: palette.bg,
    paddingTop: 60,
  },
  missileLibraryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: palette.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  missileLibraryTitle: {
    ...Type.title,
    color: palette.text,
  },
  doneButton: {
    backgroundColor: palette.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
  },
  doneButtonText: {
    ...Type.caption,
    color: '#FFFFFF',
  },
  animationOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: palette.bg,
  },
  loadingText: {
    ...Type.body,
    color: palette.textMuted,
  },
});
