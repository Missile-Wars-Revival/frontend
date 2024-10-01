import React, { useState, useEffect } from 'react';
import { View, Text, TouchableHighlight, Switch, ScrollView, Alert, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from "../components/ui/input";
import { User, LockKeyhole, Mail, ChevronLeft } from "lucide-react-native";
import * as SecureStore from 'expo-secure-store';
import { changeEmail, changePassword, changeUsername, deleteAcc } from '../api/changedetails';
import { updateFriendsOnlyStatus } from '../api/visibility';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { updatelocActive, getlocActive } from '../api/locActive';
import * as Clipboard from 'expo-clipboard';
import { clearCredentials } from '../util/logincache';
import { useAuth } from '../util/Context/authcontext';
import * as Location from 'expo-location';

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
  const [isCopied, setIsCopied] = useState(false);
  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);
  const { setIsSignedIn } = useAuth();
  const [deleteAccountUsername, setDeleteAccountUsername] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadUserData();
    loadSettings();
    fetchLocActiveStatus();
    loadPreference();
  }, []);

  const loadUserData = async () => {
    const storedUsername = await SecureStore.getItemAsync('username');
    const storedEmail = await SecureStore.getItemAsync('email');
    const cachedNotificationToken = await SecureStore.getItemAsync('notificationToken');
    const cachedToken = await SecureStore.getItemAsync('token');
    setNotificationToken(cachedNotificationToken);
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

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const truncateToken = (token: string | null) => {
    if (!token) return 'No token';
    if (token.length <= 20) return token;
    return `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
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

  const handleEmailChange = async (email: string) => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Invalid email address');
      return;
    }
    Alert.alert(
      "Confirm Email Change",
      `Are you sure you want to change your email to "${email}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changeEmail(email);
              await SecureStore.setItemAsync('email', email);
              Alert.alert("Success", "Email changed successfully");
            } catch (error) {
              console.error("Error changing email:", error);
              Alert.alert("Error", "Failed to change email. Please try again.");
            }
          }
        }
      ]
    );
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

  const loadPreference = async () => {
    const preference = await AsyncStorage.getItem('useBackgroundLocation');
    setUseBackgroundLocation(preference === 'true');
  };

  const toggleBackgroundLocation = async () => {
    const newValue = !useBackgroundLocation;
    setUseBackgroundLocation(newValue);
    await Location.requestBackgroundPermissionsAsync()
    await AsyncStorage.setItem('useBackgroundLocation', newValue.toString());
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
    setShowDeleteModal(false);
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
        <TouchableHighlight 
          onPress={() => router.back()} 
          style={styles.backButton}
          underlayColor={isDarkMode ? '#3D3D3D' : '#E5E5E5'}
        >
          <View style={styles.backButtonContent}>
            <ChevronLeft size={24} color={isDarkMode ? "#4CAF50" : "#007AFF"} />
            <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>Back</Text>
          </View>
        </TouchableHighlight>
        
        <Text style={[styles.title, isDarkMode && styles.titleDark]}>Settings</Text>

        <View style={styles.settingsContainer}>
          <View style={styles.settingGroup}>
            <Input
              placeholder={username || "Username"}
              onChangeText={(text) => {
                setUsername(text);
                setUsernameError('');
              }}
              icon={
                <View style={styles.iconContainer}>
                  <User size={24} color={isDarkMode ? "white" : "black"} />
                </View>
              }
              style={[styles.input, isDarkMode && styles.inputDark]}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {usernameError ? (
              <Text style={styles.errorText}>{usernameError}</Text>
            ) : null}
            <TouchableHighlight 
              onPress={handleUsernameChange}
              style={[styles.button, isDarkMode && styles.buttonDark]}
              underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
            >
              <Text style={styles.buttonText}>Change Username</Text>
            </TouchableHighlight>

            <View style={styles.settingGroup}>
              <Input
                placeholder={email || "Email"}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                icon={
                  <View style={styles.iconContainer}>
                    <Mail size={24} color={isDarkMode ? "white" : "black"} />
                  </View>
                }
                style={[styles.input, isDarkMode && styles.inputDark]}
                className="w-[90vw] h-[5vh] rounded-[20px]"
              />
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
              <TouchableHighlight 
                onPress={() => handleEmailChange(email)}
                style={[styles.button, isDarkMode && styles.buttonDark]}
                underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
              >
                <Text style={styles.buttonText}>Change Email</Text>
              </TouchableHighlight>
            </View>

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
              icon={
                <View style={styles.iconContainer}>
                  <LockKeyhole size={24} color={isDarkMode ? "white" : "black"} />
                </View>
              }
              style={[styles.input, isDarkMode && styles.inputDark]}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <Input
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              icon={
                <View style={styles.iconContainer}>
                  <LockKeyhole size={24} color={isDarkMode ? "white" : "black"} />
                </View>
              }
              style={[styles.input, isDarkMode && styles.inputDark]}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
            <TouchableHighlight 
              onPress={handlePasswordChange}
              style={[styles.button, isDarkMode && styles.buttonDark]}
              underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
            >
              <Text style={styles.buttonText}>Change Password</Text>
            </TouchableHighlight>
          </View>

          <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
            <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Visibility Mode</Text>
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

          <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
            <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Location Active</Text>
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

          <View style={[styles.visibilityContainer, isDarkMode && styles.visibilityContainerDark]}>
            <Text style={[styles.visibilityText, isDarkMode && styles.visibilityTextDark]}>Background Location</Text>
            <Switch
              value={useBackgroundLocation}
              onValueChange={toggleBackgroundLocation}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={useBackgroundLocation ? "#5c2a4f" : "#ffffff"}
            />
            <Text style={[styles.visibilityModeText, isDarkMode && styles.visibilityModeTextDark]}>
              {useBackgroundLocation ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <TouchableHighlight 
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#5c2a4f' : '#662d60'}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableHighlight>

          <TouchableHighlight 
            onPress={() => setShowDeleteModal(true)}
            style={[styles.button, styles.deleteButton, isDarkMode && styles.buttonDark]}
            underlayColor={isDarkMode ? '#8B0000' : '#FF0000'}
          >
            <Text style={styles.buttonText}>Delete Account</Text>
          </TouchableHighlight>
        </View>

        <View style={[styles.debugMenu, isDarkMode && styles.debugMenuDark]}>
          <Text style={[styles.debugMenuTitle, isDarkMode && styles.debugMenuTitleDark]}>Debug Menu</Text>
          <View style={styles.debugMenuItem}>
            <Text style={[styles.debugMenuLabel, isDarkMode && styles.debugMenuLabelDark]}>Cached Username:</Text>
            <Text style={[styles.debugMenuValue, isDarkMode && styles.debugMenuValueDark]}>{username || 'Not set'}</Text>
          </View>
          <View style={styles.debugMenuItem}>
            <Text style={[styles.debugMenuLabel, isDarkMode && styles.debugMenuLabelDark]}>Cached Token:</Text>
            <View style={styles.tokenContainer}>
              <Text style={[styles.debugMenuValue, isDarkMode && styles.debugMenuValueDark]}>{truncateToken(token)}</Text>
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={() => token && copyToClipboard(token)}
              >
                <Text style={styles.copyButtonText}>
                  {isCopied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.debugMenuItem}>
            <Text style={[styles.debugMenuLabel, isDarkMode && styles.debugMenuLabelDark]}>Cached Notification Token:</Text>
            <View style={styles.tokenContainer}>
              <Text style={[styles.debugMenuValue, isDarkMode && styles.debugMenuValueDark]}>
                {truncateToken(notificationToken)}
              </Text>
              <TouchableOpacity 
                style={styles.copyButton} 
                onPress={() => notificationToken && copyToClipboard(notificationToken)}
              >
                <Text style={styles.copyButtonText}>
                  {isCopied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {showDeleteModal && (
          <View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
            <View style={[styles.modal, isDarkMode && styles.modalDark]}>
              <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Delete Account</Text>
              <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>
                This action cannot be undone. Please enter your username to confirm.
              </Text>
              <Input
                placeholder="Enter your username"
                value={deleteAccountUsername}
                onChangeText={setDeleteAccountUsername}
                style={[styles.input, isDarkMode && styles.inputDark]}
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
                  style={[styles.modalButton, styles.deleteButton]}
                  underlayColor="#FF0000"
                >
                  <Text style={styles.modalButtonText}>Delete</Text>
                </TouchableHighlight>
              </View>
            </View>
          </View>
        )}
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
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 20,
    marginTop: 20,
    padding: 10,
    borderRadius: 20,
  },
  backButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 5,
  },
  backButtonTextDark: {
    color: '#4CAF50',
  },
  iconContainer: {
    position: 'absolute',
    left: 1,
    top: 10,
    transform: [{ translateY: 2 }],
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 10,
    color: '#2d3748',
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
  input: {
    width: width * 1,
    height: 50,
    paddingLeft: 40,
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  inputDark: {
    color: '#FFF',
    paddingLeft: 40,
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
  },
  buttonDark: {
    backgroundColor: '#5c2a4f',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  visibilityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 10,
    width: width * 1,
    marginBottom: 15,
  },
  visibilityContainerDark: {
    backgroundColor: '#2C2C2C',
  },
  visibilityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  visibilityTextDark: {
    color: '#FFF',
  },
  visibilityModeText: {
    fontSize: 16,
    color: '#4a5568',
  },
  visibilityModeTextDark: {
    color: '#B0B0B0',
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
  logoutButton: {
    backgroundColor: '#e53e3e',
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#DC3545',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 20,
    width: '80%',
  },
  modalDark: {
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
  },
  modalTextDark: {
    color: '#B0B0B0',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  modalButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SettingsPage;