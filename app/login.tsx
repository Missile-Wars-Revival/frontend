import { SafeAreaView, Text, Button, View } from "react-native";
import { Input } from "../components/input";
import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function handleLogin(username: string, password: string) {
    axios
      .post("http://192.168.1.75:3001/api/login", {
        username,
        password,
      })
      .then((response) => {
        console.log(response.data);
        if (response.status === 200) {
          setIsLoggedIn(true);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <SafeAreaView className="flex-1 justify-center items-center space-y-8">
      {isLoggedIn ? (
        <Text className="text-green-700 text-2xl">Logged In!</Text>
      ) : (
        <Text className="text-red-700 text-2xl">Not Logged In</Text>
      )}
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
    </SafeAreaView>
  );
}
