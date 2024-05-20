import {
    SafeAreaView,
    Text,
    View,
    Image,
    TouchableHighlight,
  } from "react-native";
  import { router } from "expo-router";
  import { Input } from "../components/ui/input";
  import { useEffect, useState } from "react";
  import useLogin from "../hooks/api/useLogin";
  import { User, LockKeyhole } from "lucide-react-native";
  import React from "react";
  import { saveCredentials } from "../util/logincache";
  
  export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isError, setIsError] = useState(false);
  
    return (
      <SafeAreaView className="flex-1 items-center">
        <Image
          source={require("../assets/MissleWarsTitle.png")}
          className="w-[425] h-[200] mt-[0]"
          resizeMode="contain"
        />
        <View>
          <View className="space-y-4">
            <Input
              placeholder="Username"
              onChangeText={(text) => setUsername(text)}
              className="w-[90vw] h-[5vh] rounded-[20px]"
              icon={<User size={24} color="black" />}
            />
            <View>
              <Input
                placeholder="Password"
                onChangeText={(text) => setPassword(text)}
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
          setIsError={setIsError}
        />
        <Image
          source={require("../assets/cometDivider.png")}
          resizeMode="stretch"
          className="w-[425] h-[10%] mt-[240]"
        />
        <SignUpButton />
      </SafeAreaView>
    );
  }
  
  function LoginButton({
    username,
    password,
    setIsError,
    className,
  }: {
    username: string;
    password: string;
    setIsError: (error: boolean) => void;
    className?: string;
  }) {
    const mutation = useLogin(
      async () => {
        await saveCredentials(username, password);
        router.navigate("/index");
      },
      () => {
        setIsError(true);
      }
    );
    return (
      <TouchableHighlight
        onPress={() => mutation.mutate({ username, password })}
        className={`bg-[#773765] rounded-[20px] w-[375] h-[45] flex items-center justify-center mt-[40]`}
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
        className="rounded-[20px] w-[375px] h-[45px] flex items-center justify-center border-2 mt-[5]"
      >
        <View>
          <Text className=" font-bold">Sign up with Email</Text>
        </View>
      </TouchableHighlight>
    );
  }
  