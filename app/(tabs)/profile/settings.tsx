import React, { useState, useEffect } from 'react';
import {
  Alert, Linking, Platform, DevSettings,
  View, Text, ScrollView, Pressable, Switch as RNSwitch,
  StyleSheet, useColorScheme, ActionSheetIOS,
} from 'react-native';
import { Stack, router } from 'expo-router';
import {
  FieldGroup,
  Switch,
  Button,
  Text as UIText,
  BottomSheet,
  TextInput,
  useNativeState,
  Column,
  ScrollView as UIScrollView,
} from '@expo/ui';
import {
  User, Smartphone, Bell, MessageSquare, Star, Heart,
  Info, Shield, FileText, HelpCircle, LogOut, Trash2,
  ChevronRight, ExternalLink, Palette,
} from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeEmail, changePassword, changeUsername, deleteAcc } from '../../../api/changedetails';
import { updateFriendsOnlyStatus } from '../../../api/visibility';
import { updatelocActive, getlocActive, getRandomLocation, randomLocation } from '../../../api/locationOptions';
import { useAuth } from '../../../util/Context/authcontext';
import AppIconChanger from '../../../components/appiconchanger';
import * as StoreReview from 'expo-store-review';
import { getNotificationPreferences, updateNotificationPreferences } from '../../../api/notifications';

