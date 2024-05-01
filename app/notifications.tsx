import React from 'react';
import { View, Text } from 'react-native';

interface Notification {
  id: number;
  message: string;
}

const NotificationsPage: React.FC = () => {
  // Sample notifications data
  const notifications: Notification[] = [
    { id: 1, message: 'New message from John Doe' },
    { id: 2, message: 'You have a new friend request' },
    { id: 3, message: 'Reminder: Meeting at 3 PM' },
  ];

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Notifications</Text>
      {notifications.map(notification => (
        <View key={notification.id} style={{ marginBottom: 10 }}>
          <Text>{notification.message}</Text>
        </View>
      ))}
    </View>
  );
};

export default NotificationsPage;
