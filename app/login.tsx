import { SafeAreaView, Text, View, Image, TouchableHighlight, ScrollView, Dimensions, Modal, TouchableOpacity, Alert, StyleSheet, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useEffect, useMemo, useState } from "react";
import useLogin from "../hooks/api/useLogin";
import { User, LockKeyhole, CheckCircle2 } from "lucide-react-native";
import React from "react";
import { saveCredentials } from "../util/logincache";
import { usePushNotifications } from "../components/Notifications/usePushNotifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../util/Context/authcontext";
import { requestPasswordReset, requestUsernameReminder, resetPassword } from "../api/changedetails";
import LoginSwirl from "../components/Animations/loginSwirl";
import { signInWithFirebase } from "../util/firebase/firebaseAuth";
import { getlocation } from "../util/locationreq";

const { width, height } = Dimensions.get('window');

export default function Login() {
  const { expoPushToken, notification } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? "No token";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = useMemo(() => StyleSheet.create({
    ...lightStyles,
    ...(isDarkMode ? darkStyles : {}),
  }), [isDarkMode]);

  useEffect(() => {
    getlocation();
  }, []);
  
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
        <Image
          source={require("../assets/icons/MissleWarsTitle.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Username"
              autoCorrect={false}
              onChangeText={(text) => setUsername(text)}
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <User size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Password"
              onChangeText={(text) => setPassword(text)}
              secureTextEntry={true}
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="default"
              textContentType="newPassword"
              autoComplete="password"
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <LockKeyhole size={24} color={isDarkMode ? "white" : "black"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {isError && (
              <Text style={styles.errorText}>
                Invalid username or password
              </Text>
            )}
          </View>
        </View>
        <LoginButton
          username={username}
          password={password}
          notificationToken={notificationToken}
          setIsError={setIsError}
          isDarkMode={isDarkMode}
          styles={styles}
        />
        <TouchableOpacity
          onPress={() => setShowForgotModal(true)}
          style={styles.forgotButton}
        >
          <Text style={[styles.forgotText, isDarkMode && styles.forgotTextDark]}>
            Forgot Username or Password?
          </Text>
        </TouchableOpacity>

        <ForgotCredentialsModal
          visible={showForgotModal}
          onClose={() => setShowForgotModal(false)}
          email={forgotEmail}
          setEmail={setForgotEmail}
          error={forgotError}
          setError={(error: string | null) => setForgotError(error || '')}
          isDarkMode={isDarkMode}
          styles={styles}
        />
        <View style={styles.bottomContainer}>
          {!isDarkMode && (
            <Image
              source={require("../assets/icons/cometDivider.png")}
              resizeMode="stretch"
              style={styles.divider}
            />
          )}
          <SignUpButton isDarkMode={isDarkMode} styles={styles} />
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}

function LoginButton({
  username,
  password,
  notificationToken,
  setIsError,
  isDarkMode,
  styles,
}: {
  username: string;
  password: string;
  notificationToken: string;
  setIsError: (error: boolean) => void;
  isDarkMode: boolean;
  styles: any;
}) {
  const { setIsSignedIn } = useAuth();
  const [showSwirl, setShowSwirl] = useState(false);
  const mutation = useLogin(
    async (token) => {
      await saveCredentials(username, token, notificationToken);
      console.log("Logged in with token", token);

      try {
        console.log("Attempting Firebase sign-in");
        await signInWithFirebase(password, token);
        console.log("Firebase sign-in successful");
      } catch (firebaseError) {
        console.error("Firebase sign-in failed:", firebaseError);
        // Alert.alert(
        //   "Firebase Sign-In Failed",
        //   "Continuing with login process. Some features may be limited."
        // );
      }
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      setShowSwirl(true);
    },
    () => {
      setIsError(true);
    }
  );

  const handleLogin = () => {
    mutation.mutate({ username, password, notificationToken });
  };

  const handleAnimationComplete = () => {
    router.navigate('/');
  };

  return (
    <>
      <TouchableHighlight
        onPress={handleLogin}
        style={[styles.loginButton, isDarkMode && styles.loginButtonDark]}
      >
        <View>
          <Text style={styles.loginButtonText}>Let's Fight</Text>
        </View>
      </TouchableHighlight>
      {showSwirl && <LoginSwirl onAnimationComplete={handleAnimationComplete} />}
    </>
  );
}

function SignUpButton({ isDarkMode, styles }: { isDarkMode: boolean; styles: any }) {
  return (
    <TouchableHighlight
      onPress={() => {
        router.navigate("/register");
      }}
      style={[styles.signUpButton, isDarkMode && styles.signUpButtonDark]}
    >
      <View>
        <Text style={[styles.signUpButtonText, isDarkMode && styles.signUpButtonTextDark]}>Sign up with Email</Text>
      </View>
    </TouchableHighlight>
  );
}

function ForgotCredentialsModal({
  visible,
  onClose,
  email,
  setEmail,
  error,
  setError,
  isDarkMode,
  styles,
}: {
  visible: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  error: string;
  setError: (error: string) => void;
  isDarkMode: boolean;
  styles: any;
}) {
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRequestReset = async () => {
    try {
      await requestPasswordReset(email);
      setShowResetForm(true);
      setError("");
    } catch (err) {
      setError("Failed to request password reset. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    try {
      const result = await resetPassword(email, resetCode, newPassword);
      if (result.success) {
        setShowSuccessAnimation(true);
        setTimeout(() => {
          setShowSuccessAnimation(false);
          onClose();
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Failed to reset password. Please try again.");
    }
  };

  const handleSubmit = async (type: 'username' | 'password') => {
    try {
      if (type === 'username') {
        const response = await requestUsernameReminder(email);
        if (response.message) {
          Alert.alert(`The username associated with this email is: ${response.message}`);
        } else {
          alert('No username found for this email address.');
        }
      } else {
        handleRequestReset();
      }
    } catch (err) {
      setError(`Failed to request ${type} recovery. Please try again.`);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
          <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Forgot Credentials</Text>
          {!showResetForm ? (
            <>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                  icon={<User size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />}
                />
              </View>
              <TouchableOpacity
                onPress={() => handleSubmit('username')}
                style={[
                  styles.modalButton,
                  isDarkMode && styles.modalButtonDark,
                  !isValidEmail(email) && styles.disabledButton
                ]}
                disabled={!isValidEmail(email)}
              >
                <Text style={[
                  styles.modalButtonText,
                  isDarkMode && styles.modalButtonTextDark,
                  !isValidEmail(email) && styles.disabledButtonText
                ]}>
                  Recover Username
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleRequestReset}
                style={[
                  styles.modalButton,
                  isDarkMode && styles.modalButtonDark,
                  !isValidEmail(email) && styles.disabledButton
                ]}
                disabled={!isValidEmail(email)}
              >
                <Text style={[
                  styles.modalButtonText,
                  isDarkMode && styles.modalButtonTextDark,
                  !isValidEmail(email) && styles.disabledButtonText
                ]}>
                  Reset Password
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Enter reset code"
                  value={resetCode}
                  onChangeText={setResetCode}
                  keyboardType="number-pad"
                  style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                />
              </View>
              <View style={styles.inputWrapper}>
                <Input
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  style={[styles.modalInput, isDarkMode && styles.modalInputDark]}
                />
              </View>
              <TouchableOpacity
                onPress={handleResetPassword}
                style={[styles.modalButton, isDarkMode && styles.modalButtonDark]}
              >
                <Text style={[styles.modalButtonText, isDarkMode && styles.modalButtonTextDark]}>Confirm Reset</Text>
              </TouchableOpacity>
            </>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={[styles.cancelButtonText, isDarkMode && styles.cancelButtonTextDark]}>Cancel</Text>
          </TouchableOpacity>
          {showSuccessAnimation && (
            <View style={styles.successAnimation}>
              <CheckCircle2 size={64} color={isDarkMode ? "#4CAF50" : "#773765"} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const lightStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  logo: {
    width: width * 1,
    height: height * 0.2,
    marginTop: height * 0.04,
    marginBottom: height * 0.00001,
  },
  inputContainer: {
    width: width * 0.9,
    marginTop: height * 0.01,
  },
  inputWrapper: {
    marginBottom: height * 0.02,
  },
  input: {
    height: height * 0.06,
    borderRadius: 20,
    paddingLeft: 45,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  forgotButton: {
    marginTop: height * 0.02,
  },
  forgotText: {
    color: '#773765',
    textDecorationLine: 'underline',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  divider: {
    width: width * 1,
    height: height * 0.1,
    marginBottom: height * 0.01,
  },
  loginButton: {
    backgroundColor: '#773765',
    borderRadius: 20,
    width: '90%',
    height: height * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.04,
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  signUpButton: {
    borderRadius: 20,
    width: '90%',
    height: height * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: height * 0.02,
  },
  signUpButtonText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#000",
  },
  modalInput: {
    backgroundColor: '#f0f2f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#773765',
    borderRadius: 10,
    width: '100%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#773765',
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    transform: [{ translateY: 2 }],
    zIndex: 1,
  },
  successAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

const darkStyles = StyleSheet.create({
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  inputDark: {
      height: height * 0.06,
      borderRadius: 20,
      paddingLeft: 45,
      color: '#FFF',
  },
  forgotTextDark: {
    color: '#4CAF50',
  },
  loginButtonDark: {
    backgroundColor: '#4CAF50',
  },
  signUpButtonDark: {
    borderColor: '#4CAF50',
  },
  signUpButtonTextDark: {
    color: '#FFFFFF',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitleDark: {
    color: '#FFFFFF',
  },
  modalInputDark: {
    backgroundColor: '#3D3D3D',
    color: '#FFFFFF',
  },
  modalButtonDark: {
    backgroundColor: '#4CAF50',
  },
  modalButtonTextDark: {
    color: '#FFFFFF',
  },
  cancelButtonTextDark: {
    color: '#4CAF50',
  },
  iconContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    transform: [{ translateY: 2 }],
    zIndex: 1,
  },
  successAnimation: {
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
  },
});