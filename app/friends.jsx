import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const fireMissile = (username) => {
  console.log(`Firing missile for friend with username: ${username}`);
};

const FriendsPage = () => {
  const [friends, setFriends] = useState([
    { username: 'Alice' },
    { username: 'Bob' },
    { username: 'Charlie' },
  ]);

  const navigation = useNavigation(); // Access the navigation object

  const navigateToAddFriends = () => {
    navigation.navigate('addfriends'); // Navigate to 'AddFriends' page
  };

  return (
    <View style={styles.friendsContainer}>
      <View style={styles.header}>
        {/* Plus button */}
        <TouchableOpacity style={styles.plusButton} onPress={navigateToAddFriends}>
          <Text style={styles.plusButtonText}>+</Text>
        </TouchableOpacity>

        {/* Bell icon */}
        <TouchableOpacity style={styles.bellIcon}>
          <Text>🔔</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={friends}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.friendItem}>
            <Text>{item.username}</Text>
            <TouchableOpacity style={styles.fireMissileButton} onPress={() => fireMissile(item.username)}>
              <Text style={styles.fireMissileButtonText}>Fire Missile</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  friendsContainer: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  plusButton: {
    backgroundColor: 'skyblue',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusButtonText: {
    fontSize: 20,
    lineHeight: 20,
    color: 'white',
  },  
  bellIcon: {
    fontSize: 24,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  fireMissileButton: {
    backgroundColor: 'red',
    padding: 5,
    borderRadius: 5,
  },
  fireMissileButtonText: {
    color: 'white',
  },
});

export default FriendsPage;
