import {
  SafeAreaView,
  Text,
  View,
  TouchableHighlight,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState } from "react";
import { User, LockKeyhole, Mail } from "lucide-react-native";
import useRegister from "../hooks/api/useRegister";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView className="flex-1 justify-center items-center space-y-8">
      <Image
        source={require("../assets/MissleWarsTitle.png")}
        className="w-[425px] h-[200px] absolute top-[25]"
        resizeMode="contain"
      />
      <View className="space-y-4 absolute top-[26%]">
        <Input
          placeholder="Username"
          onChangeText={(text) => setUsername(text)}
          className="w-[90vw] h-[5vh] rounded-[20px]"
          icon={<User size={24} color="black" />}
        />
        <Input
          placeholder="Email"
          onChangeText={(text) => setEmail(text)}
          className="w-[90vw] h-[5vh] rounded-[20px]"
          icon={
            <View className="inset-y-[9px]">
              <Mail size={24} color="black" />
            </View>
          }
        />
        <Input
          placeholder="Password"
          onChangeText={(text) => setPassword(text)}
          className="w-[90vw] h-[5vh] rounded-[20px]"
          icon={
            <View className="inset-y-[7px]">
              <LockKeyhole size={24} color="black" />
            </View>
          }
        />
      </View>
      <SignUpButton email={email} username={username} password={password} />
    </SafeAreaView>
  );
}

function SignUpButton({
  email,
  username,
  password,
}: {
  email: string;
  username: string;
  password: string;
}) {
  const mutation = useRegister(() => {
    router.navigate("/");
  });

  return (
    <TouchableHighlight
      onPress={() => mutation.mutate({ username, password, email })}
      className="bg-[#773765] rounded-[20px] w-[375px] h-[45px] flex items-center justify-center absolute top-[60%]"
    >
      <View>
        <Text className="text-white font-bold">Sign Up!</Text>
      </View>
    </TouchableHighlight>
  );
}
