import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet, useColorScheme, Dimensions, ActivityIndicator, Animated, Alert, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { fetchAndCacheImage } from "../util/imagecache";
import * as SecureStore from 'expo-secure-store';
import { addFriend } from "../api/friends";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { getImages } from '../api/store';
import { useOnboarding } from '../util/Context/onboardingContext';
import { getPalette, Gradients, Spacing, Radius, Type, cardShadow, chipShadow, type ThemePalette } from './ui/theme';
import { SegmentedControl } from './ui/SegmentedControl';
import { PressableScale } from './ui/PressableScale';
import { AnimatedEntrance } from './ui/AnimatedEntrance';
import { haptics } from './ui/haptics';

interface Player {
  username: string;
  profileImageUrl: string;
  isFriend: boolean;
  updatedAt: string;
}

interface PlayerViewButtonProps {
  onFireMissile: (username: string) => void;
}

const { height } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');

const PlayerViewButton: React.FC<PlayerViewButtonProps> = ({ onFireMissile }) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const palette = getPalette(isDarkMode);
  const styles = getStyles(palette, isDarkMode);
  const [isAlive, setIsAlive] = useState<boolean>(true);
  const [locActive] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'players' | 'missiles'>('players');
  const [selectedMissile, setSelectedMissile] = useState<Missile | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const otherPlayersData = useFetchPlayerlocations();
  const friends = useFetchFriends();
  const missiles = useFetchMissiles();
  const [isLoading, setIsLoading] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(1));
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const mapRef = useRef<MapView>(null);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle[]>(Platform.OS === 'android' ? androidDefaultMapStyle : IOSDefaultMapStyle);
  const [showAnimation, setShowAnimation] = useState(false);
  const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../assets/logo.png'));
  const { currentStep, moveToNextStep } = useOnboarding();

  useEffect(() => {
    const loadImages = async () => {
      const imageGetter = await getImages();
      setGetImageForProduct(() => imageGetter);
    };
    loadImages();
  }, []);

  useEffect(() => {
    if (!modalVisible) return;

    let cancelled = false;
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

        if (!cancelled) {
          setPlayers(playersWithImages);
        }
      } catch (error) {
        console.error("Failed to process player data:", error);
      } finally {
        // The initial-open spinner is driven by `isInitialLoad`; it clears
        // once the first load resolves.
        if (!cancelled) {
          setIsInitialLoad(false);
        }
      }
    };

    processPlayerData();
    return () => {
      cancelled = true;
    };
  }, [modalVisible, otherPlayersData, friends]);

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

  const closeModal = () => {
    setModalVisible(false);
    // Reset so the next open shows the spinner until fresh data arrives.
    setIsInitialLoad(true);
  };

  const fireMissile = (username: string) => {
    onFireMissile(username);
    closeModal();
  };

  const navigateToUserProfile = (username: string) => {
    closeModal();
    router.navigate({
      pathname: "/profile/user-profile",
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
        setSelectedMissile(null);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start(() => setIsLoading(false));
      });
    }
  };

  const renderPlayerItem = ({ item, index }: { item: Player; index: number }) => {
    const { text } = getTimeDifference(item.updatedAt);
    return (
      <AnimatedEntrance index={index} stagger={30}>
        <PressableScale
          haptic="select"
          style={styles.playerRow}
          onPress={() => navigateToUserProfile(item.username)}
        >
          <Image source={{ uri: item.profileImageUrl }} style={styles.playerImage} />
          <View style={styles.playerInfo}>
            <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
              {item.username}
            </Text>
            <View style={styles.playerMetaRow}>
              <View style={[styles.statusPill, item.isFriend ? styles.statusPillAlly : styles.statusPillUnknown]}>
                <Text style={[styles.statusPillText, item.isFriend ? styles.statusPillTextAlly : styles.statusPillTextUnknown]}>
                  {item.isFriend ? 'ALLY' : 'UNKNOWN'}
                </Text>
              </View>
              <Text style={styles.playerStatus}>{text}</Text>
            </View>
          </View>
          <View style={styles.actionButtons}>
            {isAlive && locActive && (
              <PressableScale
                haptic="tap"
                onPress={() => {
                  fireMissile(item.username);
                  if (currentStep === 'fireplayermenu') {
                    moveToNextStep();
                  }
                }}
              >
                <LinearGradient colors={Gradients.fire} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                  <Ionicons name="rocket" size={13} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Engage</Text>
                </LinearGradient>
              </PressableScale>
            )}
            {!item.isFriend && (
              <PressableScale
                haptic="tap"
                onPress={() => {
                  handleAddFriend(item.username);
                }}
              >
                <LinearGradient colors={Gradients.success} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionButton}>
                  <Ionicons name="person-add" size={13} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Recruit</Text>
                </LinearGradient>
              </PressableScale>
            )}
          </View>
        </PressableScale>
      </AnimatedEntrance>
    );
  };

  const renderMissileItem = ({ item, index }: { item: Missile; index: number }) => (
    <AnimatedEntrance index={index} stagger={30}>
      <PressableScale haptic="select" style={styles.playerRow} onPress={() => setSelectedMissile(item)}>
        <View style={styles.missileImageWrap}>
          <Image
            source={getImageForProduct(item.type) || require('../assets/logo.png')}
            style={styles.missileImage}
            contentFit="contain"
          />
        </View>
        <View style={styles.playerInfo}>
          <Text style={styles.playerName} numberOfLines={1} ellipsizeMode="tail">
            {item.type}
          </Text>
          <Text style={styles.playerStatus}>
            {item.status} · ETA {convertimestampfuturemissile(item.etatimetoimpact).text}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={palette.textFaint} />
      </PressableScale>
    </AnimatedEntrance>
  );

  const renderMissileList = () => {
    const myMissiles = missiles.filter(missile => missile.sentbyusername === currentUsername);
    const otherMissiles = missiles.filter(missile => missile.sentbyusername !== currentUsername);

    return (
      <FlatList
        data={[
          ...myMissiles,
          { type: 'separator', id: 'separator' },
          ...otherMissiles
        ]}
        renderItem={({ item, index }) => {
          if (item.type === 'separator') {
            return (
              <View style={styles.separatorContainer}>
                <View style={styles.separatorLine} />
                <Text style={styles.separatorText}>All Missiles</Text>
                <View style={styles.separatorLine} />
              </View>
            );
          }
          return renderMissileItem({ item: item as Missile, index });
        }}
        keyExtractor={(item, index) =>
          item.type === 'separator' ? 'separator' : `${item.type}-${index}`
        }
        extraData={missiles}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  const renderMissileDetails = () => {
    if (!selectedMissile) return null;

    return (
      <View style={styles.missileDetails}>
        <Pressable style={styles.backButton} onPress={() => setSelectedMissile(null)} hitSlop={8}>
          <Ionicons name="chevron-back" size={16} color={palette.accent} />
          <Text style={styles.backButtonText}>Back</Text>
        </Pressable>
        <View style={styles.missileDetailImageWrap}>
          <Image
            source={getImageForProduct(selectedMissile.type) || require('../assets/logo.png')}
            style={styles.missileDetailImage}
            contentFit="contain"
          />
        </View>
        <Text style={styles.missileDetailTitle}>{selectedMissile.type}</Text>
        <View style={styles.missileInfoContainer}>
          <View style={styles.missileInfoItem}>
            <Text style={styles.missileInfoLabel}>Status</Text>
            <Text style={styles.missileInfoValue}>{selectedMissile.status}</Text>
          </View>
          <View style={styles.missileInfoItem}>
            <Text style={styles.missileInfoLabel}>ETA</Text>
            <Text style={styles.missileInfoValue}>
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
      <PressableScale
        haptic="select"
        style={[styles.playerViewButton, styles.responsiveButton]}
        onPress={() => {
          if (currentStep === 'playermenu') {
            moveToNextStep();
          }
          setModalVisible(true)
        }}
      >
        <Ionicons name="clipboard-outline" size={24} color={palette.text} />
      </PressableScale>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.segmentWrap}>
                <SegmentedControl
                  palette={palette}
                  value={activeTab}
                  onChange={switchTab}
                  options={[
                    { value: 'players', label: 'Players', icon: 'people' },
                    { value: 'missiles', label: 'My Missiles', icon: 'rocket' },
                  ]}
                />
              </View>
              <Pressable style={styles.closeButton} onPress={closeModal} hitSlop={8}>
                <Ionicons name="close" size={20} color={palette.textMuted} />
              </Pressable>
            </View>
            <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
              {(isLoading || isInitialLoad) ? (
                <ActivityIndicator size="large" color={palette.accent} />
              ) : activeTab === 'players' ? (
                players.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="telescope-outline" size={44} color={palette.textFaint} />
                    <Text style={styles.emptyTitle}>No players nearby</Text>
                    <Text style={styles.emptySubtitle}>Active players will show up here.</Text>
                  </View>
                ) : (
                  <FlatList
                    data={players}
                    renderItem={renderPlayerItem}
                    keyExtractor={(item) => item.username}
                    extraData={[friends, otherPlayersData]}
                    contentContainerStyle={styles.listContent}
                  />
                )
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
                  haptics.success();
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

const getStyles = (palette: ThemePalette, isDark: boolean) => StyleSheet.create({
  container: {
    position: 'relative',
  },
  playerViewButton: {
    backgroundColor: palette.surface,
    borderRadius: Radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: palette.border,
    ...chipShadow(isDark),
  },
  responsiveButton: {
    width: Platform.OS === 'ios' ? Math.min(screenWidth * 0.13, 60) : Math.min(screenWidth * 0.13, 70),
    height: Platform.OS === 'ios' ? Math.min(screenWidth * 0.13, 60) : Math.min(screenWidth * 0.13, 70),
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.overlay,
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '80%',
    backgroundColor: palette.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: palette.border,
    overflow: 'hidden',
    ...cardShadow(isDark),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.border,
  },
  segmentWrap: {
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    height: height * 0.6, // Fixed height for the content area
    justifyContent: 'center',
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: palette.surfaceAlt,
    borderWidth: 1,
    borderColor: palette.border,
  },
  playerImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.surface,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    ...Type.headline,
    color: palette.text,
  },
  playerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 3,
  },
  statusPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  statusPillAlly: {
    backgroundColor: palette.successSoft,
  },
  statusPillUnknown: {
    backgroundColor: palette.warningSoft,
  },
  statusPillText: {
    ...Type.micro,
  },
  statusPillTextAlly: {
    color: palette.success,
  },
  statusPillTextUnknown: {
    color: palette.warning,
  },
  playerStatus: {
    fontSize: 12,
    color: palette.textFaint,
  },
  actionButtons: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    minWidth: 88,
  },
  actionButtonText: {
    ...Type.micro,
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.xl,
  },
  emptyTitle: {
    ...Type.headline,
    color: palette.text,
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    ...Type.caption,
    fontWeight: '400',
    color: palette.textMuted,
  },
  missileImageWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missileImage: {
    width: 32,
    height: 32,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  separatorLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.border,
  },
  separatorText: {
    ...Type.micro,
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  missileDetails: {
    flex: 1,
    padding: Spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  backButtonText: {
    ...Type.caption,
    color: palette.accent,
  },
  missileDetailImageWrap: {
    alignSelf: 'center',
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    backgroundColor: palette.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  missileDetailImage: {
    width: 72,
    height: 72,
  },
  missileDetailTitle: {
    ...Type.title,
    color: palette.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  missileInfoContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  missileInfoItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: palette.surfaceAlt,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    gap: 2,
  },
  missileInfoLabel: {
    ...Type.micro,
    color: palette.textFaint,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  missileInfoValue: {
    ...Type.caption,
    color: palette.text,
  },
  mapContainer: {
    flex: 1,
    minHeight: 160,
    borderRadius: Radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  animationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: palette.overlay,
  },
});

export default PlayerViewButton;
