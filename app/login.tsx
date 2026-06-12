import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet, Dimensions, Alert, Text, Pressable, View, useColorScheme, Platform,
  TextInput as NativeTextInput,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Host, Column, FieldGroup, RNHostView, BottomSheet,
  TextInput,
  Text as UIText,
} from '@expo/ui';
import { Picker, Text as SwiftUIText } from '@expo/ui/swift-ui';
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../util/Context/authcontext';
import useLogin from '../hooks/api/useLogin';
import useRegister from '../hooks/api/useRegister';
import { saveCredentials } from '../util/logincache';
import { usePushNotifications } from '../components/Notifications/usePushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithApple, signInWithGoogle } from '../util/firebase/firebaseAuth';
import { oauthLogin } from '../api/oauthLogin';
import { requestPasswordReset, requestUsernameReminder, resetPassword } from '../api/changedetails';
import LoginSwirl from '../components/Animations/loginSwirl';
import ServerPicker from '../components/ServerPicker';
import { getlocation } from '../util/locationreq';

const IOS_CLIENT_ID = '199249539413-0og9o1srvoq381tajt844jraabb9pmf0.apps.googleusercontent.com';
const WEB_CLIENT_ID  = '199249539413-4ggab6ob709kii3sumthvi5olqf1g7p4.apps.googleusercontent.com';

function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </Svg>
  );
}

type Mode = 'login' | 'register';
type ForgotStep = 'email' | 'reset';

const { width, height } = Dimensions.get('window');
const INNER_WIDTH = width - 32;

