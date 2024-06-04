import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, Image, TouchableOpacity, Switch } from 'react-native';
import { router } from 'expo-router';
import { clearCredentials } from '../util/logincache';
import { useUserName } from '../util/fetchusernameglobal';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfilePage: React.FC = () => {

  const userNAME = useUserName(); //logged in user

  const handleLogout = async () => {
    await clearCredentials();
    router.push("/login");
  };

  const [useBackgroundLocation, setUseBackgroundLocation] = useState(false);

    useEffect(() => {
        loadPreference();
    }, []);

    const loadPreference = async () => {
        const preference = await AsyncStorage.getItem('useBackgroundLocation');
        setUseBackgroundLocation(preference === 'true');
    };

    const toggleSwitch = async () => {
        const newValue = !useBackgroundLocation;
        setUseBackgroundLocation(newValue);
        await AsyncStorage.setItem('useBackgroundLocation', newValue.toString());
    };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Profile Page</Text>
      </View>
      <View style={styles.profileContainer}>
        <Image
          style={styles.profileImage}
          source={{ uri: 'https://via.placeholder.com/150' }}
        />
        <Text style={styles.profileName}>{userNAME}</Text>
        <Text style={styles.profileDetails}>Email: example@example.com</Text>
        <Text style={styles.profileDetails}>rank or somthing here</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
        <Text></Text>
        <Text>{useBackgroundLocation ? 'Background Location Access (doesnt work expo go)' : 'Foreground Location Access'}</Text>
            <Switch
                onValueChange={toggleSwitch}
                value={useBackgroundLocation}
            />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#6200ea',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  profileName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileDetails: {
    fontSize: 16,
    color: '#606060',
    marginBottom: 5,
  },
  logoutButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#d9534f',
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
});

export default ProfilePage;
