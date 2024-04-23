import { SafeAreaView, Text, Button, View } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/input";
import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isError, setIsError] = useState(false);

  function handleLogin(username: string, password: string) {
    axios
      .post("http://192.168.1.168:3000/api/login", {
        username,
        password,
      })
      .then((response) => {
        console.log(response.data);
        if (response.status === 200) {
          router.navigate("/");
        }
      })
      .catch((error) => {
        console.log(error);
        if (error.response.status === 401) {
          setIsError(true);
        }
      });
  }

  return (
    <SafeAreaView className="flex-1 justify-center items-center space-y-8">
      <View className="space-y-4">
        <Input
          placeholder="Username"
          onChangeText={(text) => setUsername(text)}
          className="w-[50vw]"
        />
        <Input
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          className="w-[50vw]"
        />
      </View>
      <Button title="Login!" onPress={() => handleLogin(username, password)} />
      <Button title="Logout!" onPress={() => setIsLoggedIn(false)} />
      {isError && (
        <Text className={"text-red-700 text-lg"}>
          Invalid username or password
        </Text>
      )}
    </SafeAreaView>
  );
}
