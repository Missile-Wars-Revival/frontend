import { SafeAreaView, Text, View, Image, TouchableHighlight, ScrollView } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useEffect, useState } from "react";
import useLogin from "../hooks/api/useLogin";
import { User, LockKeyhole } from "lucide-react-native";
import React from "react";
import { Appearance, useColorScheme } from 'react-native';
import { saveCredentials } from "../util/logincache";
import { usePushNotifications } from "../components/Notifications/usePushNotifications";
import { language } from "../components/localisation";

export default function Login() {

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  // Define colors based on theme
  const styles = {
    backgroundColor: isDark ? '#333' : '#fff',
    textColor: isDark ? '#fff' : '#333',
    buttonColor: isDark ? '#5865F2' : '#773765', // Example colors for light/dark mode
    borderColor: isDark ? '#5865F2' : '#773765',
    errorTextColor: '#ff4757',
    iconColor: '#000000'
  };

  const { expoPushToken, notification } = usePushNotifications();
  const notificationToken = expoPushToken?.data ?? "No token";
  // console.log(notificationToken);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    language()
  }, []);

  return (
    <ScrollView style={{ backgroundColor: styles.backgroundColor }}>
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
              icon={<User size={24} color={styles.iconColor} />}
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
                    <LockKeyhole size={24} color={styles.iconColor} />
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
          buttonColor={styles.buttonColor}
          textColor={styles.textColor}
          borderColor={styles.borderColor}
        />
        <Image
          source={require("../assets/icons/cometDivider.png")}
          resizeMode="stretch"
          className="w-[410] h-[12%] mt-[220]"
        />
        <SignUpButton borderColor={styles.borderColor} />
      </SafeAreaView>
    </ScrollView>
  );
}

function LoginButton({
  username,
  password,
  notificationToken,
  setIsError,
  buttonColor,
  borderColor,
  textColor,
}: {
  username: string;
  password: string;
  notificationToken: string;
  setIsError: (error: boolean) => void;
  buttonColor: string;
  borderColor: string;
  textColor: string;
  className?: string;
}) {
  const mutation = useLogin(
    async (token) => {
      await saveCredentials(username, token);
      console.log("Logged in with token", token);
      router.push('/');
    },
    () => {
      setIsError(true);
    }
  );
  return (
    <TouchableHighlight
      onPress={() => mutation.mutate({ username, password, notificationToken })}
      className={`bg-[${buttonColor}] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center border-2 mt-[35] border-[${borderColor}`}
    >
      <View>
        <Text className={`text-[${textColor}] font-bold`}>Let's Fight</Text>
      </View>
    </TouchableHighlight>
  );
}

function SignUpButton({ borderColor } : {borderColor: string;}){
  return (
    <TouchableHighlight
      onPress={() => {
        router.navigate("/register");
      }}
      className={`rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center border-2 mt-[5] border-[${borderColor}]`}
    >
      <View>
        <Text className=" font-bold">Sign up with Email</Text>
      </View>
    </TouchableHighlight>
  );
}