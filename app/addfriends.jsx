import React, { useState, useEffect, useCallback } from 'react';
import { Text, View, TextInput, FlatList, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';

const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
const apiUrl = `${backendUrl}:3000/api/`;
const userNAME = 'test'; // Placeholder for username

const QuickAddPage = () => {
  const [userLocation, setUserLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [playersData, setPlayersData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLocation = useCallback(async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission to access location was denied');
        return;
      }
  
      let location = await Location.getCurrentPositionAsync({});
      console.log('Location from getCurrentPositionAsync:', location); // Log location data
  
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(userLoc); // Update userLocation
      console.log('Updated userLocation:', userLoc); // Log updated userLocation
    } catch (error) {
      console.log('Error fetching location:', error.message);
    }
  }, []);  

  const fetchData = async (endpoint, method = 'GET', data = null) => {
    const config = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(apiUrl + endpoint, config);

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.log(`Error fetching data: ${error.message}`);
      throw error;
    }
  };

  const fetchOtherPlayersData = async () => {
    try {
      const data = await fetchData('getOtherPlayersData');
      console.log('Other players data fetched successfully:', data);
      
      // Filter out players with the same username
      const filteredData = data.filter(player => player.username !== userNAME); 
      
      setPlayersData(filteredData);
      setLoading(false);
    } catch (error) {
      console.log('Error fetching other players data:', error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocation(); // Fetch location
    fetchOtherPlayersData(); // Fetch other players data
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => {/* Add friend logic */}}>
      <Text>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <TextInput
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingHorizontal: 10 }}
        placeholder="Search for friends..."
        value={searchTerm}
        onChangeText={setSearchTerm}
      />
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        playersData.length === 0 ? (
          <Text style={{ textAlign: 'center', fontSize: 16 }}>No players found near you</Text>
        ) : (
          <>
            <Text style={{ fontSize: 20, marginBottom: 10 }}>Quick Add Players Near You</Text>
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

export default QuickAddPage;
