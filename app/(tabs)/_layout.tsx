import React from 'react';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Redirect } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useNotifications } from '../../components/Notifications/useNotifications';
import { useAuth } from '../../util/Context/authcontext';

export default function TabLayout() {
  const { isSignedIn } = useAuth();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }
  const { unreadCount, unreadChatCount } = useNotifications();
  const totalUnread = unreadCount + unreadChatCount;

  return (
    <NativeTabs tintColor={isDarkMode ? '#4CAF50' : '#0000FF'}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map.fill" md="map" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="store">
        <NativeTabs.Trigger.Label>Store</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart.fill" md="storefront" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="league">
        <NativeTabs.Trigger.Label>Ranking</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="emoji_events" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Label>Friends</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        {totalUnread > 0 && (
          <NativeTabs.Trigger.Badge>{totalUnread.toString()}</NativeTabs.Trigger.Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
