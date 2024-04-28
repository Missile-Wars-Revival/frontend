import {
  SafeAreaView,
  Text,
  View,
  Image,
  TouchableHighlight,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState } from "react";
import useLogin from "../hooks/api/useLogin";
import { User, LockKeyhole } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import CometDivider from "../assets/jsxSvgs/cometDivider";

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
      <Image
        source={require("../assets/MissleWarsTitle.png")}
        className="w-[425px] h-[200px] absolute top-[25]"
        resizeMode="contain"
      />
      <View className="space-y-4 absolute top-[25%]">
        <Input
          placeholder="Username"
          onChangeText={(text) => setUsername(text)}
          className="w-[90vw] h-[5vh] rounded-[20px]"
          icon={<User size={24} color="black" />}
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
      <LoginButton username={username} password={password} />
      {isError && (
        <Text className={"text-red-700 text-lg"}>
          Invalid username or password
        </Text>
      )}
      <CometDivider
        width={Dimensions.get("window").width * 2.4}
        height={Dimensions.get("window").height * 1.15}
        className="absolute bottom-[-25%] fill-gray-400"
      />
      <SignUpButton />
    </SafeAreaView>
  );
}

function LoginButton({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const mutation = useLogin(() => {
    router.navigate("/");
  });

  return (
    <TouchableHighlight
      onPress={() => mutation.mutate({ username, password })}
      className="bg-[#773765] rounded-[20px] w-[375px] h-[45px] flex items-center justify-center absolute top-[44%]"
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
      className="rounded-[20px] w-[375px] h-[45px] flex items-center justify-center absolute bottom-[10%] border-2"
    >
      <View>
        <Text className=" font-bold">Sign up with Email</Text>
      </View>
    </TouchableHighlight>
  );
}
