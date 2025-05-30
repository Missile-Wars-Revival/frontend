import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Dimensions, ImageBackground, Image, SafeAreaView, KeyboardAvoidingView, StatusBar, useColorScheme, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { MapPin, Bell, FileText, Target } from 'lucide-react-native';
import { Linking } from 'react-native';
import { requestTrackingPermissionsAsync, getTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { getlocation } from '../util/locationreq';

const { width, height } = Dimensions.get('window');

interface PermissionsScreenProps {
  onPermissionGranted: () => void;
}

const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onPermissionGranted }) => {
  const [locationPermission, setLocationPermission] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [privacyPolicyAndEulaAgreed, setPrivacyPolicyAndEulaAgreed] = useState(false);
  // Change this line to initialize tracking permission as false for both iOS and Android
  const [trackingPermission, setTrackingPermission] = useState(false);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const checks = [
      { key: 'location', check: Location.getForegroundPermissionsAsync },
      { key: 'notification', check: Notifications.getPermissionsAsync },
    ];

    // Always check tracking permission on iOS
    if (Platform.OS === 'ios') {
      checks.push({ key: 'tracking', check: getTrackingPermissionsAsync });
    } else {
      // For Android, set tracking permission to true
      setTrackingPermission(true);
    }

    for (const { key, check } of checks) {
      try {
        const { status } = await check();
        updatePermission(key as 'location' | 'notification' | 'tracking', status === 'granted');
      } catch (error) {
        console.error(`Error checking ${key} permission:`, error);
        updatePermission(key as 'location' | 'notification' | 'tracking', false);
      }
    }
  };

  const updatePermission = (key: 'location' | 'notification' | 'tracking', granted: boolean) => {
    switch (key) {
      case 'location':
        setLocationPermission(granted);
        break;
      case 'notification':
        setNotificationPermission(granted);
        break;
      case 'tracking':
        setTrackingPermission(granted);
        break;
    }
  };

  const openAppSettings = () => {
    Linking.openSettings();
  };

  const handlePermissionRequest = async (
    permissionType: 'location' | 'notification',
    requestFunction: () => Promise<{ status: string }>
  ) => {
    const { status } = await requestFunction();
    // Update the corresponding state without showing an alert
    switch (permissionType) {
      case 'location':
        setLocationPermission(status === 'granted');
        if (status === 'granted') {
          getlocation();
        }
        break;
      case 'notification':
        setNotificationPermission(status === 'granted');
        break;
    }
  };

  const requestLocationPermission = async () => {
    handlePermissionRequest('location', Location.requestForegroundPermissionsAsync);
  };

  const requestNotificationPermission = () => {
    handlePermissionRequest('notification', Notifications.requestPermissionsAsync);
  };

  const requestTrackingPermission = async () => {
    if (Platform.OS === 'ios') {
      try {
        const { status } = await requestTrackingPermissionsAsync();
        setTrackingPermission(status === 'granted');
        // Add a console.log to check if this function is being called
        console.log('Tracking permission status:', status);
      } catch (error) {
        console.error('Error requesting tracking permission:', error);
      }
    } else {
      // On Android, we don't need to request this permission
      setTrackingPermission(true);
    }
  };

  const openPrivacyPolicy = () => {
    Linking.openURL('https://website.missilewars.dev/privacypolicy');
  };

  const openEula = () => {
    Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
  };

  const agreeToPrivacyPolicyAndEula = () => {
    try {
      setPrivacyPolicyAndEulaAgreed(true);
    } catch (error) {
      console.error('Error agreeing to privacy policy and EULA:', error);
    }
  };

  const handleContinue = () => {
    if (privacyPolicyAndEulaAgreed) {
      onPermissionGranted();
    } else {
      Alert.alert('Required Agreement', 'You must agree to the Privacy Policy and EULA to use this app.');
    }
  };

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const backgroundImage = require('../assets/concept/Map.png'); 

  const styles = useMemo(() => StyleSheet.create({
    ...lightStyles,
    ...(isDarkMode ? darkStyles : {}),
  }), [isDarkMode]);

  const titleImage = require('../assets/icons/MissleWarsTitle.png');

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ImageBackground
        source={backgroundImage}
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageStyle}
      >
        <View style={styles.whiteOverlay} />
        <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
          <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
          <Image
            source={titleImage}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.headerContainer}>
            <Text style={[styles.title, isDarkMode && styles.titleDark]}>Permissions</Text>
            <Text style={[styles.subtitle, isDarkMode && styles.subtitleDark]}>We need some permissions to get started</Text>
          </View>
          
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.permissionsContainer}>
              <PermissionItem
                title="Location Permission"
                description="Needed to show your position on the map and interact with other players."
                icon={<MapPin size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />}
                isGranted={locationPermission}
                onPress={requestLocationPermission}
                styles={styles}
                isDarkMode={isDarkMode}
              />

              <PermissionItem
                title="Notification Permission"
                description="Allows us to send you important game updates and alerts."
                icon={<Bell size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />}
                isGranted={notificationPermission}
                onPress={requestNotificationPermission}
                styles={styles}
                isDarkMode={isDarkMode}
              />

              {Platform.OS === 'ios' && (
                <PermissionItem
                  title="App Tracking Permission"
                  description="This allows us to show you more relevant ads and helps keep the app free. You can decline without affecting your experience."
                  icon={<Target size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />}
                  isGranted={trackingPermission}
                  onPress={requestTrackingPermission}
                  styles={styles}
                  isDarkMode={isDarkMode}
                />
              )}

              <PermissionItem
                title="Agree to Privacy Policy and EULA (Required)"
                description="You must agree to our Privacy Policy and End User License Agreement (EULA) to use this app."
                icon={<FileText size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />}
                isGranted={privacyPolicyAndEulaAgreed}
                onPress={agreeToPrivacyPolicyAndEula}
                styles={styles}
                isDarkMode={isDarkMode}
              >
                <View style={styles.legalButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.legalButton, isDarkMode && styles.legalButtonDark]} 
                    onPress={openPrivacyPolicy}
                  >
                    <Text style={[styles.legalButtonText, isDarkMode && styles.legalButtonTextDark]}>
                      Read Privacy Policy
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.legalButton, isDarkMode && styles.legalButtonDark]} 
                    onPress={openEula}
                  >
                    <Text style={[styles.legalButtonText, isDarkMode && styles.legalButtonTextDark]}>
                      Read EULA
                    </Text>
                  </TouchableOpacity>
                </View>
              </PermissionItem>
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                !privacyPolicyAndEulaAgreed && styles.disabledButton, 
                isDarkMode && styles.continueButtonDark,
                isDarkMode && !privacyPolicyAndEulaAgreed && styles.disabledButtonDark
              ]} 
              onPress={handleContinue}
              disabled={!privacyPolicyAndEulaAgreed}
            >
              <Text style={[
                styles.continueButtonText,
                isDarkMode && !privacyPolicyAndEulaAgreed && styles.disabledButtonTextDark
              ]}>
                Agree & Continue
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </KeyboardAvoidingView>
  );
};

