import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Image, StyleSheet, Dimensions, Alert, Text, Pressable, View, useColorScheme, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Host, Column, FieldGroup, RNHostView, BottomSheet,
  TextInput,
  Text as UIText,
  type TextInputRef,
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
import { signInWithFirebase, registerWithFirebase, signInWithApple, signInWithGoogle } from '../util/firebase/firebaseAuth';
import { oauthLogin } from '../api/oauthLogin';
import { requestPasswordReset, requestUsernameReminder, resetPassword } from '../api/changedetails';
import LoginSwirl from '../components/Animations/loginSwirl';
import { getlocation } from '../util/locationreq';

const IOS_CLIENT_ID = '199249539413-0og9o1srvoq381tajt844jraabb9pmf0.apps.googleusercontent.com';
const WEB_CLIENT_ID  = '199249539413-4ggab6ob709kii3sumthvi5olqf1g7p4.apps.googleusercontent.com';

type Mode = 'login' | 'register';
type ForgotStep = 'email' | 'reset';

const { width, height } = Dimensions.get('window');
const INNER_WIDTH = width - 32;

export default function Auth() {
  const { expoPushToken } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? 'No token';
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

  const usernameRef = useRef<TextInputRef>(null);
  const passwordRef = useRef<TextInputRef>(null);
  const emailRef = useRef<TextInputRef>(null);
  const confirmRef = useRef<TextInputRef>(null);

  useEffect(() => { getlocation(); }, []);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      offlineAccess: true,
    });
  }, []);

  const finishOAuth = useCallback(async (uid: string, email: string, displayName: string) => {
    try {
      const data = await oauthLogin(uid, email, displayName, notificationToken);
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
      if (!credential.identityToken) throw new Error('No identity token');
      const derivedName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean).join(' ').trim();
      const user = await signInWithApple(credential.identityToken, derivedName);
      await finishOAuth(user.uid, user.email, user.displayName || derivedName);
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
      if (!idToken) throw new Error('No ID token from Google');
      const user = await signInWithGoogle(idToken);
      await finishOAuth(user.uid, user.email, user.displayName);
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
      try { await signInWithFirebase(password, token); } catch {}
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
      try { await registerWithFirebase(email, password); } catch {}
      setIsSignedIn(true);
      router.navigate('/');
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

      {/*
        Host fills remaining space. Column stacks items from the top — no Spacer,
        so the button sits naturally below the form with no gap to the bottom.
        RNHostView lets us embed custom-styled RN Pressables inside the SwiftUI tree.
      */}
      <Host style={styles.formHost}>
        <Column spacing={16} alignment="center">
          <Picker
            selection={mode}
            onSelectionChange={(v) => switchMode(v as Mode)}
            modifiers={[pickerStyle('segmented')]}
          >
            <SwiftUIText modifiers={[tag('login')]}>Login</SwiftUIText>
            <SwiftUIText modifiers={[tag('register')]}>Register</SwiftUIText>
          </Picker>

          <FieldGroup>
            <FieldGroup.Section>
              <TextInput
                ref={usernameRef}
                placeholder="Username"
                onChangeText={setUsername}
                autoCorrect={false}
                autoCapitalize="none"
              />
              {mode === 'register' && (
                <TextInput
                  ref={emailRef}
                  placeholder="Email"
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                />
              )}
              <TextInput
                ref={passwordRef}
                placeholder="Password"
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {mode === 'register' && (
                <TextInput
                  ref={confirmRef}
                  placeholder="Confirm Password"
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            </FieldGroup.Section>
          </FieldGroup>

          {!!error && (
            <UIText textStyle={{ color: '#e74c3c', fontSize: 13 }}>{error}</UIText>
          )}

          {/* Custom-styled submit button embedded in SwiftUI layout via RNHostView */}
          <RNHostView matchContents style={{ width: INNER_WIDTH }}>
            <Pressable
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitButton,
                { backgroundColor: accent, width: INNER_WIDTH },
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.submitLabel}>
                {mode === 'login' ? "Let's Fight" : 'Create Account'}
              </Text>
            </Pressable>
          </RNHostView>

          {mode === 'login' && (
            <RNHostView matchContents style={{ width: INNER_WIDTH }}>
              <Pressable
                onPress={() => setShowForgot(true)}
                style={[styles.forgotButton, { width: INNER_WIDTH }]}
              >
                <Text style={[styles.forgotText, { color: accent }]}>
                  Forgot username or password?
                </Text>
              </Pressable>
            </RNHostView>
          )}

          {/* Social auth divider */}
          <RNHostView matchContents style={{ width: INNER_WIDTH }}>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={[styles.dividerText, isDark && styles.dividerTextDark]}>
                or continue with
              </Text>
              <View style={styles.dividerLine} />
            </View>
          </RNHostView>

          {/* Apple Sign In — iOS only */}
          {Platform.OS === 'ios' && (
            <RNHostView matchContents style={{ width: INNER_WIDTH }}>
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
            </RNHostView>
          )}

          {/* Google Sign In */}
          <RNHostView matchContents style={{ width: INNER_WIDTH }}>
            <Pressable
              onPress={handleGoogle}
              style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
            >
              <Text style={styles.googleIcon}>G</Text>
              <Text style={[styles.googleLabel, isDark && styles.googleLabelDark]}>
                Continue with Google
              </Text>
            </Pressable>
          </RNHostView>
        </Column>
      </Host>

      {showSwirl && (
        <LoginSwirl onAnimationComplete={() => router.navigate('/')} />
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
  formHost: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  submitButton: {
    height: 54,
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
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 4,
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
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#c7c7cc',
    backgroundColor: '#fff',
    gap: 10,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
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