export default function Auth() {
  const { expoPushToken } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? '';
  const { setIsSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const accent = isDark ? '#4CAF50' : '#773765';

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showSwirl, setShowSwirl] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotError, setForgotError] = useState('');

  const usernameRef = useRef<NativeTextInput>(null);
  const passwordRef = useRef<NativeTextInput>(null);
  const emailRef = useRef<NativeTextInput>(null);
  const confirmRef = useRef<NativeTextInput>(null);

  useEffect(() => { getlocation(); }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const finishOAuth = useCallback(async (idToken: string, displayName: string) => {
    try {
      const data = await oauthLogin(idToken, displayName, notificationToken);
      await saveCredentials(data.username, data.token, notificationToken);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      setShowSwirl(true);
    } catch {
      setError('Sign-in succeeded but account setup failed. Please try again.');
    }
  }, [notificationToken, setIsSignedIn]);

  const handleApple = useCallback(async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) {
        setError('Apple sign-in failed. Please try again.');
        return;
      }
      const derivedName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ').trim();
      const user = await signInWithApple(credential.identityToken, derivedName);
      await finishOAuth(user.idToken, user.displayName || derivedName);
    } catch (err: any) {
      if (err?.code === 'ERR_REQUEST_CANCELED' || err?.code === 'ERR_CANCELED') return;
      setError('Apple sign-in failed. Please try again.');
    }
  }, [finishOAuth]);

  const handleGoogle = useCallback(async () => {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const info = await GoogleSignin.signIn();
      const idToken = info.data?.idToken;
      if (!idToken) {
        setError('Google sign-in failed. Please try again.');
        return;
      }
      const user = await signInWithGoogle(idToken);
      await finishOAuth(user.idToken, user.displayName);
    } catch (err: any) {
      const code = err?.code;
      if (code === statusCodes.SIGN_IN_CANCELLED || code === 'SIGN_IN_CANCELLED') return;
      setError('Google sign-in failed. Please try again.');
    }
  }, [finishOAuth]);

  const switchMode = useCallback((newMode: Mode) => {
    if (newMode === mode) return;
    usernameRef.current?.clear();
    passwordRef.current?.clear();
    emailRef.current?.clear();
    confirmRef.current?.clear();
    setMode(newMode);
    setUsername('');
    setPassword('');
    setEmail('');
    setConfirmPassword('');
    setError('');
  }, [mode]);

  const loginMutation = useLogin(
    async (token) => {
      await saveCredentials(username, token, notificationToken);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      setShowSwirl(true);
    },
    () => setError('Invalid username or password'),
  );

  const registerMutation = useRegister(
    async (token) => {
      await saveCredentials(username, token, notificationToken);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      router.replace('/(tabs)');
    },
    () => setError('Registration failed. Please try again.'),
  );

  const validateRegister = useCallback((): boolean => {
    if (username.length < 3) { setError('Username must be at least 3 characters'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email'); return false; }
    if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(password)) {
      setError('Password needs 8+ chars with uppercase, lowercase, number and symbol');
      return false;
    }
    if (password !== confirmPassword) { setError('Passwords do not match'); return false; }
    return true;
  }, [username, email, password, confirmPassword]);

  const handleSubmit = useCallback(() => {
    setError('');
    if (mode === 'login') {
      loginMutation.mutate({ username, password, notificationToken });
    } else if (validateRegister()) {
      registerMutation.mutate({ username, email, password, notificationToken });
    }
  }, [mode, username, password, email, notificationToken, loginMutation, registerMutation, validateRegister]);

  const handleForgotRequest = async (type: 'username' | 'password') => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email');
      return;
    }
    try {
      if (type === 'username') {
        const response = await requestUsernameReminder(forgotEmail);
        Alert.alert('Username found', response.message || 'No username found for this email.');
      } else {
        await requestPasswordReset(forgotEmail);
        setForgotStep('reset');
        setForgotError('');
      }
    } catch {
      setForgotError(`Failed to recover ${type}. Please try again.`);
    }
  };

  const handleForgotReset = async () => {
    try {
      const result = await resetPassword(forgotEmail, forgotCode, forgotNewPassword);
      if (result.success) {
        setShowForgot(false);
        setForgotStep('email');
        setForgotEmail('');
        setForgotCode('');
        setForgotNewPassword('');
      } else {
        setForgotError(result.message);
      }
    } catch {
      setForgotError('Failed to reset password. Please try again.');
    }
  };

  const closeForgot = useCallback(() => {
    setShowForgot(false);
    setForgotStep('email');
    setForgotError('');
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <Image
        source={require('../assets/icons/MissleWarsTitle.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      {/* Form section — fully in React Native, no SwiftUI keyboard avoidance */}
      <View style={styles.formSection}>
        {/* Game-server picker (Phase 6 distributed hosting). Renders nothing
            unless EXPO_PUBLIC_COORDINATOR_URL is baked into the build. */}
        <View style={styles.serverPicker}>
          <ServerPicker />
        </View>

        {/* Native segmented control — tiny Host so SwiftUI avoidance affects nothing visible */}
        <Host style={styles.pickerHost}>
          <Picker
            selection={mode}
            onSelectionChange={(v) => switchMode(v as Mode)}
            modifiers={[pickerStyle('segmented')]}
          >
            <SwiftUIText modifiers={[tag('login')]}>Login</SwiftUIText>
            <SwiftUIText modifiers={[tag('register')]}>Register</SwiftUIText>
          </Picker>
        </Host>

        {/* Grouped text inputs */}
        <View style={[styles.fieldGroup, isDark && styles.fieldGroupDark]}>
          <NativeTextInput
            ref={usernameRef}
            style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Username"
            placeholderTextColor="#8e8e93"
            onChangeText={setUsername}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {mode === 'register' && (
            <>
              <View style={[styles.fieldSeparator, isDark && styles.fieldSeparatorDark]} />
              <NativeTextInput
                ref={emailRef}
                style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
                placeholder="Email"
                placeholderTextColor="#8e8e93"
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </>
          )}
          <View style={[styles.fieldSeparator, isDark && styles.fieldSeparatorDark]} />
          <NativeTextInput
            ref={passwordRef}
            style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
            placeholder="Password"
            placeholderTextColor="#8e8e93"
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {mode === 'register' && (
            <>
              <View style={[styles.fieldSeparator, isDark && styles.fieldSeparatorDark]} />
              <NativeTextInput
                ref={confirmRef}
                style={[styles.textInput, { color: isDark ? '#fff' : '#000' }]}
                placeholder="Confirm Password"
                placeholderTextColor="#8e8e93"
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          )}
        </View>

        {!!error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
      </View>

      {/* Let's Fight — immediately below form */}
      <View style={styles.submitContainer}>
        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            { backgroundColor: accent },
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.submitLabel}>
            {mode === 'login' ? "Let's Fight" : 'Create Account'}
          </Text>
        </Pressable>
      </View>

      {/* Social auth — right under Let's Fight */}
      <View style={styles.socialSection}>
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>
            or continue with
          </Text>
          <View style={styles.dividerLine} />
        </View>

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              mode === 'register'
                ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
                : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              isDark
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={14}
            style={styles.appleButton}
            onPress={handleApple}
          />
        )}

        <Pressable
          onPress={handleGoogle}
          style={({ pressed }) => [
            styles.googleButton,
            isDark && styles.googleButtonDark,
            pressed && styles.pressed,
          ]}
        >
          <GoogleLogo size={20} />
          <Text style={[styles.googleLabel, isDark && styles.googleLabelDark]}>
            Continue with Google
          </Text>
        </Pressable>
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Forgot — very bottom */}
      {mode === 'login' && (
        <Pressable onPress={() => setShowForgot(true)} style={styles.forgotButton}>
          <Text style={[styles.forgotText, { color: accent }]}>
            Forgot username or password?
          </Text>
        </Pressable>
      )}

      {showSwirl && (
        <LoginSwirl onAnimationComplete={() => router.replace('/(tabs)')} />
      )}

      <ForgotSheet
        isPresented={showForgot}
        step={forgotStep}
        forgotError={forgotError}
        accent={accent}
        isDark={isDark}
        onForgotRequest={handleForgotRequest}
        onForgotReset={handleForgotReset}
        onClose={closeForgot}
        setForgotEmail={setForgotEmail}
        setForgotCode={setForgotCode}
        setForgotNewPassword={setForgotNewPassword}
      />
    </SafeAreaView>
  );
}

