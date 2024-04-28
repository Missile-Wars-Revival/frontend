import { SafeAreaView, Text, Button, View } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/input";
import { useState } from "react";
import useRegister from "../hooks/api/useRegister";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutate = useRegister(() => {
    router.navigate("/login");
  });

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
      <Button
        title="Register"
        onPress={() => {
          mutate.mutate({ username, email, password });
        }}
      />
    </SafeAreaView>
  );
}
