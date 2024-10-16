import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableHighlight, Switch, ScrollView, Alert, StyleSheet, Dimensions, TouchableOpacity, Modal, Linking, Platform, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from "../components/ui/input";
import { User, LockKeyhole, Mail, ChevronLeft, Shield, MessageCircle, ChevronRight, Heart, Star } from "lucide-react-native";
import * as SecureStore from 'expo-secure-store';
import { changeEmail, changePassword, changeUsername, deleteAcc } from '../api/changedetails';
import { updateFriendsOnlyStatus } from '../api/visibility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { updatelocActive, getlocActive, getRandomLocation, randomLocation } from '../api/locationOptions';
import { clearCredentials } from '../util/logincache';
import { useAuth } from '../util/Context/authcontext';
import AppIconChanger from '../components/appiconchanger';
import { Card } from "../components/card";
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import * as StoreReview from 'expo-store-review';
import { getNotificationPreferences, updateNotificationPreferences } from '../api/notifications';
import { RewardedAd, RewardedAdEventType, TestIds } from 'react-native-google-mobile-ads';
import { LinearGradient } from 'expo-linear-gradient';


const adUnitId = __DEV__ ? TestIds.REWARDED : Platform.select({
  ios: 'ca-app-pub-4035842398612787/8310612855',
  android: 'ca-app-pub-4035842398612787/2779084579',
  default: 'ca-app-pub-4035842398612787/2779084579',
});

const rewarded = RewardedAd.createForAdRequest(adUnitId, {
  keywords: ['games', 'clothing'], //ads category
});

