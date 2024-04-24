import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';

const backendUrl: string = process.env.EXPO_PUBLIC_BACKEND_URL!;
const apiUrl: string = `${backendUrl}:3000/api/`;
import { userNAME } from "../temp/login";

interface Player {
  username: string;
  timestamp: string;
  // Add other properties if necessary
}

const QuickAddPage: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [playersData, setPlayersData] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc);
    } catch (error) {
      console.log('Error fetching location:');
    }
  }, []);

  const fetchData = async (endpoint: string, method: string = 'GET', data: any = null) => {
    const config: { 
      method: string; 
      headers: { 'Content-Type': string }; 
      body?: string | null; 
    } = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
  config.body = JSON.stringify(data as object);
}


    try {
      const response = await fetch(apiUrl + endpoint, config);

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`Error fetching data`);
      throw error;
    }
  };

  const fetchOtherPlayersData = async () => {
    try {
      const data = await fetchData('getOtherPlayersData');
      
      const filteredData = data.filter((player: Player) => player.username !== userNAME);
      
      const currentTime = new Date().getTime();
      const twoWeeksInMillis = 2 * 7 * 24 * 60 * 60 * 1000;
      
      const recentPlayersData = filteredData.filter((player: Player) => {
        const playerTime = new Date(player.timestamp).getTime();
        return currentTime - playerTime <= twoWeeksInMillis;
      });
      
      setPlayersData(recentPlayersData);
      setLoading(false);
    } catch (error) {
      console.log('Error fetching other players data:');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation();
    fetchOtherPlayersData();
  }, []);

  const renderItem = ({ item }: { item: Player }) => (
    <View style={styles.playerItem}>
      <Text style={styles.playerName}>{item.username}</Text>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Add friend logic */}}
        >
          <Text style={styles.actionButtonText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => {/* Remove friend logic */}}
        >
          <Text style={styles.actionButtonText}>x</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search for friends..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        playersData.length === 0 ? (
          <Text style={styles.noPlayersText}>No players found near you</Text>
        ) : (
          <>
            <Text style={styles.title}>Player's Nearby:</Text>
            <FlatList
              data={playersData}
              renderItem={renderItem}
              keyExtractor={(item) => item.username}
            />
          </>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  playerName: {
    flex: 1,
    fontSize: 18,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    width: 35,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 13,
  },
  noPlayersText: {
    textAlign: 'center',
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 10,
  },
});

export default QuickAddPage;