type ForgotSheetProps = {
  isPresented: boolean;
  step: ForgotStep;
  forgotError: string;
  accent: string;
  isDark: boolean;
  onForgotRequest: (type: 'username' | 'password') => void;
  onForgotReset: () => void;
  onClose: () => void;
  setForgotEmail: (v: string) => void;
  setForgotCode: (v: string) => void;
  setForgotNewPassword: (v: string) => void;
};

const SHEET_WIDTH = width - 40;

type SheetButtonProps = {
  label: string;
  onPress: () => void;
  variant: 'filled' | 'outlined' | 'text';
  accent: string;
  isDark: boolean;
};

function SheetButton({ label, onPress, variant, accent, isDark }: SheetButtonProps) {
  return (
    <RNHostView matchContents style={{ width: SHEET_WIDTH }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.sheetButton,
          variant === 'filled' && { backgroundColor: accent },
          variant === 'outlined' && {
            backgroundColor: 'transparent',
            borderWidth: 1.5,
            borderColor: accent,
          },
          variant === 'text' && { backgroundColor: 'transparent', height: 44 },
          { width: SHEET_WIDTH },
          pressed && styles.pressed,
        ]}
      >
        <Text
          style={[
            styles.sheetButtonLabel,
            variant === 'filled' && { color: '#fff' },
            variant === 'outlined' && { color: accent },
            variant === 'text' && { color: isDark ? '#8e8e93' : '#8e8e93', fontWeight: '500' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    </RNHostView>
  );
}

function ForgotSheet({
  isPresented,
  step,
  forgotError,
  accent,
  isDark,
  onForgotRequest,
  onForgotReset,
  onClose,
  setForgotEmail,
  setForgotCode,
  setForgotNewPassword,
}: ForgotSheetProps) {
  return (
    <BottomSheet isPresented={isPresented} onDismiss={onClose}>
      <Column spacing={0} style={{ paddingBottom: 24, paddingHorizontal: 20 }}>
        <Column spacing={4} style={{ paddingTop: 12, paddingBottom: 14 }}>
          <UIText textStyle={{ fontSize: 24, fontWeight: '700' }}>
            {step === 'email' ? 'Recover Account' : 'Set New Password'}
          </UIText>
          <UIText textStyle={{ fontSize: 14, color: '#8e8e93' }}>
            {step === 'email'
              ? 'Enter your email to recover your credentials'
              : 'Enter the code we sent to your email'}
          </UIText>
        </Column>

        {step === 'email' ? (
          <Column spacing={12} style={{ paddingTop: 4 }}>
            <FieldGroup>
              <FieldGroup.Section>
                <TextInput
                  placeholder="Email address"
                  onChangeText={setForgotEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                />
              </FieldGroup.Section>
            </FieldGroup>

            {!!forgotError && (
              <UIText textStyle={{ color: '#e74c3c', fontSize: 13 }}>{forgotError}</UIText>
            )}

            <SheetButton
              label="Send My Username"
              variant="outlined"
              onPress={() => onForgotRequest('username')}
              accent={accent}
              isDark={isDark}
            />
            <SheetButton
              label="Reset My Password"
              variant="filled"
              onPress={() => onForgotRequest('password')}
              accent={accent}
              isDark={isDark}
            />
          </Column>
        ) : (
          <Column spacing={12} style={{ paddingTop: 4 }}>
            <FieldGroup>
              <FieldGroup.Section>
                <TextInput
                  placeholder="Reset code"
                  onChangeText={setForgotCode}
                  keyboardType="number-pad"
                />
                <TextInput
                  placeholder="New password"
                  onChangeText={setForgotNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </FieldGroup.Section>
            </FieldGroup>

            {!!forgotError && (
              <UIText textStyle={{ color: '#e74c3c', fontSize: 13 }}>{forgotError}</UIText>
            )}

            <SheetButton
              label="Set New Password"
              variant="filled"
              onPress={onForgotReset}
              accent={accent}
              isDark={isDark}
            />
          </Column>
        )}

        <SheetButton
          label="Cancel"
          variant="text"
          onPress={onClose}
          accent={accent}
          isDark={isDark}
        />
      </Column>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f2f7',
  },
  containerDark: {
    backgroundColor: '#000',
  },
  logo: {
    width,
    height: height * 0.16,
    marginTop: height * 0.02,
    alignSelf: 'center',
  },
  formSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  serverPicker: {
    marginBottom: 2,
  },
  pickerHost: {
    width: '100%',
    paddingBottom: 32,
  },
  fieldGroup: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  fieldGroupDark: {
    backgroundColor: '#1c1c1e',
  },
  textInput: {
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  fieldSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c6c6c8',
    marginLeft: 16,
  },
  fieldSeparatorDark: {
    backgroundColor: '#38383a',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 13,
    paddingHorizontal: 4,
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  submitButton: {
    height: 54,
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.985 }],
  },
  submitLabel: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  socialSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingBottom: 8,
  },
  forgotText: {
    fontSize: 14,
  },
  sheetButton: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#c7c7cc',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: '#8e8e93',
  },
  dividerTextDark: {
    color: '#48484a',
  },
  appleButton: {
    width: INNER_WIDTH,
    height: 50,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    width: INNER_WIDTH,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dadce0',
    backgroundColor: '#fff',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButtonDark: {
    backgroundColor: '#1c1c1e',
    borderColor: '#38383a',
  },
  googleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3c4043',
  },
  googleLabelDark: {
    color: '#e8eaed',
  },
});
