import { SafeAreaView, Text, View, Image, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState } from "react";
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

  const { setIsSignedIn } = useAuth();

  const mutation = useRegister(
    async (token) => {
      await saveCredentials(username, token);
      console.log("Registered and logged in with token", token);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      router.push('/');
    },
    () => {
      setIsError(true);
      setErrorMessage("Registration failed. Please try again.");
    }
  );

  const handleRegister = () => {
    if (password !== confirmPassword) {
      setIsError(true);
      setErrorMessage("Passwords do not match");
      return;
    }
    mutation.mutate({ username, email, password, notificationToken });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image
          source={require("../assets/icons/MissleWarsTitle.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <View style={styles.inputContainer}>
          <Input
            placeholder="Username"
            autoCorrect={false}
            onChangeText={setUsername}
            style={styles.input}
            icon={
              <View style={{ marginTop: -14 }}>
                <User size={24} color="black" />
              </View>
            }
            className="w-[90vw] h-[5vh] rounded-[20px]"
          />
          <Input
            placeholder="Email"
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
            style={styles.input}
            icon={
              <View style={{ marginTop: -14 }}>
                <Mail size={24} color="black" />
              </View>
            }
            className="w-[90vw] h-[5vh] rounded-[20px]"
          />
          <Input
            placeholder="Password"
            onChangeText={setPassword}
            secureTextEntry={true}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
            icon={
              <View style={{ marginTop: -14 }}>
                <LockKeyhole size={24} color="black" />
              </View>
            }
            className="w-[90vw] h-[5vh] rounded-[20px]"
          />
          <Input
            placeholder="Confirm Password"
            onChangeText={setConfirmPassword}
            secureTextEntry={true}
            autoCorrect={false}
            autoCapitalize="none"
            style={styles.input}
            icon={
              <View style={{ marginTop: -14 }}>
                <LockKeyhole size={24} color="black" />
              </View>
            }
            className="w-[90vw] h-[5vh] rounded-[20px]"
          />
          {isError && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}
        </View>
        <TouchableOpacity onPress={handleRegister} style={styles.registerButton}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Image
            source={require("../assets/icons/cometDivider.png")}
            style={styles.cometDivider}
            resizeMode="stretch"
          />
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 20,
  },
  logo: {
    width: width * 1,
    height: height * 0.2,
    marginTop: height * 0.04,
    marginBottom: height * 0.00001,
  },
  inputContainer: {
    width: '90%',
  },
  input: {
    height: height * 0.06,
    borderRadius: 20,
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  registerButton: {
    backgroundColor: '#773765',
    borderRadius: 20,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  footer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 'auto',
  },
  cometDivider: {
    width: width * 1,
    height: height * 0.1,
    marginBottom: height * 0.01,
  },
  backButton: {
    borderRadius: 20,
    width: '90%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  backButtonText: {
    fontWeight: 'bold',
  },
});
