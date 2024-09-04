import React, { useState, useEffect } from 'react';
import { View, Text, TouchableHighlight, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from "../components/ui/input";
import { User, LockKeyhole, Mail, ChevronLeft } from "lucide-react-native";
import * as SecureStore from 'expo-secure-store';
import { changeEmail, changePassword, changeUsername } from '../api/changedetails';
import { updateFriendsOnlyStatus } from '../api/visibility';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibilityMode, setVisibilityMode] = useState<'friends' | 'global'>('global');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadUserData();
    loadSettings();
  }, []);

  const loadUserData = async () => {
    const storedUsername = await SecureStore.getItemAsync('username');
    const storedEmail = await SecureStore.getItemAsync('email');
    setUsername(storedUsername || '');
    setEmail(storedEmail || '');
  };

  const loadSettings = async () => {
    const storedMode = await AsyncStorage.getItem('visibilitymode');
    if (storedMode !== null) {
      setVisibilityMode(storedMode as 'friends' | 'global');
    }
  };

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateUsername = (username: string) => {
    return username.length >= 3 && username.match(/^[a-zA-Z0-9]+$/);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/);
  };

  const handleUsernameChange = async () => {
    setUsernameError('');
    if (!validateUsername(username)) {
      setUsernameError('Username must be at least 3 characters long and contain only letters and numbers');
      return;
    }
    Alert.alert(
      "Confirm Username Change",
      `Are you sure you want to change your username to "${username}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changeUsername(username);
              await SecureStore.setItemAsync('username', username);
              Alert.alert("Success", "Username changed successfully");
            } catch (error) {
              console.error("Error changing username:", error);
              Alert.alert("Error", "Failed to change username. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleEmailChange = async (email: string) => {
    setEmailError('');
    if (!validateEmail(email)) {
      setEmailError('Invalid email address');
      return;
    }
    Alert.alert(
      "Confirm Email Change",
      `Are you sure you want to change your email to "${email}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changeEmail(email);
              await SecureStore.setItemAsync('email', email);
              Alert.alert("Success", "Email changed successfully");
            } catch (error) {
              console.error("Error changing email:", error);
              Alert.alert("Error", "Failed to change email. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (!validatePassword(newPassword)) {
      setPasswordError('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
      return;
    }
    Alert.alert(
      "Confirm Password Change",
      "Are you sure you want to change your password?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Confirm",
          onPress: async () => {
            try {
              await changePassword(newPassword);
              Alert.alert("Success", "Password changed successfully");
              setNewPassword('');
              setConfirmPassword('');
            } catch (error) {
              console.error("Error changing password:", error);
              Alert.alert("Error", "Failed to change password. Please try again.");
            }
          }
        }
      ]
    );
  };

  const toggleVisibilityMode = async () => {
    const newMode = visibilityMode === 'friends' ? 'global' : 'friends';
    setVisibilityMode(newMode);
    await AsyncStorage.setItem('visibilitymode', newMode);
    updateFriendsOnlyStatus(newMode === 'friends');

    if (newMode === 'global') {
      Alert.alert(
        "Change to Global Mode",
        "You are about to change your visibility to global. Everyone will be able to see your location.",
        [
          {
            text: "Cancel",
            onPress: () => {
              console.log("Change cancelled");
              setVisibilityMode('friends');
            },
            style: "cancel"
          },
          {
            text: "Confirm",
            onPress: async () => {
              await AsyncStorage.setItem('visibilitymode', newMode);
              await updateFriendsOnlyStatus(newMode === 'global');
              console.log("Visibility mode changed to:", newMode);
            }
          }
        ]
      );
    } else {
      console.log("Visibility mode changed to:", newMode);
    }
  };

  return (
    <ScrollView>
      <SafeAreaView className="flex-1 items-center bg-gray-100">
        <TouchableHighlight 
          onPress={() => router.back()} 
          className="self-start ml-4 mt-4"
        >
          <View className="flex-row items-center">
            <ChevronLeft size={24} color="#007AFF" />
            <Text className="text-lg text-blue-500 ml-1">Back</Text>
          </View>
        </TouchableHighlight>
        
        <Text className="text-3xl font-bold mb-8 mt-4">Settings</Text>

        <View className="w-full px-4 space-y-6">
          <View className="space-y-4">
            <Input
              placeholder={username || "Username"}
              onChangeText={(text) => {
                setUsername(text);
                setUsernameError('');
              }}
              icon={<User size={24} color="black" />}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {usernameError ? (
              <Text className="text-red-500 text-sm">{usernameError}</Text>
            ) : null}
            <TouchableHighlight 
              onPress={handleUsernameChange}
              className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
            >
              <Text className="text-white font-bold">Change Username</Text>
            </TouchableHighlight>

            <View className="space-y-2">
              <Input
                placeholder={email || "Email"}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError('');
                }}
                icon={<Mail size={24} color="black" />}
                className="w-[90vw] h-[5vh] rounded-[20px]"
              />
              {emailError ? (
                <Text className="text-red-500 text-sm">{emailError}</Text>
              ) : null}
              <TouchableHighlight 
                onPress={() => handleEmailChange(email)}
                className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
              >
                <Text className="text-white font-bold">Change Email</Text>
              </TouchableHighlight>
            </View>

            <Input
              placeholder="New Password"
              value={newPassword}
              secureTextEntry={true}
              autoCorrect={false}
            autoCapitalize="none"
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              icon={
                <View style={{ marginTop: 12 }}>
                  <LockKeyhole size={24} color="black" />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <Input
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError('');
              }}
              secureTextEntry
              icon={
                <View style={{ marginTop: 12 }}>
                  <LockKeyhole size={24} color="black" />
                </View>
              }
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            {passwordError ? (
              <Text className="text-red-500 text-sm">{passwordError}</Text>
            ) : null}
            <TouchableHighlight 
              onPress={handlePasswordChange}
              className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
            >
              <Text className="text-white font-bold">Change Password</Text>
            </TouchableHighlight>
          </View>

          <View className="flex-row justify-between items-center bg-white p-4 rounded-[20px] w-[90vw]">
            <Text className="text-lg font-bold">Visibility Mode</Text>
            <Switch
              value={visibilityMode === 'global'}
              onValueChange={toggleVisibilityMode}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={visibilityMode === 'global' ? "#5c2a4f" : "#ffffff"}
            />
            <Text>{visibilityMode === 'global' ? 'Global' : 'Friends Only'}</Text>
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default SettingsPage;