const { width } = Dimensions.get('window');

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibilityMode, setVisibilityMode] = useState<'friends' | 'global'>('global');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const [locActive, setLocActive] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [notificationToken, setNotificationToken] = useState<string | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { setIsSignedIn } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAccountUsername, setDeleteAccountUsername] = useState('');
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showVisibilitySettings, setShowVisibilitySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    incomingEntities: false,
    entityDamage: false,
    entitiesInAirspace: false,
    eliminationReward: false,
    lootDrops: false,
    friendRequests: false,
    leagues: false,
  });
  const [slideAnimation] = useState(new Animated.Value(width));
  const [adLoaded, setAdLoaded] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [randomLocActive, setRandomLocActive] = useState<boolean>(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isAdFree, setIsAdFree] = useState<boolean>(false);
  const [offerings, setOfferings] = useState<any | null>(null);
  const [imagePreference, setImagePreference] = useState('default');
  const [currentPosition, setCurrentPosition] = useState(0);
  const sliderPosition = useRef(new Animated.Value(0)).current;

  const notificationDescriptions = {
    incomingEntities: "Receive alerts when entities are approaching your location.",
    entityDamage: "Get notified when you take damage.",
    entitiesInAirspace: "Be alerted when entities enter your airspace.",
    eliminationReward: "Receive notifications for elimination rewards and Grace Periods.",
    lootDrops: "Get alerts for nearby loot drops and loot drop rewards.",
    friendRequests: "Be notified of new friend requests or friends adding you back.",
    leagues: "Receive updates about league events and standings.",
  };

  useEffect(() => {
    loadUserData();
    loadSettings();
    fetchLocActiveStatus();
    fetchNotificationPreferences();
    fetchRandomLocActiveStatus();
    checkAdFreeStatus();
    fetchOfferings();
  }, []);

  useEffect(() => {
    const unsubscribeLoaded = rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setAdLoaded(true);
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
    if (
      showAccountDetails ||
      showVisibilitySettings ||
      showNotificationSettings ||
      showCredits // Include showCredits here
    ) {
      Animated.spring(slideAnimation, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }).start();
    }
  }, [showAccountDetails, showVisibilitySettings, showNotificationSettings, showCredits]); // Add showCredits to dependencies

  useEffect(() => {
    const loadImagePreference = async () => {
      const pref = await AsyncStorage.getItem('imagepref');
      setImagePreference(pref || 'default');
      sliderPosition.setValue(getSliderPosition(pref || 'default'));
    };
    loadImagePreference();
  }, []);

  const getSliderPosition = (pref: string) => {
    switch (pref) {
      case 'default': return 0;
      case 'fruitandveg': return 1;
      case 'halloween': return 2;
      default: return 0;
    }
  };

  const closePopup = (setStateFunction: React.Dispatch<React.SetStateAction<boolean>>) => {
    Animated.spring(slideAnimation, {
      toValue: width,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start(() => {
      setStateFunction(false);
      // Reset the animation value for the next opening
      slideAnimation.setValue(width);
    });
  };

  const closeAccountDetails = () => closePopup(setShowAccountDetails);
  const closeVisibilitySettings = () => closePopup(setShowVisibilitySettings);
  const closeNotificationSettings = () => closePopup(setShowNotificationSettings);

  const loadUserData = async () => {
    const storedUsername = await SecureStore.getItemAsync('username');
    const storedEmail = await SecureStore.getItemAsync('email');
    const cachedNotificationToken = await SecureStore.getItemAsync('notificationToken');
    const cachedFirebaseToken = await SecureStore.getItemAsync("firebaseUID");
    const cachedToken = await SecureStore.getItemAsync('token');
    setNotificationToken(cachedNotificationToken);
    setFirebaseToken(cachedFirebaseToken);
    setUsername(storedUsername || '');
    setEmail(storedEmail || '');
    setToken(cachedToken);
  };

  const loadSettings = async () => {
    const storedMode = await AsyncStorage.getItem('visibilitymode');
    if (storedMode !== null) {
      setVisibilityMode(storedMode as 'friends' | 'global');
    }
  };

  const fetchLocActiveStatus = async () => {
    setIsLoading(true);
    try {
      const status = await getlocActive();
      setLocActive(status);
    } catch (error) {
      console.error("Failed to fetch locActive status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRandomLocActiveStatus = async () => {
    try {
      const status = await getRandomLocation();
      setRandomLocActive(status);
    } catch (error) {
      console.error("Failed to fetch random location status:", error);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const fetchOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        // console.log('Current offerings:', offerings.current.availablePackages);
        const adFreePackage = offerings.current.availablePackages.find(
          (pkg) => pkg.identifier === 'ad_free'
        );
        if (adFreePackage) {
          // console.log('Ad-free package found:', adFreePackage);
          setOfferings([adFreePackage]); // Set as an array with only the ad_free package
        } else {
          // console.log('Ad-free package not found in the current offering');
          setOfferings([]); // Set an empty array if no ad_free package is found
        }
      } else {
        // console.log('No current offering available');
        setOfferings([]);
      }
    } catch (e) {
      // console.error('Error fetching offerings:', e);
      setOfferings([]);
    }
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (typeof customerInfo.entitlements.active['ad_free'] !== "undefined") {
        console.log("User has ad-free access");
        setIsAdFree(true);
        await AsyncStorage.setItem('isAdFree', 'true');
        Alert.alert('Success', 'You now have ad-free access!');
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error('Error processing purchase:', (e as Error).message);
        if ('code' in e && (e as any).code === (Purchases as any).ErrorCode.PURCHASE_CANCELLED_ERROR) {
          console.log('User cancelled the purchase');
        } else {
          Alert.alert('Purchase Error', (e as Error).message);
        }
      } else {
        console.error('Unexpected error during purchase:', e);
        Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateUsername = (username: string) => {
    return username.length >= 3 && username.match(/^[a-zA-Z0-9]+$/);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
  };

  const handleUsernameChange = async () => {
    setUsernameError('');
    if (!validateUsername(username)) {
      setUsernameError('Username must be at least 3 characters long and contain only letters and numbers');
      return;
    }
    Alert.alert(
      "Confirm Username Change",
      `Are you sure you want to change your username to "${username}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changeUsername(username);
              await SecureStore.setItemAsync('username', username);
              Alert.alert("Success", "Username changed successfully");
            } catch (error) {
              console.error("Error changing username:", error);
              Alert.alert("Error", "Failed to change username. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleEmailChange = (email: string) => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Invalid email address');
      return;
    }
    setNewEmail(email);
    setIsConfirmingEmail(true);
  };

  const confirmEmailChange = async () => {
    try {
      await changeEmail(newEmail);
      await SecureStore.setItemAsync('email', newEmail);
      setIsConfirmingEmail(false);
      Alert.alert("Success", "Email changed successfully. Please sign in again.");
      handleLogout();
    } catch (error) {
      console.error("Error changing email:", error);
      Alert.alert("Error", "Failed to change email. Please try again.");
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (!validatePassword(newPassword)) {
      setPasswordError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }
    Alert.alert(
      "Confirm Password Change",
      "Are you sure you want to change your password?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changePassword(newPassword);
              Alert.alert("Success", "Password changed successfully");
              setNewPassword('');
              setConfirmPassword('');
            } catch (error) {
              console.error("Error changing password:", error);
              Alert.alert("Error", "Failed to change password. Please try again.");
            }
          }
        }
      ]
    );
  };

  const toggleVisibilityMode = async () => {
    const newMode = visibilityMode === 'friends' ? 'global' : 'friends';
    setVisibilityMode(newMode);
    await AsyncStorage.setItem('visibilitymode', newMode);
    updateFriendsOnlyStatus(newMode === 'friends');

    if (newMode === 'global') {
      Alert.alert(
        "Change to Global Mode",
        "You are about to change your visibility to global. Everyone will be able to see your location.",
        [
          {
            text: "Cancel",
            onPress: () => {
              console.log("Change cancelled");
              setVisibilityMode('friends');
            },
            style: "cancel"
          },
          {
            text: "Confirm",
            onPress: async () => {
              await AsyncStorage.setItem('visibilitymode', newMode);
              await updateFriendsOnlyStatus(newMode === 'global');
              console.log("Visibility mode changed to:", newMode);
            }
          }
        ]
      );
    } else {
      console.log("Visibility mode changed to:", newMode);
    }
  };

  const toggleLocActive = async () => {
    const newStatus = !locActive;

    if (!newStatus && !isAdFree) {
      // If turning off location and not ad-free, attempt to show ad
      if (adLoaded) {
        setShowAd(true);
        rewarded.show();
        handleLocationToggle(newStatus);
      } else {
        // If ad is not loaded, continue anyway
        console.log("Ad not loaded, continuing without showing ad");
        handleLocationToggle(newStatus);
      }
    } else {
      // If turning on location or ad-free, proceed normally
      handleLocationToggle(newStatus);
    }
  };

  const toggleRandomLocActive = async () => {
    const newStatus = !randomLocActive;
    setRandomLocActive(newStatus); // Update state immediately for responsive UI

    try {
      if (newStatus && !isAdFree) {
        // If turning off location and not ad-free, attempt to show ad 
        if (adLoaded) {
          setShowAd(true);
          rewarded.show();
        } else {
          console.log("Ad not loaded, continuing without showing ad");
        }
      }

      const result = await randomLocation(newStatus);
      console.log("API response:", result); // Log the API response

      Alert.alert(
        newStatus ? "Random Location Activated" : "Random Location Deactivated",
        `Your random location will now be ${newStatus ? "Diffused" : "Accurate"}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to update random location status:", error);
      setRandomLocActive(newStatus); // Revert state if API call fails

      let errorMessage = "Failed to update random location status. Please try again.";
      if (error instanceof Error) {
        errorMessage += ` Error: ${error.message}`;
      }

      Alert.alert("Error", errorMessage);
      setRandomLocActive(newStatus); // Revert state if API call fails
    }
  };

  const handleLocationToggle = async (newStatus: boolean) => {
    setLocActive(newStatus);
    await updatelocActive(newStatus);
    if (newStatus) {
      Alert.alert(
        "Location Activated",
        "Your location will now be shared and map functionality will be fully enabled.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Location Deactivated",
        "Your location will no longer be shared, and map functionality will be limited.",
        [{ text: "OK" }]
      );
    }
  };

  const handleLogout = async () => {
    await clearCredentials();
    await AsyncStorage.setItem('signedIn', 'false');
    setIsSignedIn(false);
    router.navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountUsername !== username) {
      Alert.alert("Error", "The username you entered does not match your current username.");
      return;
    }

    try {
      const result = await deleteAcc(username);
      if (result.success) {
        Alert.alert("Account Deleted", result.message, [
          {
            text: "OK",
            onPress: async () => {
              await handleLogout();
              router.replace("/login");
            }
          }
        ]);
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
    setShowDeleteModal(false);
  };

  const handleJoinDiscord = () => {
    Linking.openURL('https://discord.gg/Gk8jqUnVd3');
  };

  const handleRateApp = async () => {
    if (await StoreReview.hasAction()) {
      StoreReview.requestReview();
    } else {
      // Fallback for devices that can't request review
      if (Platform.OS === 'ios') {
        Linking.openURL('https://apps.apple.com/app/missile-wars-revival/id6590602456');
      } else {
        Linking.openURL('https://play.google.com/store/apps/details?id=com.longtimenoc.missilewars');
      }
    }
  };

  useEffect(() => {
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    try {
      const preferences = await getNotificationPreferences();
      setNotificationSettings(preferences);
    } catch (error) {
      console.error("Failed to fetch notification preferences:", error);
      // Optionally, you can show an error message to the user
    }
  };

  const toggleNotificationSetting = async (setting: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    };
    
    try {
      const updatedPreferences = await updateNotificationPreferences(newSettings);
      setNotificationSettings(updatedPreferences);
      console.log("Updated notification settings:", updatedPreferences);
    } catch (error) {
      console.error("Failed to update notification preference:", error);
      // Optionally, show an error message to the user
      Alert.alert("Error", "Failed to update notification preference. Please try again.");
    }
  };

  const renderPopup = (content: React.ReactNode) => (
    <Animated.View
      style={[
        styles.settingsPopup,
        isDarkMode && styles.settingsPopupDark,
        { transform: [{ translateX: slideAnimation }] },
      ]}
    >
      {content}
    </Animated.View>
  );

  const renderImagePreferenceToggle = () => {
    const options = [
      { value: 'default', label: 'Default', icon: '🚀' },
      { value: 'fruitandveg', label: 'Veggie', icon: '🥕' },
      { value: 'halloween', label: 'Halloween', icon: '🎃' },
    ];
  
    const containerWidth = width * 0.9; // Assuming the container width is 90% of the screen width
    const optionWidth = (containerWidth - 29) / 3; // Subtracting 24 for padding (8 on each side)
  
    return (
      <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
        <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Image Preference</Text>
        <View style={styles.toggleContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.toggleOption,
                { width: optionWidth },
                imagePreference === option.value && styles.toggleOptionActive,
                isDarkMode && styles.toggleOptionDark,
                imagePreference === option.value && isDarkMode && styles.toggleOptionActiveDark,
              ]}
              onPress={() => {
                setImagePreference(option.value);
                AsyncStorage.setItem('imagepref', option.value);
              }}
            >
              <Text style={styles.toggleOptionIcon}>{option.icon}</Text>
              <Text style={[
                styles.toggleOptionLabel,
                imagePreference === option.value && styles.toggleOptionLabelActive,
                isDarkMode && styles.toggleOptionLabelDark,
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          <LinearGradient
            colors={isDarkMode ? ['#5c2a4f', '#773765'] : ['#773765', '#9d4b87']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.toggleIndicator,
              {
                width: optionWidth,
                transform: [{ translateX: optionWidth * options.findIndex(o => o.value === imagePreference) }],
              },
            ]}
          />
        </View>
        <Text style={[styles.visibilityDescription, isDarkMode && styles.visibilityDescriptionDark]}>
          {imagePreference === 'default'
            ? 'Using default game images'
            : imagePreference === 'fruitandveg'
            ? 'Using fruit and vegetable themed images'
            : 'Using Halloween themed images'}
        </Text>
      </View>
    );
  };

  const renderAccountDetails = () => renderPopup(
    <ScrollView contentContainerStyle={styles.popupScrollContent}>
      <View style={styles.popupHeader}>
        <TouchableOpacity
          style={styles.popupbackButton}
          onPress={closeAccountDetails}
        >
          <ChevronLeft size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.popupTitle, isDarkMode && styles.popupTitleDark]}>Account Details</Text>
      </View>

      <View style={styles.inputContainer}>
        <User size={24} color={isDarkMode ? "white" : "black"} style={styles.inputIcon} />
        <Input
          placeholder={username || "Username"}
          onChangeText={(text) => {
            setUsername(text);
            setUsernameError('');
          }}
          style={[styles.input, isDarkMode && styles.inputDark]}
        />
      </View>
      {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
      <TouchableHighlight
        onPress={handleUsernameChange}
        style={[styles.button, isDarkMode && styles.buttonDark]}
        underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
      >
        <Text style={styles.buttonText}>Change Username</Text>
      </TouchableHighlight>

      <View style={styles.inputContainer}>
        <Mail size={24} color={isDarkMode ? "white" : "black"} style={styles.inputIcon} />
        <Input
          placeholder={email || "Email"}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
          }}
          style={[styles.input, isDarkMode && styles.inputDark]}
        />
      </View>
      {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

      {isConfirmingEmail ? (
        <View style={styles.confirmationContainer}>
          <Text style={[styles.confirmationText, isDarkMode && styles.confirmationTextDark]}>
            Are you sure you want to change your email to {newEmail}? You will be required to sign back in after changing.
          </Text>
          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              onPress={() => setIsConfirmingEmail(false)}
              style={[styles.confirmationButton, styles.cancelButton]}
            >
              <Text style={styles.confirmationButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmEmailChange}
              style={[styles.confirmationButton, styles.confirmButton]}
            >
              <Text style={styles.confirmationButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableHighlight
          onPress={() => handleEmailChange(email)}
          style={[styles.button, isDarkMode && styles.buttonDark]}
          underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
        >
          <Text style={styles.buttonText}>Change Email</Text>
        </TouchableHighlight>
      )}

      <View style={styles.inputContainer}>
        <LockKeyhole size={24} color={isDarkMode ? "white" : "black"} style={styles.inputIcon} />
        <Input
          placeholder="New Password"
          value={newPassword}
          secureTextEntry={true}
          autoCorrect={false}
          autoCapitalize="none"
          onChangeText={(text) => {
            setNewPassword(text);
            setPasswordError('');
          }}
          style={[styles.input, isDarkMode && styles.inputDark]}
        />
      </View>
      <View style={styles.inputContainer}>
        <LockKeyhole size={24} color={isDarkMode ? "white" : "black"} style={styles.inputIcon} />
        <Input
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setPasswordError('');
          }}
          secureTextEntry
          style={[styles.input, isDarkMode && styles.inputDark]}
        />
      </View>
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
      <TouchableHighlight
        onPress={handlePasswordChange}
        style={[styles.button, isDarkMode && styles.buttonDark]}
        underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
      >
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableHighlight>
    </ScrollView>
  );

  const renderVisibilitySettings = () => renderPopup(
    <ScrollView contentContainerStyle={styles.popupScrollContent}>
      <View style={styles.popupHeader}>
        <TouchableOpacity
          style={styles.popupbackButton}
          onPress={closeVisibilitySettings}
        >
          <ChevronLeft size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.popupTitle, isDarkMode && styles.popupTitleDark]}>Visibility Settings</Text>
      </View>

      <View style={styles.visibilitySettingsContent}>
        <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
          <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Visibility Mode</Text>
          <View style={styles.visibilityToggleContainer}>
            <Switch
              value={visibilityMode === 'global'}
              onValueChange={toggleVisibilityMode}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={visibilityMode === 'global' ? "#5c2a4f" : "#ffffff"}
            />
            <Text style={[styles.visibilityModeText, isDarkMode && styles.visibilityModeTextDark]}>
              {visibilityMode === 'global' ? 'Global' : 'Friends Only'}
            </Text>
          </View>
          <Text style={[styles.visibilityDescription, isDarkMode && styles.visibilityDescriptionDark]}>
            {visibilityMode === 'global'
              ? 'You are visible to friends and players in your league'
              : 'You are only visible to your friends'}
          </Text>
        </View>

        <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
          <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Location Active</Text>
          <View style={styles.visibilityToggleContainer}>
            <Switch
              value={locActive}
              onValueChange={toggleLocActive}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={locActive ? "#5c2a4f" : "#ffffff"}
            />
            <Text style={[styles.visibilityModeText, isDarkMode && styles.visibilityModeTextDark]}>
              {locActive ? 'On' : 'Off'}
            </Text>
          </View>
          <Text style={[styles.visibilityDescription, isDarkMode && styles.visibilityDescriptionDark]}>
            {locActive
              ? 'Your location is being used to update your position on the map'
              : 'You are not visible to other players and your location is not being updated'}
          </Text>
        </View>

        <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
          <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Diffused Location</Text>
          <View style={styles.visibilityToggleContainer}>
            <Switch
              value={randomLocActive}
              onValueChange={toggleRandomLocActive}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={randomLocActive ? "#5c2a4f" : "#ffffff"}
            />
            <Text style={[styles.visibilityModeText, isDarkMode && styles.visibilityModeTextDark]}>
              {randomLocActive ? 'On' : 'Off'}
            </Text>
          </View>
          <Text style={[styles.visibilityDescription, isDarkMode && styles.visibilityDescriptionDark]}>
            {randomLocActive
              ? 'Your location is diffused, making it less precise'
              : 'Your location is accurate'}
          </Text>
        </View>
        {renderImagePreferenceToggle()}
      </View>
    </ScrollView>
  );

  const renderNotificationSettings = () => renderPopup(
    <ScrollView contentContainerStyle={styles.popupScrollContent}>
      <View style={styles.popupHeader}>
        <TouchableOpacity
          style={styles.popupbackButton}
          onPress={closeNotificationSettings}
        >
          <ChevronLeft size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.popupTitle, isDarkMode && styles.popupTitleDark]}>Notification Settings</Text>
      </View>

      {Object.entries(notificationSettings).map(([key, value]) => {
        // Skip 'id' and 'userId' options
        if (key === 'id' || key === 'userId') return null;

        const title = key.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
        const description = notificationDescriptions[key as keyof typeof notificationDescriptions];

        return (
          <View key={key} style={[styles.notificationSettingItem, isDarkMode && styles.notificationSettingItemDark]}>
            <View style={styles.notificationSettingTextContainer}>
              <Text style={[styles.notificationSettingText, isDarkMode && styles.notificationSettingTextDark]}>
                {title}
              </Text>
              <Text style={[styles.notificationSettingDescription, isDarkMode && styles.notificationSettingDescriptionDark]}>
                {description}
              </Text>
            </View>
            <Switch
              value={value}
              onValueChange={() => toggleNotificationSetting(key as keyof typeof notificationSettings)}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={value ? "#5c2a4f" : "#ffffff"}
            />
          </View>
        );
      })}
    </ScrollView>
  );

  const renderCredits = () => renderPopup(
    <ScrollView contentContainerStyle={styles.popupScrollContent}>
      <View style={styles.popupHeader}>
        <TouchableOpacity
          style={styles.popupbackButton}
          onPress={() => closePopup(setShowCredits)}
        >
          <ChevronLeft size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text style={[styles.popupTitle, isDarkMode && styles.popupTitleDark]}>Credits</Text>
      </View>

      <View style={styles.creditsContent}>
        <Text style={[styles.creditsSubtitle, isDarkMode && styles.creditsSubtitleDark]}>
          This game was developed by One Studio One Game, LLC
        </Text>
        <Text style={[styles.creditsSectionTitle, isDarkMode && styles.creditsSectionTitleDark]}>Lead Developers:</Text>
        <View style={styles.creditsList}>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Tristan</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Clxud</Text>
        </View>
        <Text style={[styles.creditsSectionTitle, isDarkMode && styles.creditsSectionTitleDark]}>Frontend Developers:</Text>
        <View style={styles.creditsList}>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Tristan</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>NightSpark</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>TheVin</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Luc</Text>
        </View>

        <Text style={[styles.creditsSectionTitle, isDarkMode && styles.creditsSectionTitleDark]}>Backend Developers:</Text>
        <View style={styles.creditsList}>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Tristan</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Clxud</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>SwissArmywrench</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>manaf941</Text>
        </View>

        <Text style={[styles.creditsSectionTitle, isDarkMode && styles.creditsSectionTitleDark]}>Concept & UI work:</Text>
        <View style={styles.creditsList}>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Gubb0</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>ryaaab</Text>
        </View>

        <Text style={[styles.creditsSectionTitle, isDarkMode && styles.creditsSectionTitleDark]}>Staff:</Text>
        <View style={styles.creditsList}>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Sophie</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>ToxicSans</Text>
          <Text style={[styles.creditsText, isDarkMode && styles.creditsTextDark]}>Nero</Text>
        </View>
        <TouchableOpacity
          style={[styles.donateButton, isDarkMode && styles.donateButtonDark]}
          onPress={() => Linking.openURL('https://donate.stripe.com/fZe6r884h6e59Ww288')}
        >
          <Heart size={20} color="#FFFFFF" style={styles.donateIcon} />
          <Text style={styles.donateButtonText}>Donate to support the game!</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

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

  const renderPurchaseOptions = () => {
    if (!offerings || offerings.length === 0) return null;
  
    return (
      <Card title="In-App Purchases" icon={<Star size={24} color={isDarkMode ? "white" : "black"} />}>
        {offerings.map((pkg: PurchasesPackage) => (
          <TouchableHighlight
            key={pkg.identifier}
            onPress={() => handlePurchase(pkg)}
            style={[styles.button, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>
                {pkg.packageType === PACKAGE_TYPE.LIFETIME ? 'Buy ' : 'Subscribe to '}
                {pkg.product.title} - {pkg.product.priceString}
              </Text>
            </View>
          </TouchableHighlight>
        ))}
      </Card>
    );
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={isDarkMode ? "#4CAF50" : "#007AFF"} />
          </TouchableOpacity>
          <Text style={[styles.title, isDarkMode && styles.titleDark]}>Settings</Text>
        </View>

        <View style={styles.settingsContainer}>
          <TouchableOpacity
            style={[styles.settingsItem, isDarkMode && styles.settingsItemDark]}
            onPress={() => setShowAccountDetails(true)}
          >
            <Text style={[styles.settingsItemText, isDarkMode && styles.settingsItemTextDark]}>Account Details</Text>
            <ChevronRight size={24} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, isDarkMode && styles.settingsItemDark]}
            onPress={() => setShowVisibilitySettings(true)}
          >
            <Text style={[styles.settingsItemText, isDarkMode && styles.settingsItemTextDark]}>Visibility</Text>
            <ChevronRight size={24} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, isDarkMode && styles.settingsItemDark]}
            onPress={() => setShowNotificationSettings(true)}
          >
            <Text style={[styles.settingsItemText, isDarkMode && styles.settingsItemTextDark]}>Notification Settings</Text>
            <ChevronRight size={24} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsItem, isDarkMode && styles.settingsItemDark]}
            onPress={() => setShowCredits(true)}
          >
            <Text style={[styles.settingsItemText, isDarkMode && styles.settingsItemTextDark]}>Credits</Text>
            <ChevronRight size={24} color={isDarkMode ? "white" : "black"} />
          </TouchableOpacity>

            <Card title="App Icon" icon={<Shield size={24} color={isDarkMode ? "white" : "black"} />}>
              <AppIconChanger />
            </Card>

          {renderPurchaseOptions()}

          <Card title="Community & Feedback" icon={<MessageCircle size={24} color={isDarkMode ? "white" : "black"} />}>
            <TouchableHighlight
              onPress={handleJoinDiscord}
              style={[styles.button, isDarkMode && styles.buttonDark]}
              underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Join our Discord Community</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight
            onPress={handleRateApp}
            style={[styles.button, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
          >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Rate and Review Our App!</Text>
              </View>
            </TouchableHighlight>
            <TouchableHighlight
            onPress={() => Linking.openURL('https://donate.stripe.com/fZe6r884h6e59Ww288')}
            style={[styles.button, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
          >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Donate to support the game!</Text>
              </View>
            </TouchableHighlight>
          </Card>

          <TouchableHighlight
            onPress={handleLogout}
            style={[styles.button, styles.signOutButton, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
          >
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableHighlight>

          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://website.missilewars.dev/privacypolicy')}>
              <Text style={[styles.footerLinkText, isDarkMode && styles.footerLinkTextDark]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerLinkText, isDarkMode && styles.footerLinkTextDark]}> | </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}>
              <Text style={[styles.footerLinkText, isDarkMode && styles.footerLinkTextDark]}>
                Contact Support
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerLinkText, isDarkMode && styles.footerLinkTextDark]}> | </Text>
            <TouchableOpacity onPress={() => setShowDeleteModal(true)}>
              <Text style={[styles.footerLinkText, styles.deleteAccountText, isDarkMode && styles.deleteAccountTextDark]}>
                Delete Account
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Delete Account</Text>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>
                This action cannot be undone. Please enter your username to confirm.
              </Text>
              <Input
                placeholder="Enter your username"
                value={deleteAccountUsername}
                onChangeText={setDeleteAccountUsername}
                style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
              />
              <View style={styles.modalButtons}>
                <TouchableHighlight
                  onPress={() => setShowDeleteModal(false)}
                  style={[styles.modalButton, styles.cancelButton]}
                  underlayColor="#DDDDDD"
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableHighlight>
                <TouchableHighlight
                  onPress={handleDeleteAccount}
                  style={[styles.modalButton, styles.confirmDeleteButton]}
                  underlayColor="#FF0000"
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        </Modal>

        {showAccountDetails && renderAccountDetails()}
        {showVisibilitySettings && renderVisibilitySettings()}
        {showNotificationSettings && renderNotificationSettings()}
        {showCredits && renderCredits()}
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  safeAreaDark: {
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginLeft: 10,
  },
  titleDark: {
    color: '#FFF',
  },
  settingsContainer: {
    width: width * 0.9,
    alignItems: 'center',
  },
  settingGroup: {
    width: width * 1,
    marginBottom: 20,
  },
  errorText: {
    color: '#e53e3e',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#773765',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  buttonDark: {
    backgroundColor: '#5c2a4f',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    height: 40,
    width: '50%',
    marginTop: 20,
    marginBottom: 20,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugMenu: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  debugMenuDark: {
    backgroundColor: '#2C2C2C',
  },
  debugMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  debugMenuTitleDark: {
    color: '#FFF',
  },
  debugMenuItem: {
    marginBottom: 10,
  },
  debugMenuLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  debugMenuLabelDark: {
    color: '#B0B0B0',
  },
  debugMenuValue: {
    fontSize: 14,
    color: '#333',
  },
  debugMenuValueDark: {
    color: '#FFF',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copyButton: {
    backgroundColor: '#007AFF',
    padding: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  copyButtonText: {
    color: '#FFF',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  modalText: {
    marginBottom: 15,
    color: '#666',
    textAlign: 'center',
  },
  modalTextDark: {
    color: '#B0B0B0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6C757D',
  },
  confirmDeleteButton: {
    backgroundColor: '#DC3545',
  },
  confirmButton: {
    backgroundColor: '#28A745',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalInput: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modalInputDark: {
    borderColor: '#555',
    color: '#FFF',
    backgroundColor: '#3C3C3C',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  footerLinkText: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 5,
  },
  footerLinkTextDark: {
    color: '#B0B0B0',
  },
  deleteAccountText: {
    color: '#DC3545',
  },
  deleteAccountTextDark: {
    color: '#FF6B6B',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  settingsItemDark: {
    backgroundColor: '#2C2C2C',
  },
  settingsItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  settingsItemTextDark: {
    color: '#FFF',
  },
  settingsPopup: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  settingsPopupDark: {
    backgroundColor: '#2C2C2C',
  },
  popupScrollContent: {
    padding: 20,
  },
  popupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40, // Add some top margin to move the header down
  },
  popupbackButton: {
    padding: 10,
    marginRight: 10,
  },
  popupTitle: {
    fontSize: 24, // Increased font size
    fontWeight: 'bold',
    color: '#2d3748',
  },
  popupTitleDark: {
    color: '#FFF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    overflow: 'hidden',
  },
  inputIcon: {
    padding: 15,
    width: 54,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
  },
  inputDark: {
    color: '#FFF',
    backgroundColor: '#3C3C3C',
  },
  visibilitySettingsContent: {
    width: '100%',
  },
  visibilityContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  visibilityContainerDark: {
    backgroundColor: 'transparent',
  },
  visibilityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
  },
  visibilityTextDark: {
    color: '#FFF',
  },
  visibilityToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  visibilityModeText: {
    fontSize: 16,
    color: '#4a5568',
    marginLeft: 10,
  },
  visibilityModeTextDark: {
    color: '#B0B0B0',
  },
  notificationSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '100%',
  },
  notificationSettingItemDark: {
    backgroundColor: '#2C2C2C',
  },
  notificationSettingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  notificationSettingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 5,
  },
  notificationSettingTextDark: {
    color: '#FFF',
  },
  notificationSettingDescription: {
    fontSize: 14,
    color: '#4a5568',
  },
  notificationSettingDescriptionDark: {
    color: '#B0B0B0',
  },
  creditsContent: {
    width: '100%',
    paddingHorizontal: 20,
  },
  creditsSubtitle: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 20,
    textAlign: 'center',
  },
  creditsSubtitleDark: {
    color: '#B0B0B0',
  },
  creditsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2d3748',
    marginTop: 15,
    marginBottom: 10,
  },
  creditsSectionTitleDark: {
    color: '#FFF',
  },
  creditsList: {
    marginLeft: 10,
    marginBottom: 20,
  },
  creditsText: {
    fontSize: 16,
    color: '#4a5568',
    marginBottom: 5,
  },
  creditsTextDark: {
    color: '#B0B0B0',
  },
  visibilityDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 5,
  },
  visibilityDescriptionDark: {
    color: '#B0B0B0',
  },
  donateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#773765',
    borderRadius: 10,
    padding: 15,
    marginTop: 20,
  },
  donateButtonDark: {
    backgroundColor: '#5c2a4f',
  },
  donateIcon: {
    marginRight: 10,
  },
  donateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmationContainer: {
    marginTop: 10,
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  confirmationText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  confirmationTextDark: {
    color: '#B0B0B0',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  confirmationButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  confirmationButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 15,
    padding: 4,
    position: 'relative',
    marginVertical: 10,
    width: '100%',
  },
  toggleOption: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  toggleOptionDark: {
    backgroundColor: 'transparent',
  },
  toggleOptionActive: {
    backgroundColor: 'transparent',
  },
  toggleOptionActiveDark: {
    backgroundColor: 'transparent',
  },
  toggleOptionIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  toggleOptionLabel: {
    fontSize: 10,
    color: '#4A5568',
    fontWeight: '600',
    textAlign: 'center',
  },
  toggleOptionLabelActive: {
    color: '#FFFFFF',
  },
  toggleOptionLabelDark: {
    color: '#B0B0B0',
  },
  toggleIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: 12,
    zIndex: 0,
  },
});

export default SettingsPage;