const PermissionItem = ({ title, description, icon, isGranted, onPress, styles, isDarkMode, children }: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  isGranted: boolean; 
  onPress: () => void; 
  styles: any; 
  isDarkMode: boolean;
  children?: React.ReactNode;
}) => (
  <View style={[
    styles.permissionItem, 
    isDarkMode && styles.permissionItemDark,
    { backgroundColor: isDarkMode ? '#2C2C2C' : '#FFFFFF' }
  ]}>
    <View style={styles.permissionHeader}>
      {icon}
      <Text style={[styles.permissionTitle, isDarkMode && styles.permissionTitleDark]}>{title}</Text>
    </View>
    <Text style={[styles.permissionDescription, isDarkMode && styles.permissionDescriptionDark]}>{description}</Text>
    {children}
    <TouchableOpacity 
      style={[
        styles.permissionButton, 
        isGranted ? styles.grantedPermissionButton : (isDarkMode ? styles.darkModePermissionButton : styles.lightModePermissionButton)
      ]} 
      onPress={onPress}
    >
      <Text style={[
        styles.permissionButtonText,
        isGranted ? styles.grantedPermissionButtonText : (isDarkMode ? styles.darkModePermissionButtonText : styles.lightModePermissionButtonText)
      ]}>
        {isGranted ? 'Granted' : 'Continue'}
      </Text>
    </TouchableOpacity>
  </View>
);

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    width: width,
    height: height * 0.15,
    marginTop: height * 0.02,
  },
  headerContainer: {
    marginBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    color: '#773765',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.05,
  },
  permissionsContainer: {
    paddingBottom: height * 0.02,
  },
  permissionItem: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF', // Ensure this is set
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  permissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
    color: '#773765',
  },
  permissionDescription: {
    marginBottom: 12,
    color: '#555',
    fontSize: 14,
  },
  grantedButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  permissionButton: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  lightModePermissionButton: {
    backgroundColor: '#773765', // Original color for light mode
  },
  grantedPermissionButton: {
    backgroundColor: '#4CAF50', // Green color for granted state (both modes)
  },
  bottomContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  continueButton: {
    backgroundColor: '#773765',
    borderRadius: 20,
    width: '90%',
    height: height * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: height * 0.02,
  },
  continueButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  divider: {
    width: width,
    height: height * 0.1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundImageStyle: {
    resizeMode: 'cover',
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // White hue layer
  },
  permissionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  lightModePermissionButtonText: {
    color: '#FFFFFF', // White text for light mode button
  },
  grantedPermissionButtonText: {
    color: '#FFFFFF', // White text for granted button (both modes)
  },
  privacyPolicyButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  privacyPolicyButtonText: {
    color: '#773765',
    fontWeight: 'bold',
  },
  legalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  legalButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  legalButtonText: {
    color: '#773765',
    fontWeight: 'bold',
  },
});

const darkStyles = StyleSheet.create({
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  titleDark: {
    color: '#4CAF50',
  },
  subtitleDark: {
    color: '#BBBBBB',
  },
  permissionItemDark: {
    backgroundColor: '#2C2C2C', // Ensure this is set
  },
  permissionTitleDark: {
    color: '#4CAF50',
  },
  permissionDescriptionDark: {
    color: '#BBBBBB',
  },
  permissionButtonDark: {
    backgroundColor: '#4CAF50',
  },
  continueButtonDark: {
    backgroundColor: '#4CAF50',
  },
  darkModePermissionButton: {
    backgroundColor: '#9C27B0', // New color for dark mode (e.g., purple)
  },
  darkModePermissionButtonText: {
    color: '#FFFFFF', // White text for dark mode button
  },
  privacyPolicyButtonDark: {
    backgroundColor: '#444444',
  },
  privacyPolicyButtonTextDark: {
    color: '#4CAF50',
  },
  disabledButtonDark: {
    backgroundColor: '#2C2C2C', // Darker shade for disabled state in dark mode
  },
  disabledButtonTextDark: {
    color: '#666666', // Darker text for disabled state in dark mode
  },
  legalButtonDark: {
    backgroundColor: '#444444',
  },
  legalButtonTextDark: {
    color: '#4CAF50',
  },
});

export default PermissionsScreen;
