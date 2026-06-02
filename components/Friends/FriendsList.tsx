import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

export interface FriendListItem {
  username: string;
  profileImageUrl: string;
}

export interface FriendsListProps {
  friends: FriendListItem[];
  isDarkMode: boolean;
  /** Whether the "fire missile" action should be available (player alive + location active). */
  showFire: boolean;
  onProfilePress: (username: string) => void;
  onFirePress: (username: string) => void;
  onRemovePress: (username: string) => void;
}

/**
 * Default (web / fallback) implementation. Native platforms use the SwiftUI
 * (`.ios.tsx`) and Jetpack Compose (`.android.tsx`) variants resolved by Metro.
 */
export default function FriendsList({
  friends,
  isDarkMode,
  showFire,
  onProfilePress,
  onFirePress,
  onRemovePress,
}: FriendsListProps) {
  return (
    <FlatList
      data={friends}
      keyExtractor={(item) => item.username}
      renderItem={({ item }) => (
        <View style={[styles.row, isDarkMode && styles.rowDark]}>
          <TouchableOpacity style={styles.info} onPress={() => onProfilePress(item.username)}>
            <Image source={{ uri: item.profileImageUrl }} style={styles.avatar} cachePolicy="memory-disk" />
            <Text style={[styles.name, isDarkMode && styles.nameDark]}>{item.username}</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            {showFire && (
              <TouchableOpacity style={[styles.btn, styles.fire]} onPress={() => onFirePress(item.username)}>
                <Text style={styles.btnText}>🚀</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.remove]} onPress={() => onRemovePress(item.username)}>
              <Text style={styles.btnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  rowDark: { backgroundColor: '#2C2C2C' },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  name: { fontSize: 18, fontWeight: 'bold', color: '#2d3748' },
  nameDark: { color: '#FFF' },
  actions: { flexDirection: 'row' },
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  fire: { backgroundColor: '#e53e3e' },
  remove: { backgroundColor: '#718096' },
  btnText: { color: '#ffffff', fontSize: 18 },
});
