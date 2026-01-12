import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useNotifications } from '../../components/Notifications/useNotifications';
import { useEffect, useState } from 'react';
import React from 'react';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const { unreadCount, unreadChatCount, fetchNotifications } = useNotifications();
  const [totalUnread, setTotalUnread] = useState(0);

  useEffect(() => {
    setTotalUnread(unreadCount + unreadChatCount);
  }, [unreadCount, unreadChatCount]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#f0f2f5',
          borderTopColor: isDarkMode ? '#3D3D3D' : '#e0e0e0',
          height: 100,
        },
        tabBarActiveTintColor: isDarkMode ? '#4CAF50' : 'blue',
        tabBarInactiveTintColor: isDarkMode ? '#B0B0B0' : '#666',
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarIconStyle: {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: isDarkMode ? '#2C2C2C' : '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="map" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: 'Store',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="shopping-basket" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="league"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="trophy" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="users" size={24} color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread.toString() : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <FontAwesome name="user" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}