import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
  StatusBar,
  Animated,
  PanResponder,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { getlocation } from '../util/locationreq';

const { width, height } = Dimensions.get('window');

interface PermissionsScreenProps {
  onPermissionGranted: () => void;
}

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: any;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: readonly [string, string, string];
  accentColor: string;
  glowColor: string;
}

// Onboarding images - add your own images to assets/onboarding/
// For now, we'll use the existing Map.png as a fallback
const ONBOARDING_IMAGES = {
  welcome: require('../assets/onboarding/welcome.png'), // Replace with welcome image
  gameplay: require('../assets/onboarding/gameplay.png'), // Replace with gameplay image
  missiles: require('../assets/onboarding/missiles.png'), // Replace with missiles image
  landmines: require('../assets/onboarding/landmines.png'), // Replace with landmines image
  multiplayer: require('../assets/onboarding/multiplayer.png'), // Replace with multiplayer image
  leagues: require('../assets/onboarding/leagues.png'), // Replace with leagues image
  permissions: require('../assets/onboarding/permissions.png'), // Replace with permissions image
};

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    title: 'Welcome to\nMissile Wars',
    subtitle: 'Location-based battle royale',
    description: 'Fight for territory in real-time! Launch missiles, plant landmines, and dominate your area.',
    image: ONBOARDING_IMAGES.welcome,
    icon: 'game-controller-outline',
    gradientColors: ['#1a1f36', '#2d3561', '#773765'],
    accentColor: '#ff6b9d',
    glowColor: '#773765',
  },
  {
    id: 'gameplay',
    title: 'Real-World\nBattlefield',
    subtitle: 'Your location is your power',
    description: 'Move around in the real world to explore the map, collect loot, and engage in battles with nearby players.',
    image: ONBOARDING_IMAGES.gameplay,
    icon: 'map-outline',
    gradientColors: ['#1a2f4a', '#2a4a6a', '#3d6b9e'],
    accentColor: '#64b5f6',
    glowColor: '#64b5f6',
  },
  {
    id: 'missiles',
    title: 'Launch\nMissiles',
    subtitle: 'Strike from anywhere',
    description: 'Target enemies on the map and launch powerful missiles. Time and precision are key to victory.',
    image: ONBOARDING_IMAGES.missiles,
    icon: 'rocket-outline',
    gradientColors: ['#2a1a1a', '#4a2a2a', '#8b3a3a'],
    accentColor: '#ff5252',
    glowColor: '#ff5252',
  },
  {
    id: 'landmines',
    title: 'Deploy\nLandmines',
    subtitle: 'Set traps for enemies',
    description: 'Plant landmines at strategic locations. When enemies enter your territory, they will trigger your defenses.',
    image: ONBOARDING_IMAGES.landmines,
    icon: 'warning-outline',
    gradientColors: ['#1a3a2f', '#2d5a4a', '#4a8b6b'],
    accentColor: '#ffd700',
    glowColor: '#ffd700',
  },
  {
    id: 'multiplayer',
    title: 'Battle\nPlayers',
    subtitle: 'Real-time PvP combat',
    description: 'Engage in epic battles with players around you. Form alliances or go solo - the choice is yours.',
    image: ONBOARDING_IMAGES.multiplayer,
    icon: 'people-outline',
    gradientColors: ['#2a1a3a', '#4a2d5a', '#7b4a8b'],
    accentColor: '#b388ff',
    glowColor: '#b388ff',
  },
  {
    id: 'leagues',
    title: 'Climb\nLeagues',
    subtitle: 'Compete for glory',
    description: 'Earn points through battles and climb the league rankings. Reach the top tier and prove you are the best.',
    image: ONBOARDING_IMAGES.leagues,
    icon: 'trophy-outline',
    gradientColors: ['#3a1a1a', '#5a2d2d', '#8b4a4a'],
    accentColor: '#ffd700',
    glowColor: '#ffd700',
  },
  {
    id: 'permissions',
    title: 'Almost\nReady!',
    subtitle: "Let's get you set up",
    description: 'Enable permissions to unlock the full Missile Wars experience.',
    image: ONBOARDING_IMAGES.permissions,
    icon: 'settings-outline',
    gradientColors: ['#1a1f36', '#2d3561', '#773765'],
    accentColor: '#4CAF50',
    glowColor: '#4CAF50',
  },
];

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onPermissionGranted }) => {
  if (Platform.OS === 'web') return null;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [locationPermission, setLocationPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const currentSlideRef = useRef(currentSlide);
  currentSlideRef.current = currentSlide;

  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [glowValue, setGlowValue] = useState(0.4);
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  // Floating animation for images
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -20,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, []);

  // Glow pulse animation
  useEffect(() => {
    let direction = 1;
    let value = 0.4;
    const interval = setInterval(() => {
      value += direction * 0.006;
      if (value >= 0.7) {
        value = 0.7;
        direction = -1;
      } else if (value <= 0.4) {
        value = 0.4;
        direction = 1;
      }
      setGlowValue(value);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Button pulse animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Particle animations
  useEffect(() => {
    particleAnims.forEach((particle, index) => {
      const delay = index * 500;
      const duration = 3000 + Math.random() * 2000;

      const animate = () => {
        particle.x.setValue(Math.random() * width);
        particle.y.setValue(height + 50);
        particle.opacity.setValue(0);
        particle.scale.setValue(0.3 + Math.random() * 0.5);

        Animated.parallel([
          Animated.timing(particle.y, {
            toValue: -100,
            duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(particle.opacity, {
              toValue: 0.6,
              duration: duration * 0.3,
              useNativeDriver: true,
            }),
            Animated.timing(particle.opacity, {
              toValue: 0,
              duration: duration * 0.7,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animate());
      };

      setTimeout(animate, delay);
    });
  }, []);

  // Check permissions
  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const locationStatus = await Location.getForegroundPermissionsAsync();
      setLocationPermission(locationStatus.status === 'granted');

      const notifStatus = await Notifications.getPermissionsAsync();
      setNotificationPermission(notifStatus.status === 'granted');

    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const animateSlideChange = (direction: 'next' | 'prev') => {
    const current = currentSlideRef.current;
    const nextSlide = direction === 'next'
      ? Math.min(current + 1, SLIDES.length - 1)
      : Math.max(current - 1, 0);

    if (nextSlide === current) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -60 : 60,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentSlide(nextSlide);
      slideAnim.setValue(direction === 'next' ? 60 : -60);

      Animated.parallel([
        Animated.spring(fadeAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => animateSlideChange('next');
  const goPrev = () => animateSlideChange('prev');

  // Swipe gesture handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 50;
      },
      onPanResponderRelease: (_, gestureState) => {
        const swipeThreshold = 50;
        if (gestureState.dx < -swipeThreshold) {
          goNext();
        } else if (gestureState.dx > swipeThreshold) {
          goPrev();
        }
      },
    })
  ).current;

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      if (status === 'granted') {
        getlocation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error('Error requesting location:', error);
    }
  };

  const requestNotifications = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
      Haptics.notificationAsync(
        status === 'granted'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning
      );
    } catch (error) {
      console.error('Error requesting notifications:', error);
    }
  };

  const handleComplete = async () => {
    if (!locationPermission) {
      Alert.alert('Required', 'Location permission is required to play Missile Wars.');
      return;
    }

    if (!privacyAgreed) {
      Alert.alert('Required', 'Please agree to the Privacy Policy and Terms of Service to continue.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await AsyncStorage.setItem('alreadyLaunchedV2', 'true');
      onPermissionGranted();
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://www.oakforgestudios.co.uk/missilewars/privacy-policy');
  };

  const openEULA = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const slide = SLIDES[currentSlide];
  const isLastSlide = currentSlide === SLIDES.length - 1;

  if (!slide) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={slide.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating particles */}
      {particleAnims.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              transform: [
                { translateX: particle.x },
                { translateY: particle.y },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
            },
          ]}
        />
      ))}

      <SafeAreaView style={styles.safeArea}>
        {/* Progress dots */}
        <View style={styles.progressContainer}>
          {SLIDES.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.progressDot,
                index === currentSlide && styles.progressDotActive,
                index < currentSlide && styles.progressDotCompleted,
                index === currentSlide && {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          ))}
        </View>

        {/* Skip button */}
        {currentSlide < SLIDES.length - 1 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => setCurrentSlide(SLIDES.length - 1)}
          >
            <BlurView intensity={20} tint="dark" style={styles.skipButtonBlur}>
              <Text style={styles.skipText}>Skip</Text>
            </BlurView>
          </TouchableOpacity>
        )}

        {/* Main content */}
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateX: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          {isLastSlide ? (
            // Last slide with permissions
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContentHelper}
              showsVerticalScrollIndicator={false}
              bounces={true}
            >
              {/* Helper layout: image left, text right */}
              <View style={styles.helperContainer}>
                <Animated.View
                  style={[
                    styles.helperImageContainer,
                    { transform: [{ translateY: floatAnim }] },
                  ]}
                >
                  <View style={[
                    styles.helperImageGlow,
                    { shadowOpacity: glowValue, shadowColor: slide.glowColor },
                  ]}>
                    <Image
                      source={slide.image}
                      style={styles.helperImage}
                      resizeMode="contain"
                    />
                  </View>
                </Animated.View>
                <View style={styles.helperTextContainer}>
                  <Text style={styles.helperTitle}>{slide.title}</Text>
                  <Text style={[styles.helperSubtitle, { color: slide.accentColor }]}>
                    {slide.subtitle}
                  </Text>
                </View>
              </View>

              <Text style={styles.helperDescription}>{slide.description}</Text>

              {/* Permissions section */}
              <View style={styles.permissionsContainer}>
                <PermissionRow
                  icon="location-outline"
                  title="Location (Required)"
                  description="Essential for gameplay and map features"
                  isGranted={locationPermission}
                  onPress={requestLocationPermission}
                  accentColor={slide.accentColor}
                  required
                />

                <PermissionRow
                  icon="notifications-outline"
                  title="Notifications"
                  description="Get alerts when you're under attack"
                  isGranted={notificationPermission}
                  onPress={requestNotifications}
                  accentColor={slide.accentColor}
                />

                <TouchableOpacity
                  style={styles.privacyRow}
                  onPress={() => {
                    setPrivacyAgreed(!privacyAgreed);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.checkbox,
                      privacyAgreed && styles.checkboxChecked,
                    ]}
                  >
                    {privacyAgreed && (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                  </View>
                  <Text style={styles.privacyText}>
                    I agree to the{' '}
                    <Text style={styles.privacyLink} onPress={openPrivacyPolicy}>
                      Privacy Policy
                    </Text>
                    {' '}and{' '}
                    <Text style={styles.privacyLink} onPress={openEULA}>
                      Terms of Service
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Bottom padding for scroll */}
              <View style={{ height: 40 }} />
            </ScrollView>
          ) : (
            // Regular slides
            <>
              {/* Image with glow effect */}
              <Animated.View
                style={[
                  styles.imageContainer,
                  { transform: [{ translateY: floatAnim }] },
                ]}
              >
                <View style={[
                  styles.imageGlow,
                  {
                    shadowOpacity: glowValue,
                    shadowColor: slide.glowColor,
                    shadowRadius: 35,
                    shadowOffset: { width: 0, height: 0 },
                  },
                ]}>
                  <Image
                    source={slide.image}
                    style={styles.onboardingImage}
                    resizeMode="contain"
                  />
                </View>
              </Animated.View>

              {/* Text content */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{slide.title}</Text>
                <View style={styles.subtitleContainer}>
                  <View style={[styles.subtitleLine, { backgroundColor: slide.accentColor }]} />
                  <Text style={[styles.subtitle, { color: slide.accentColor }]}>
                    {slide.subtitle}
                  </Text>
                  <View style={[styles.subtitleLine, { backgroundColor: slide.accentColor }]} />
                </View>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </>
          )}
        </Animated.View>

        {/* Navigation */}
        <View style={styles.navigationContainer}>
          {currentSlide > 0 ? (
            <TouchableOpacity
              style={styles.navButton}
              onPress={goPrev}
              activeOpacity={0.7}
            >
              <BlurView intensity={30} tint="dark" style={styles.navButtonBlur}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          ) : (
            <View style={styles.navButtonPlaceholder} />
          )}

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[
                styles.mainButton,
                isLastSlide && (!privacyAgreed || !locationPermission ? styles.disabledButton : styles.completeButton),
              ]}
              onPress={isLastSlide ? handleComplete : goNext}
              activeOpacity={0.8}
              disabled={isLastSlide && (!privacyAgreed || !locationPermission)}
            >
              <LinearGradient
                colors={
                  isLastSlide
                    ? privacyAgreed && locationPermission
                      ? ['#4CAF50', '#45a049']
                      : ['#666', '#555']
                    : [slide.accentColor, slide.gradientColors[1]]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.mainButtonGradient}
              >
                <Text
                  style={[
                    styles.mainButtonText,
                    isLastSlide && privacyAgreed && locationPermission && styles.completeButtonText,
                  ]}
                >
                  {isLastSlide ? "Let's Go!" : 'Continue'}
                </Text>
                {!isLastSlide && (
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                )}
                {isLastSlide && privacyAgreed && locationPermission && (
                  <Ionicons
                    name="rocket"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.navButtonPlaceholder} />
        </View>
      </SafeAreaView>
    </View>
  );
};

const PermissionRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  isGranted: boolean;
  onPress: () => void;
  accentColor: string;
  required?: boolean;
}> = ({ icon, title, description, isGranted, onPress, accentColor, required }) => (
  <TouchableOpacity
    style={styles.permissionRow}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.permissionIcon, { backgroundColor: accentColor + '40' }]}>
      <Ionicons name={icon} size={24} color="#fff" />
    </View>
    <View style={styles.permissionTextContainer}>
      <Text style={styles.permissionTitle}>{title}</Text>
      <Text style={styles.permissionDescription}>{description}</Text>
    </View>
    <View
      style={[
        styles.permissionStatus,
        isGranted && styles.permissionStatusGranted,
      ]}
    >
      <Ionicons name={isGranted ? 'checkmark' : 'add'} size={18} color="#fff" />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 20,
    gap: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    width: 32,
    backgroundColor: '#fff',
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    borderRadius: 20,
    overflow: 'hidden',
  },
  skipButtonBlur: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scrollContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContentHelper: {
    paddingBottom: 20,
  },
  imageContainer: {
    height: height * 0.26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageGlow: {
    // Glow applied via inline styles
  },
  onboardingImage: {
    width: width * 0.65,
    height: width * 0.5,
    maxWidth: 280,
    maxHeight: 220,
  },
  helperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  helperImageContainer: {
    marginRight: 16,
  },
  helperImageGlow: {
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 0 },
  },
  helperImage: {
    width: 100,
    height: 100,
  },
  helperTextContainer: {
    flex: 1,
  },
  helperTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  helperSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  helperDescription: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 8,
    width: '100%',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 44,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
    letterSpacing: -0.5,
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    gap: 12,
  },
  subtitleLine: {
    height: 2,
    width: 24,
    borderRadius: 1,
    opacity: 0.6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  permissionsContainer: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  permissionIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  permissionDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  permissionStatus: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionStatusGranted: {
    backgroundColor: '#4CAF50',
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  privacyText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
    lineHeight: 20,
  },
  privacyLink: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  navButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  navButtonBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonPlaceholder: {
    width: 52,
  },
  mainButton: {
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  completeButton: {
    shadowColor: '#4CAF50',
    shadowOpacity: 0.5,
  },
  disabledButton: {
    opacity: 0.6,
  },
  mainButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 44,
  },
  mainButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  completeButtonText: {
    color: '#fff',
  },
});

export default PermissionsScreen;
