import { SafeAreaView, Text, View, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet, useColorScheme } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState, useMemo, useCallback } from "react";
import useRegister from "../hooks/api/useRegister";
import { User, LockKeyhole, Mail } from "lucide-react-native";
import React from "react";
import { saveCredentials } from "../util/logincache";
import { usePushNotifications } from "../components/Notifications/usePushNotifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../util/Context/authcontext";

const { width, height } = Dimensions.get('window');

export default function Register() {
  const { expoPushToken } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? "No token";
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { setIsSignedIn } = useAuth();

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const styles = useMemo(() => StyleSheet.create({
    ...lightStyles,
    ...(isDarkMode ? darkStyles : {}),
  }), [isDarkMode]);

  const mutation = useRegister(
    async (token) => {
      await saveCredentials(username, token);
      console.log("Registered and logged in with token", token);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      router.navigate('/');
    },
    () => {
      setIsError(true);
      setErrorMessage("Registration failed. Please try again.");
    }
  );

  const validateForm = useCallback(() => {
    let isValid = true;
    const newErrors = {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // Username validation
    if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters long";
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      newErrors.password = "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character";
      isValid = false;
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  }, [username, email, password, confirmPassword]);

  const handleRegister = useCallback(() => {
    if (validateForm()) {
      mutation.mutate({ username, email, password, notificationToken });
    } else {
      setIsError(true);
      setErrorMessage("Please correct the errors in the form.");
    }
  }, [validateForm, mutation, username, email, password, notificationToken]);

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
              onChangeText={setUsername}
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <User size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
          </View>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Email"
              autoCorrect={false}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <Mail size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Password"
              onChangeText={setPassword}
              secureTextEntry={true}
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <LockKeyhole size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>
          <View style={styles.inputWrapper}>
            <Input
              placeholder="Confirm Password"
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.input, isDarkMode && styles.inputDark]}
              icon={
                <View style={styles.iconContainer}>
                  <LockKeyhole size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>
          {isError && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleRegister} style={[styles.registerButton, isDarkMode && styles.registerButtonDark]}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <View style={styles.bottomContainer}>
          {!isDarkMode && (
            <Image
              source={require("../assets/icons/cometDivider.png")}
              style={styles.cometDivider}
              resizeMode="stretch"
            />
          )}
          <TouchableOpacity onPress={() => router.navigate('/login')} style={[styles.backButton, isDarkMode && styles.backButtonDark]}>
            <Text style={[styles.backButtonText, isDarkMode && styles.backButtonTextDark]}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
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
    marginBottom: height * 0.02,
  },
  inputContainer: {
    width: width * 0.9,
  },
  inputWrapper: {
    marginBottom: 5,
    position: 'relative',
  },
  input: {
    height: height * 0.06,
    borderRadius: 20,
    paddingLeft: 45,
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 10,
  },
  registerButton: {
    backgroundColor: '#773765',
    borderRadius: 20,
    width: width * 0.9,
    height: height * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: height * 0.04,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    width: width * 1,
    alignItems: 'center',
  },
  cometDivider: {
    width: width * 1,
    height: height * 0.1,
    marginBottom: height * 0.01,
  },
  backButton: {
    borderRadius: 20,
    width: width * 0.9,
    height: height * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    marginBottom: height * 0.02,
  },
  backButtonText: {
    fontWeight: 'bold',
  },
  iconContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    transform: [{ translateY: 2 }],
    zIndex: 1,
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
    fontSize: 16,
    color: '#FFF',
  },
  registerButtonDark: {
    backgroundColor: '#4CAF50',
  },
  backButtonDark: {
    borderColor: '#4CAF50',
  },
  backButtonTextDark: {
    color: '#FFFFFF',
  },
  iconContainer: {
    position: 'absolute',
    left: 10,
    top: 10,
    transform: [{ translateY: 2 }],
    zIndex: 1,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 2,
    marginLeft: 10,
  },
});
