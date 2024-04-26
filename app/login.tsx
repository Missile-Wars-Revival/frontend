import { SafeAreaView, Text, Button, View } from "react-native";
import { router } from "expo-router";
import { Input } from "../components/input";
import { useState } from "react";
import useLogin from "../hooks/useLogin";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isError, setIsError] = useState(false);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  //console.log(backendUrl);

  const mutation = useLogin(() => {
    router.navigate("/");
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
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          className="w-[50vw]"
        />
      </View>
      <Button
        title="Login!"
        onPress={() => mutation.mutate({ username, password })}
      />
      {isError && (
        <Text className={"text-red-700 text-lg"}>
          Invalid username or password
        </Text>
      )}
    </SafeAreaView>
  );
}
