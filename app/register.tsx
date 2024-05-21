import {
  SafeAreaView,
  Text,
  View,
  TouchableHighlight,
  Image,
} from "react-native";
import { router } from "expo-router";
import { Input } from "../components/ui/input";
import { useState, useEffect } from "react";
import { User, LockKeyhole, Mail } from "lucide-react-native";
import useRegister from "../hooks/api/useRegister";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { saveCredentials } from "../util/logincache";

export default function Register() {
  return (
    <SafeAreaView className="flex-1 justify-center items-center space-y-8">
      <Image
        source={require("../assets/MissleWarsTitle.png")}
        className="w-[425px] h-[200px] absolute top-[25]"
        resizeMode="contain"
      />
      <SignUpForm />
    </SafeAreaView>
  );
}

const SignUpData = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9]+$/, "Username must only contain letters and numbers"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
});

type SignUpFormInputs = z.infer<typeof SignUpData>;

function SignUpForm() {
  const form = useForm({
    resolver: zodResolver(SignUpData),
    defaultValues: {
      email: "",
      username: "",
      password: "",
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = form;

  useEffect(() => {
    register("username");
    register("email");
    register("password");
  }, [register]);

  const mutation = useRegister(
    async () => {
      const { username, password } = form.getValues();
      await saveCredentials(username, password);
      router.navigate("/");
    },
  );

  const onSubmit = (data: SignUpFormInputs) => {
    console.log("Submission");
    const { username, email, password } = data;
    mutation.mutate({ username, password, email });
  };

  return (
    <View className="space-y-4 absolute top-[26%]">
      <Input
        placeholder="Username"
        onChangeText={(text) => setValue("username", text)}
        className="w-[90vw] h-[5vh] rounded-[20px]"
        icon={<User size={24} color="black" />}
      />
      {errors.username && (
        <Text className="text-red-800">{errors.username.message}</Text>
      )}
      <Input
        placeholder="Email"
        onChangeText={(text) => setValue("email", text)}
        className="w-[90vw] h-[5vh] rounded-[20px]"
        icon={
          <View className="inset-y-[9px]">
            <Mail size={24} color="black" />
          </View>
        }
      />
      {errors.email && (
        <Text className="text-red-800">{errors.email.message}</Text>
      )}
      <Input
        placeholder="Password"
        onChangeText={(text) => setValue("password", text)}
        className="w-[90vw] h-[5vh] rounded-[20px]"
        icon={
          <View className="inset-y-[7px]">
            <LockKeyhole size={24} color="black" />
          </View>
        }
      />
      {errors.password && (
        <Text className="text-red-800">{errors.password.message}</Text>
      )}
      <TouchableHighlight
        onPress={handleSubmit(onSubmit)}
        className="bg-[#773765] rounded-[20px] w-[375px] h-[45px] flex items-center justify-center absolute top-[120%]"
      >
        <View>
          <Text className="text-white font-bold">Sign Up!</Text>
        </View>
      </TouchableHighlight>
      <TouchableHighlight
        onPress={() => router.navigate("/login")}
        className="rounded-[20px] w-[375px] h-[45px] flex items-center justify-center border-2 mt-[5] absolute top-[350%]"
      >
        <View>
          <Text className=" font-bold">Return To Login</Text>
        </View>
      </TouchableHighlight>
    </View>
  );
}
