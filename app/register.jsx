import { SafeAreaView, Text, Button, View } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/input";
import { useState } from "react";
import axios from "axios";
import Constants from "expo-constants";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  console.log(backendUrl);

  function handleRegister(username, email, password) {
    axios
      .post(`${backendUrl}:3000/api/register`, {
        username,
        email,
        password,
      })
      .then((response) => {
        console.log(response.data);
        if (response.status === 200) {
          router.navigate("/"); // navigate to login page after successful registration
        }
      })
      .catch((error) => {
        console.log(error);
        setIsError(true);
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
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          className="w-[50vw]"
        />
        <Input
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          className="w-[50vw]"
        />
      </View>
      <Button title="Register" onPress={() => handleRegister(username, email, password)} />
      {isError && (
        <Text className={"text-red-700 text-lg"}>
          Registration failed. Please try again.
        </Text>
      )}
    </SafeAreaView>
  );
}