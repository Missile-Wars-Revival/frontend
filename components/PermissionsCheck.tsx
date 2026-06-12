import React, { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { View, Text, Pressable, StyleSheet, useColorScheme, Linking, Platform } from 'react-native';
import Ionicons from '@react-native-vector-icons/ionicons';

interface PermissionsCheckProps {
  children: React.ReactNode;
}

const PermissionsCheck: React.FC<PermissionsCheckProps> = ({ children }) => {
  const [permissionStatus, setPermissionStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const colorScheme = useColorScheme();

  const checkPermissions = useCallback(async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
  }, []);

  useEffect(() => {
    // checkPermissions awaits the native permission API before setState, so the
    // update is async and safe here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkPermissions();
  }, [checkPermissions]);

  const handleRequestPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'denied') {
      // Open app settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openSettings();
      }
    } else {
      const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(newStatus === 'granted' ? 'granted' : 'denied');
    }
  };

  if (permissionStatus === 'checking') {
    return null; // or a loading indicator
  }

  return (
    <View style={styles.container}>
      {children}
      {permissionStatus === 'denied' && (
        <Pressable
          style={[
            styles.banner,
            colorScheme === 'dark' ? styles.bannerDark : styles.bannerLight
          ]}
          onPress={handleRequestPermission}
        >
          <Ionicons
            name="location-outline"
            size={24}
            color="#FFFFFF" // White color for the icon
          />
          <Text style={[
            styles.bannerText
          ]}>
            Allow location access
          </Text>
          <Ionicons
            name="chevron-forward"
            size={24}
            color="#FFFFFF" // White color for the icon
          />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  banner: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bannerLight: {
    backgroundColor: '#4C3B96', // Royal purple for light mode
  },
  bannerDark: {
    backgroundColor: '#2A1E54', // Darker royal purple for dark mode
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
    marginRight: 10,
    color: '#FFFFFF', // White text for both light and dark modes
  },
});

export default PermissionsCheck;
