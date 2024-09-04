import { SafeAreaView, Text, View, Image, TouchableHighlight, ScrollView, Dimensions, Modal, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState } from "react";
import useLogin from "../hooks/api/useLogin";
import { User, LockKeyhole } from "lucide-react-native";
import React from "react";
import { saveCredentials } from "../util/logincache";
import { usePushNotifications } from "../components/Notifications/usePushNotifications";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "../util/Context/authcontext";
import { requestPasswordReset, requestUsernameReminder } from "../api/changedetails";

const { width, height } = Dimensions.get('window');

export default function Login() {
  const { expoPushToken, notification } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? "No token";
  // console.log(notificationToken);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotError, setForgotError] = useState("");

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
    <SafeAreaView style={{ flex: 1, alignItems: 'center' }}>  
      <Image
        source={require("../assets/icons/MissleWarsTitle.png")}
        style={{
          width: width * 0.8,
          height: height * 0.2,
          marginTop: height * 0.05,
        }}
        resizeMode="contain"
      />
      <View style={{ width: '90%', marginTop: height * 0.05 }}>
        <View style={{ marginBottom: height * 0.02 }}>
          <Input
            placeholder="Username"
            autoCorrect={false}    
            onChangeText={(text) => setUsername(text)}
            style={{
              height: height * 0.06,
              borderRadius: 20,
            }}
            icon={<User size={24} color="black" />}
          />
        </View>
        <View>
          <Input
            placeholder="Password"
            onChangeText={(text) => setPassword(text)}
            secureTextEntry={true}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="default"
            textContentType="newPassword"
            autoComplete="password"
            style={{
              height: height * 0.06,
              borderRadius: 20,
            }}
            icon={
              <View style={{ marginTop: -1 }}>
                <LockKeyhole size={24} color="black" />
              </View>
            }
          />
          {isError && (
            <Text style={{ color: 'red', fontSize: 12, textAlign: 'center', marginTop: 5 }}>
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
      />
      <TouchableOpacity 
        onPress={() => setShowForgotModal(true)}
        style={{ marginTop: height * 0.02 }}
      >
        <Text style={{ color: '#773765', textDecorationLine: 'underline' }}>
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
      />
      <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
        <Image
          source={require("../assets/icons/cometDivider.png")}
          resizeMode="stretch"
          style={{
            width: width * 0.9,
            height: height * 0.1,
            marginBottom: height * 0.05,
          }}
        />
        <SignUpButton />
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
}: {
  username: string;
  password: string;
  notificationToken: string;
  setIsError: (error: boolean) => void;
}) {
  const { setIsSignedIn } = useAuth();
  const mutation = useLogin(
    async (token) => {
      await saveCredentials(username, token);
      console.log("Logged in with token", token);
      await AsyncStorage.setItem('signedIn', 'true');
      setIsSignedIn(true);
      router.push('/');
    },
    () => {
      setIsError(true);
    }
  );
  return (
    <TouchableHighlight
      onPress={() => mutation.mutate({ username, password, notificationToken })}
      style={{
        backgroundColor: '#773765',
        borderRadius: 20,
        width: '90%',
        height: height * 0.06,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: height * 0.04,
      }}
    >
      <View>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>Let's Fight</Text>
      </View>
    </TouchableHighlight>
  );
}

function SignUpButton() {
  return (
    <TouchableHighlight
      onPress={() => {
        router.navigate("/register");
      }}
      style={{
        borderRadius: 20,
        width: '90%',
        height: height * 0.06,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: height * 0.02,
      }}
    >
      <View>
        <Text style={{ fontWeight: 'bold' }}>Sign up with Email</Text>
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
  setError 
}: {
  visible: boolean;
  onClose: () => void;
  email: string;
  setEmail: (email: string) => void;
  error: string;
  setError: (error: string) => void;
}) {
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
        await requestPasswordReset(email);
        Alert.alert('A password reset email has been sent if the account exists.');
      }
      onClose();
    } catch (err) {
      setError(`Failed to request ${type} recovery. Please try again.`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>Forgot Credentials</Text>
          <View style={{ marginBottom: height * 0.02 }}>
            <Input
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{
                height: height * 0.06,
                borderRadius: 20,
              }}
              icon={<User size={24} color="black" />}
            />
          </View>
          {error ? <Text style={{ color: 'red', fontSize: 12, textAlign: 'center', marginBottom: 10 }}>{error}</Text> : null}
          <TouchableHighlight
            onPress={() => handleSubmit('username')}
            style={{
              backgroundColor: '#773765',
              borderRadius: 20,
              height: height * 0.06,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: height * 0.02,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Recover Username</Text>
          </TouchableHighlight>
          <TouchableHighlight
            onPress={() => handleSubmit('password')}
            style={{
              backgroundColor: '#773765',
              borderRadius: 20,
              height: height * 0.06,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: height * 0.02,
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Reset Password</Text>
          </TouchableHighlight>
          <TouchableOpacity onPress={onClose} style={{ alignItems: 'center' }}>
            <Text style={{ color: '#773765', textDecorationLine: 'underline' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
