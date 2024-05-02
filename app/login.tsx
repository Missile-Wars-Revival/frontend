import { SafeAreaView, Text, Button, View } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/input";
import { useState } from "react";
import useLogin from "../hooks/api/useLogin";
import { User, LockKeyhole } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import Constants from "expo-constants";

const uri = Constants?.expoConfig?.hostUri
  ? `http://` + Constants.expoConfig.hostUri.split(`:`).shift()?.concat(`:3000`)
  : `missilewars.com`;


async function handleLogin(username: string, password: string) {

  const apiUrl = `${uri}/api/login`;

  console.log(apiUrl);

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  if (response.ok) {
    const data = await response.json();
    console.log(data);
  } else {
    console.error("Error logging in");
  }

}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  //console.log(backendUrl);

  const navigation = useNavigation();

  const navigateregister = () => {
    navigation.navigate("register" as never); // Navigate to 'register' page
  };

  return (
    <SafeAreaView className="flex-1 justify-center items-center space-y-8">
      <View className="space-y-4">
        <Input
          placeholder="Username"
          onChangeText={(text) => setUsername(text)}
          className="w-[50vw] rounded-2xl"
          icon={<User size={24} color="black" />}
        />
        <Input
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          className="w-[50vw] rounded-2xl"
          icon={
            <View className="inset-y-[7px]">
              <LockKeyhole size={24} color="black" />
            </View>
          }
        />
      </View>
      <Button
        title="Login!"
        onPress={async () => await handleLogin(username, password)}
      />
      {isError && (
        <Text className={"text-red-700 text-lg"}>
          Invalid username or password
        </Text>
      )}
    </SafeAreaView>
  );
}