const IMAGE_PREFERENCES = [
  { label: '🚀  Default', value: 'default' },
  { label: '🥕  Fruit & Veg', value: 'fruitandveg' },
  { label: '🎃  Halloween', value: 'halloween' },
];

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [visibilityMode, setVisibilityMode] = useState<'friends' | 'global'>('global');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [locActive, setLocActive] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { signOut } = useAuth();
  const [showAccountDetails, setShowAccountDetails] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    incomingEntities: false,
    entityDamage: false,
    entitiesInAirspace: false,
    eliminationReward: false,
    lootDrops: false,
    friendRequests: false,
    leagues: false,
  });
  const [randomLocActive, setRandomLocActive] = useState(false);
  const [isConfirmingEmail, setIsConfirmingEmail] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [imagePreference, setImagePreference] = useState('default');

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? '#4CAF50' : '#773765';

  const usernameInput = useNativeState('');
  const emailInput = useNativeState('');
  const newPasswordInput = useNativeState('');
  const confirmPasswordInput = useNativeState('');
  const deleteUsernameInput = useNativeState('');

  const notificationLabels: Record<string, string> = {
    incomingEntities: 'Incoming Entities',
    entityDamage: 'Entity Damage',
    entitiesInAirspace: 'Entities in Airspace',
    eliminationReward: 'Elimination Reward',
    lootDrops: 'Loot Drops',
    friendRequests: 'Friend Requests',
    leagues: 'League Updates',
  };

  useEffect(() => {
    loadUserData();
    loadSettings();
    fetchLocActiveStatus();
    fetchNotificationPreferences();
    fetchRandomLocActiveStatus();
  }, []);

  useEffect(() => { usernameInput.value = username; }, [username]);
  useEffect(() => { emailInput.value = email; }, [email]);

  const loadUserData = async () => {
    const storedUsername = await SecureStore.getItemAsync('username');
    const storedEmail = await SecureStore.getItemAsync('email');
    setUsername(storedUsername || '');
    setEmail(storedEmail || '');
  };

  const loadSettings = async () => {
    const storedMode = await AsyncStorage.getItem('visibilitymode');
    if (storedMode) setVisibilityMode(storedMode as 'friends' | 'global');
    const pref = await AsyncStorage.getItem('imagepref');
    setImagePreference(pref || 'default');
  };

  const fetchLocActiveStatus = async () => {
    setIsLoading(true);
    const status = await getlocActive().catch((e) => {
      console.error('Failed to fetch locActive:', e);
      return undefined;
    });
    if (status !== undefined) {
      setLocActive(status);
    }
    setIsLoading(false);
  };

  const fetchRandomLocActiveStatus = async () => {
    try {
      setRandomLocActive(await getRandomLocation());
    } catch (e) {
      console.error('Failed to fetch randomLocActive:', e);
    }
  };

  const fetchNotificationPreferences = async () => {
    try {
      setNotificationSettings(await getNotificationPreferences());
    } catch (e) {
      console.error('Failed to fetch notification preferences:', e);
    }
  };

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const validateUsername = (v: string) => v.length >= 3 && /^[a-zA-Z0-9]+$/.test(v);
  const validatePassword = (v: string) =>
    v.length >= 8 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v);

  const handleUsernameChange = async () => {
    const val = usernameInput.value;
    setUsernameError('');
    if (!validateUsername(val)) {
      setUsernameError('At least 3 chars, letters and numbers only');
      return;
    }
    Alert.alert('Confirm', `Change username to "${val}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await changeUsername(val);
            await SecureStore.setItemAsync('username', val);
            setUsername(val);
            Alert.alert('Success', 'Username changed successfully');
          } catch {
            Alert.alert('Error', 'Failed to change username. Please try again.');
          }
        },
      },
    ]);
  };

  const handleEmailChange = () => {
    const val = emailInput.value;
    setEmailError('');
    if (!validateEmail(val)) {
      setEmailError('Invalid email address');
      return;
    }
    setPendingEmail(val);
    setIsConfirmingEmail(true);
  };

  const confirmEmailChange = async () => {
    try {
      await changeEmail(pendingEmail);
      await SecureStore.setItemAsync('email', pendingEmail);
      setIsConfirmingEmail(false);
      Alert.alert('Success', 'Email changed. Please sign in again.');
      handleLogout();
    } catch {
      Alert.alert('Error', 'Failed to change email. Please try again.');
    }
  };

  const handlePasswordChange = async () => {
    const password = newPasswordInput.value;
    const confirm = confirmPasswordInput.value;
    setPasswordError('');
    if (password !== confirm) { setPasswordError('Passwords do not match'); return; }
    if (!validatePassword(password)) {
      setPasswordError('8+ chars with upper, lower, number, and special character');
      return;
    }
    Alert.alert('Confirm', 'Change your password?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await changePassword(password);
            newPasswordInput.value = '';
            confirmPasswordInput.value = '';
            Alert.alert('Success', 'Password changed successfully');
          } catch {
            Alert.alert('Error', 'Failed to change password. Please try again.');
          }
        },
      },
    ]);
  };

  const toggleVisibilityMode = async () => {
    const newMode = visibilityMode === 'friends' ? 'global' : 'friends';
    if (newMode === 'global') {
      Alert.alert('Change to Global?', 'Everyone will be able to see your location.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setVisibilityMode('global');
            await AsyncStorage.setItem('visibilitymode', 'global');
            await updateFriendsOnlyStatus(false);
          },
        },
      ]);
    } else {
      setVisibilityMode('friends');
      await AsyncStorage.setItem('visibilitymode', 'friends');
      updateFriendsOnlyStatus(true);
    }
  };

  const toggleLocActive = async () => {
    const next = !locActive;
    setLocActive(next);
    await updatelocActive(next);
    Alert.alert(
      next ? 'Location Activated' : 'Location Deactivated',
      next ? 'Your location is now being shared.' : 'Your location will no longer be shared.',
      [{ text: 'OK' }],
    );
  };

  const toggleRandomLocActive = async () => {
    const next = !randomLocActive;
    setRandomLocActive(next);
    try {
      await randomLocation(next);
      Alert.alert(
        next ? 'Diffused Location On' : 'Diffused Location Off',
        next ? 'Your location will be diffused.' : 'Your location will be accurate.',
        [{ text: 'OK' }],
      );
    } catch {
      setRandomLocActive(!next);
      Alert.alert('Error', 'Failed to update location setting.');
    }
  };

  const handleLogout = async () => {
    // signOut emits APP_RELAUNCH_EVENT; the root layout restarts the shell
    // (splash → onboarding → login), so no navigation is needed here.
    await signOut();
  };

  const handleDeleteAccount = async () => {
    if (deleteUsernameInput.value !== username) {
      Alert.alert('Error', 'Username does not match.');
      return;
    }
    try {
      const result = await deleteAcc(username);
      if (result.success) {
        Alert.alert('Account Deleted', result.message, [{
          text: 'OK',
          onPress: async () => { await handleLogout(); },
        }]);
      } else {
        Alert.alert('Error', result.message);
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
    setShowDeleteModal(false);
  };

  const handleRateApp = async () => {
    if (await StoreReview.hasAction()) {
      StoreReview.requestReview();
    } else {
      Linking.openURL(
        Platform.OS === 'ios'
          ? 'https://apps.apple.com/app/missile-wars-revival/id6590602456'
          : 'https://play.google.com/store/apps/details?id=com.longtimenoc.missilewars',
      );
    }
  };

  const toggleNotificationSetting = async (key: keyof typeof notificationSettings) => {
    const next = { ...notificationSettings, [key]: !notificationSettings[key] };
    try {
      setNotificationSettings(await updateNotificationPreferences(next));
    } catch {
      Alert.alert('Error', 'Failed to update notification preference.');
    }
  };

  const handleImagePreferenceChange = async (val: string) => {
    try {
      await AsyncStorage.setItem('imagepref', val);
      setImagePreference(val);
      Alert.alert('Theme Updated', 'The app will restart to apply the new theme.', [{
        text: 'OK',
        onPress: () => {
          router.replace('/');
          setTimeout(() => {
            if (__DEV__) {
              DevSettings.reload();
            } else {
              Updates.reloadAsync().catch(console.error);
            }
          }, 100);
        },
      }]);
    } catch {
      Alert.alert('Error', 'Failed to save preference.');
    }
  };

  const showImagePicker = () => {
    const options = [...IMAGE_PREFERENCES.map(p => p.label), 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, title: 'Image Theme' },
        (i) => { if (i < IMAGE_PREFERENCES.length) handleImagePreferenceChange(IMAGE_PREFERENCES[i].value); },
      );
    } else {
      Alert.alert('Image Theme', 'Select a theme', [
        ...IMAGE_PREFERENCES.map(p => ({ text: p.label, onPress: () => handleImagePreferenceChange(p.value) })),
        { text: 'Cancel', style: 'cancel' as const },
      ]);
    }
  };

  const imagePrefLabel = IMAGE_PREFERENCES.find(p => p.value === imagePreference)?.label ?? '🚀  Default';

  const s = styles(isDark);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Settings',
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: isDark ? '#000' : '#F2F2F7' },
          headerTintColor: isDark ? '#fff' : '#773765',
          headerTitleStyle: { color: isDark ? '#fff' : '#000', fontWeight: '600' },
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={s.container} contentContainerStyle={s.content}>

        {/* ── Account ───────────────────────────────────────── */}
        <Text style={s.sectionHeader}>ACCOUNT</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => setShowAccountDetails(true)}>
            <View style={[s.iconCircle, { backgroundColor: accent + '22' }]}>
              <User size={18} color={accent} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Account Details</Text>
              <Text style={s.rowSub}>Username, email, password</Text>
            </View>
            <ChevronRight size={16} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <View style={[s.iconCircle, { backgroundColor: accent + '22', marginRight: 12 }]}>
                <Smartphone size={18} color={accent} />
              </View>
              <Text style={s.rowTitle}>App Icon</Text>
            </View>
            <AppIconChanger />
          </View>
        </View>

        {/* ── Privacy & Location ────────────────────────────── */}
        <Text style={s.sectionHeader}>PRIVACY & LOCATION</Text>
        <View style={s.card}>
          <View style={s.row}>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Global Visibility</Text>
              <Text style={s.rowSub}>Everyone can see your location</Text>
            </View>
            <RNSwitch
              value={visibilityMode === 'global'}
              onValueChange={toggleVisibilityMode}
              trackColor={{ false: '#E5E5EA', true: accent }}
            />
          </View>
          <View style={s.sep} />
          <View style={s.row}>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Location Active</Text>
              <Text style={s.rowSub}>Share your position on the map</Text>
            </View>
            <RNSwitch
              value={locActive}
              onValueChange={toggleLocActive}
              disabled={isLoading}
              trackColor={{ false: '#E5E5EA', true: accent }}
            />
          </View>
          <View style={s.sep} />
          <View style={s.row}>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Diffused Location</Text>
              <Text style={s.rowSub}>Randomise your reported position</Text>
            </View>
            <RNSwitch
              value={randomLocActive}
              onValueChange={toggleRandomLocActive}
              trackColor={{ false: '#E5E5EA', true: accent }}
            />
          </View>
        </View>

        {/* ── Notifications ─────────────────────────────────── */}
        <Text style={s.sectionHeader}>NOTIFICATIONS</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => setShowNotificationSettings(true)}>
            <View style={[s.iconCircle, { backgroundColor: accent + '22' }]}>
              <Bell size={18} color={accent} />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Notification Settings</Text>
              <Text style={s.rowSub}>Customise push notifications</Text>
            </View>
            <ChevronRight size={16} color="#C7C7CC" />
          </Pressable>
        </View>

        {/* ── Image Theme ───────────────────────────────────── */}
        <Text style={s.sectionHeader}>IMAGE THEME</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={showImagePicker}>
            <View style={[s.iconCircle, { backgroundColor: '#FF950022' }]}>
              <Palette size={18} color="#FF9500" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Theme</Text>
              <Text style={s.rowSub}>{imagePrefLabel}</Text>
            </View>
            <ChevronRight size={16} color="#C7C7CC" />
          </Pressable>
        </View>

        {/* ── Community & Support ───────────────────────────── */}
        <Text style={s.sectionHeader}>COMMUNITY & SUPPORT</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}>
            <View style={[s.iconCircle, { backgroundColor: '#5865F222' }]}>
              <MessageSquare size={18} color="#5865F2" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Join our Discord</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={handleRateApp}>
            <View style={[s.iconCircle, { backgroundColor: '#FF950022' }]}>
              <Star size={18} color="#FF9500" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Rate the App</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => Linking.openURL('https://donate.stripe.com/fZe6r884h6e59Ww288')}>
            <View style={[s.iconCircle, { backgroundColor: '#FF2D5522' }]}>
              <Heart size={18} color="#FF2D55" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Donate to Support Us</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
        </View>

        {/* ── Legal & Info ──────────────────────────────────── */}
        <Text style={s.sectionHeader}>LEGAL & INFO</Text>
        <View style={s.card}>
          <Pressable style={s.row} onPress={() => setShowCredits(true)}>
            <View style={[s.iconCircle, { backgroundColor: '#007AFF22' }]}>
              <Info size={18} color="#007AFF" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Credits</Text>
            </View>
            <ChevronRight size={16} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => Linking.openURL('https://www.oakforgestudios.co.uk/missilewars/privacy-policy')}>
            <View style={[s.iconCircle, { backgroundColor: '#007AFF22' }]}>
              <Shield size={18} color="#007AFF" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Privacy Policy</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}>
            <View style={[s.iconCircle, { backgroundColor: '#007AFF22' }]}>
              <FileText size={18} color="#007AFF" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>EULA Agreement</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => Linking.openURL('https://discord.gg/Gk8jqUnVd3')}>
            <View style={[s.iconCircle, { backgroundColor: '#007AFF22' }]}>
              <HelpCircle size={18} color="#007AFF" />
            </View>
            <View style={s.rowBody}>
              <Text style={s.rowTitle}>Contact Support</Text>
            </View>
            <ExternalLink size={14} color="#C7C7CC" />
          </Pressable>
        </View>

        {/* ── Danger Zone ───────────────────────────────────── */}
        <View style={[s.card, { marginTop: 8 }]}>
          <Pressable style={s.row} onPress={handleLogout}>
            <View style={[s.iconCircle, { backgroundColor: '#FF3B3022' }]}>
              <LogOut size={18} color="#FF3B30" />
            </View>
            <View style={s.rowBody}>
              <Text style={{ fontSize: 16, color: '#FF3B30' }}>Sign Out</Text>
            </View>
          </Pressable>
          <View style={s.sep} />
          <Pressable style={s.row} onPress={() => setShowDeleteModal(true)}>
            <View style={[s.iconCircle, { backgroundColor: '#FF3B3022' }]}>
              <Trash2 size={18} color="#FF3B30" />
            </View>
            <View style={s.rowBody}>
              <Text style={{ fontSize: 16, color: '#FF3B30' }}>Delete Account</Text>
            </View>
          </Pressable>
        </View>

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Account Details Sheet ─────────────────────────── */}
      <BottomSheet
        isPresented={showAccountDetails}
        onDismiss={() => {
          setShowAccountDetails(false);
          setIsConfirmingEmail(false);
          setUsernameError('');
          setEmailError('');
          setPasswordError('');
        }}
        snapPoints={['full']}
      >
        <UIScrollView>
          <Column style={{ padding: 24 }}>
            <UIText textStyle={{ fontSize: 28, fontWeight: '700' }} style={{ paddingBottom: 28 }}>
              Account Details
            </UIText>

            <UIText textStyle={{ fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 }} style={{ paddingBottom: 6 }}>
              USERNAME
            </UIText>
            <TextInput
              value={usernameInput}
              placeholder="Username"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ paddingBottom: usernameError ? 4 : 12 }}
            />
            {!!usernameError && (
              <UIText textStyle={{ fontSize: 13, color: '#FF3B30' }} style={{ paddingBottom: 12 }}>
                {usernameError}
              </UIText>
            )}
            <Button label="Change Username" onPress={handleUsernameChange} style={{ paddingBottom: 28 }} />

            <UIText textStyle={{ fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 }} style={{ paddingBottom: 6 }}>
              EMAIL
            </UIText>
            <TextInput
              value={emailInput}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={{ paddingBottom: emailError ? 4 : 12 }}
            />
            {!!emailError && (
              <UIText textStyle={{ fontSize: 13, color: '#FF3B30' }} style={{ paddingBottom: 12 }}>
                {emailError}
              </UIText>
            )}
            {isConfirmingEmail ? (
              <Column style={{ paddingBottom: 28 }}>
                <UIText textStyle={{ fontSize: 14, color: '#8E8E93' }} style={{ paddingBottom: 16 }}>
                  {`Change your email to ${pendingEmail}? You will be signed out.`}
                </UIText>
                <Column spacing={10}>
                  <Button label="Confirm Email Change" onPress={confirmEmailChange} />
                  <Button label="Cancel" variant="outlined" onPress={() => setIsConfirmingEmail(false)} />
                </Column>
              </Column>
            ) : (
              <Button label="Change Email" onPress={handleEmailChange} style={{ paddingBottom: 28 }} />
            )}

            <UIText textStyle={{ fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5 }} style={{ paddingBottom: 6 }}>
              PASSWORD
            </UIText>
            <TextInput
              value={newPasswordInput}
              placeholder="New Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{ paddingBottom: 8 }}
            />
            <TextInput
              value={confirmPasswordInput}
              placeholder="Confirm New Password"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{ paddingBottom: passwordError ? 4 : 12 }}
            />
            {!!passwordError && (
              <UIText textStyle={{ fontSize: 13, color: '#FF3B30' }} style={{ paddingBottom: 12 }}>
                {passwordError}
              </UIText>
            )}
            <Button label="Change Password" onPress={handlePasswordChange} style={{ paddingBottom: 40 }} />
          </Column>
        </UIScrollView>
      </BottomSheet>

      {/* ── Notification Settings Sheet ───────────────────── */}
      <BottomSheet
        isPresented={showNotificationSettings}
        onDismiss={() => setShowNotificationSettings(false)}
        snapPoints={['full']}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: isDark ? '#fff' : '#000', marginBottom: 8 }}>
            Notifications
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', marginBottom: 24 }}>
            Choose which events send you a push notification.
          </Text>

          {(() => {
            const items = (Object.entries(notificationSettings) as [keyof typeof notificationSettings, boolean][])
              .filter(([key]) => key !== 'id' && key !== 'userId');

            if (items.length === 0) {
              return (
                <Text style={{ fontSize: 15, color: '#8E8E93', textAlign: 'center', marginTop: 32 }}>
                  No notification settings available.
                </Text>
              );
            }

            return (
              <View style={{ borderRadius: 12, overflow: 'hidden', backgroundColor: isDark ? '#1C1C1E' : '#fff' }}>
                {items.map(([key, value], index) => (
                  <View key={key}>
                    {index > 0 && (
                      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: isDark ? '#38383A' : '#C6C6C8', marginLeft: 16 }} />
                    )}
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, color: isDark ? '#fff' : '#000' }}>
                          {notificationLabels[key] ?? key}
                        </Text>
                      </View>
                      <RNSwitch
                        value={value}
                        onValueChange={() => toggleNotificationSetting(key)}
                        trackColor={{ false: '#E5E5EA', true: accent }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            );
          })()}
        </ScrollView>
      </BottomSheet>

      {/* ── Credits Sheet ─────────────────────────────────── */}
      <BottomSheet
        isPresented={showCredits}
        onDismiss={() => setShowCredits(false)}
        snapPoints={['full']}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
          showsHorizontalScrollIndicator={false}
          horizontal={false}
        >
          <Text style={{ fontSize: 28, fontWeight: '700', color: isDark ? '#fff' : '#000', marginBottom: 6 }}>
            Credits
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', marginBottom: 28 }}>
            Developed by One Studio One Game, LLC
          </Text>

          {[
            { title: 'Lead Developers', names: ['Tristan', 'Clxud'] },
            { title: 'Frontend Developers', names: ['Tristan', 'NightSpark', 'TheVin', 'Luc'] },
            { title: 'Backend Developers', names: ['Tristan', 'Clxud', 'SwissArmywrench', 'manaf941'] },
            { title: 'Concept & UI', names: ['Gubb0', 'ryaaab', 'arapeggio'] },
            { title: 'Staff', names: ['Sophie', 'ToxicSans', 'Nero'] },
          ].map(section => (
            <View key={section.title} style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#8E8E93', letterSpacing: 0.5, marginBottom: 8 }}>
                {section.title.toUpperCase()}
              </Text>
              {section.names.map(name => (
                <Text key={name} style={{ fontSize: 16, color: isDark ? '#fff' : '#000', marginBottom: 4 }}>
                  {name}
                </Text>
              ))}
            </View>
          ))}

          <Pressable
            onPress={() => Linking.openURL('https://donate.stripe.com/fZe6r884h6e59Ww288')}
            style={({ pressed }) => ({
              marginTop: 16,
              height: 50,
              borderRadius: 14,
              backgroundColor: accent,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
              ❤️  Donate to Support the Game
            </Text>
          </Pressable>
        </ScrollView>
      </BottomSheet>

      {/* ── Delete Account Sheet ──────────────────────────── */}
      <BottomSheet
        isPresented={showDeleteModal}
        onDismiss={() => { setShowDeleteModal(false); deleteUsernameInput.value = ''; }}
      >
        <Column style={{ padding: 24 }}>
          <UIText textStyle={{ fontSize: 22, fontWeight: '700', color: '#FF3B30' }} style={{ paddingBottom: 8 }}>
            Delete Account
          </UIText>
          <UIText textStyle={{ fontSize: 15, color: '#8E8E93' }} style={{ paddingBottom: 20 }}>
            This action cannot be undone. Type your username to confirm deletion.
          </UIText>
          <TextInput
            value={deleteUsernameInput}
            placeholder="Enter your username"
            autoCapitalize="none"
            autoCorrect={false}
            style={{ paddingBottom: 20 }}
          />
          <Column spacing={10} style={{ paddingBottom: 40 }}>
            <Button label="Permanently Delete Account" onPress={handleDeleteAccount} />
            <Button label="Cancel" variant="outlined" onPress={() => setShowDeleteModal(false)} />
          </Column>
        </Column>
      </BottomSheet>
    </>
  );
};

const styles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? '#000' : '#F2F2F7',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: isDark ? '#1C1C1E' : '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 54,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowBody: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    color: isDark ? '#fff' : '#000',
  },
  rowSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 1,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: isDark ? '#38383A' : '#C6C6C8',
    marginLeft: 60,
  },
});

export default SettingsPage;
