import { SafeAreaView, Text, View, Image, TouchableHighlight, ScrollView } from "react-native";
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

export default function Login() {
  const { expoPushToken, notification } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? "No token";
  // console.log(notificationToken);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  return (
    <ScrollView>
    <SafeAreaView className="flex-1 items-center">  
      <Image
        source={require("../assets/icons/MissleWarsTitle.png")}
        className="w-[425] h-[200] mt-[0]"
        resizeMode="contain"
      />
      <View>
        <View className="space-y-4">
          <Input
            placeholder="Username"
            autoCorrect={false}    
            onChangeText={(text) => setUsername(text)}
            className="w-[90vw] h-[5vh] rounded-[20px]"
            icon={<User size={24} color="black" />}
          />
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
              className="w-[90vw] h-[5vh] rounded-[20px]"
              icon={
                <View className="inset-y-[-1px]">
                  <LockKeyhole size={24} color="black" />
                </View>
              }
            />
            {isError && (
              <Text className="text-red-500 text-sm text-center">
                Invalid username or password
              </Text>
            )}
          </View>
        </View>
      </View>
      <LoginButton
        username={username}
        password={password}
        notificationToken={notificationToken}
        setIsError={setIsError}
      />
      <Image
        source={require("../assets/icons/cometDivider.png")}
        resizeMode="stretch"
        className="w-[410] h-[12%] mt-[220]"
      />
      <SignUpButton />
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
  className?: string;
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
      className={`bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center mt-[40]`}
    >
      <View>
        <Text className="text-white font-bold">Let's Fight</Text>
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
      className="rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center border-2 mt-[5]"
    >
      <View>
        <Text className=" font-bold">Sign up with Email</Text>
      </View>
    </TouchableHighlight>
  );
}
