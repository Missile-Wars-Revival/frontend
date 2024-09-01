import React, { useState, useEffect } from 'react';
import { View, Text, TouchableHighlight, Switch, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Input } from "../components/ui/input";
import { User, LockKeyhole, Mail, ChevronLeft } from "lucide-react-native";
import * as SecureStore from 'expo-secure-store';
import axiosInstance from '../api/axios-instance';

const SettingsPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [friendsOnly, setFriendsOnly] = useState(false);

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
    const friendsOnlySetting = await SecureStore.getItemAsync('friendsOnly');
    setFriendsOnly(friendsOnlySetting === 'true');
  };

  const handleUsernameChange = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      await axiosInstance.post('/api/change-username', { newUsername: username }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await SecureStore.setItemAsync('username', username);
      Alert.alert('Success', 'Username updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update username');
    }
  };

  const handleEmailChange = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      await axiosInstance.post('/api/change-email', { newEmail: email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await SecureStore.setItemAsync('email', email);
      Alert.alert('Success', 'Email updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update email');
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      const token = await SecureStore.getItemAsync('token');
      await axiosInstance.post('/api/change-password', { newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    }
  };

  const toggleFriendsOnly = async () => {
    const newValue = !friendsOnly;
    setFriendsOnly(newValue);
    await SecureStore.setItemAsync('friendsOnly', newValue.toString());
    // You might want to send this setting to your backend as well
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
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              icon={<User size={24} color="black" />}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <TouchableHighlight 
              onPress={handleUsernameChange}
              className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
            >
              <Text className="text-white font-bold">Change Username</Text>
            </TouchableHighlight>

            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              icon={<Mail size={24} color="black" />}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <TouchableHighlight 
              onPress={handleEmailChange}
              className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
            >
              <Text className="text-white font-bold">Change Email</Text>
            </TouchableHighlight>

            <Input
              placeholder="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              icon={<LockKeyhole size={24} color="black" />}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <Input
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon={<LockKeyhole size={24} color="black" />}
              className="w-[90vw] h-[5vh] rounded-[20px]"
            />
            <TouchableHighlight 
              onPress={handlePasswordChange}
              className="bg-[#773765] rounded-[20px] w-[90vw] h-[5.3vh] flex items-center justify-center"
            >
              <Text className="text-white font-bold">Change Password</Text>
            </TouchableHighlight>
          </View>

          <View className="flex-row justify-between items-center bg-white p-4 rounded-[20px] w-[90vw]">
            <Text className="text-lg font-bold">Friends Only Mode</Text>
            <Switch
              value={friendsOnly}
              onValueChange={toggleFriendsOnly}
              trackColor={{ false: "#cbd5e0", true: "#773765" }}
              thumbColor={friendsOnly ? "#5c2a4f" : "#ffffff"}
            />
          </View>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

export default SettingsPage;
