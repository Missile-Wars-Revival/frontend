import React, { useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import MapView, { PROVIDER_GOOGLE, Circle, Marker } from "react-native-maps";
import { Image } from 'react-native';
import * as Location from 'expo-location';

//Themes
import { DefaultMapStyle } from './Themes/DefaultMapStyle';
import { RadarMapStyle } from './Themes/RadarMapStyle';
import { CherryBlossomMapStyle } from './Themes/CherryBlossomMapStyle';

//Stylesheet
import { styles } from './styles';

//import username
import { userNAME } from './login.js';

// Loot Component
const Loot = ({ location }) => (
  <MapView.Circle
    center={location}
    radius={40} // 40 meters
    fillColor="rgba(0, 0, 255, 0.5)" // Blue color
    strokeColor="rgba(0, 0, 255, 0.8)"
  />
);

// Missile Component
const Missile = ({ location, radius }) => (
  <MapView.Circle
    center={location}
    radius={radius}
    fillColor="rgba(255, 0, 0, 0.5)" // Red color
    strokeColor="rgba(255, 0, 0, 0.8)"
  />
);

const MapStylePopup = ({ visible, onClose, onSelect }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.centeredView}
        activeOpacity={1}
        onPressOut={onClose}
      >
        <View style={styles.modalView}>
          <TouchableOpacity onPress={() => onSelect('default')} style={styles.button}>
            <Text style={styles.buttonText}>Default</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSelect('radar')} style={styles.button}>
            <Text style={styles.buttonText}>Radar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onSelect('cherry')} style={styles.button}>
            <Text style={styles.buttonText}>Cherry Blossom</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

//calculating last seen on map
const getTimeDifference = (timestamp) => {
  const currentTime = new Date();
  const lastSeenTime = new Date(timestamp);
  const differenceInMilliseconds = currentTime - lastSeenTime;
  const differenceInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

  if (differenceInMinutes < 1) {
    return { text: "Last seen: Just now", color: "green" };
  }

  return { text: `Last seen: ${differenceInMinutes} min ago`, color: "black" };
};



export default function Map() {

  const defaultRegion = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 90,
    longitudeDelta: 90,
  };
  
  const [region, setRegion] = useState(defaultRegion);
  const [selectedMapStyle, setSelectedMapStyle] = useState(DefaultMapStyle);
  const [popupVisible, setPopupVisible] = useState(false);
  const [lootLocations, setLootLocations] = useState([]);
  const [missileData, setMissileData] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const [otherPlayersData, setOtherPlayersData] = useState([]);

  const fetchOtherPlayers = async () => {
    const data = await fetchOtherPlayersData();
    setOtherPlayersData(data);
  };

  useEffect(() => {
    fetchOtherPlayers();
  }, []);


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
      setUserLocation(userLoc); // Update userLocation
    } catch (error) {
      console.log('Error fetching location:', error.message);
    }
  }, []);  

const apiUrl = 'http://172.20.10.5:3000/api/';

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
    console.error(`Error fetching data: ${error.message}`);
    throw error;
  }
};

const sendLocationToBackend = async () => {
  try {
    // Ensure location data is available
    if (userLocation && userLocation.latitude && userLocation.longitude) {
      const { latitude, longitude } = userLocation;
      const timestamp = new Date().toISOString();
      
      const data = {
        username: userNAME,
        latitude,
        longitude,
        timestamp,
      };

      const response = await fetchData('sendLocation', 'POST', data);
      console.log('Location sent successfully:', response);
    } else {
      console.log('Latitude or longitude is missing');
    }
  } catch (error) {
    console.error('Error sending location to backend:', error.message);
  }
};
useEffect(() => {
  const fetchDataAndSendLocation = async () => {
    await fetchLocation(); // Fetch location

    if (userLocation && userLocation.latitude && userLocation.longitude) {
      sendLocationToBackend(); // Send location to backend
    } else {
      console.log('Latitude or longitude is missing');
    }
  };

  fetchDataAndSendLocation(); // Initial fetch and send

  // Set interval to fetch and send location every 30 seconds
  const intervalId = setInterval(fetchDataAndSendLocation, 30000);

  // Cleanup interval on component unmount
  return () => {
    clearInterval(intervalId);
  };
}, []);


const fetchOtherPlayersData = async () => {
  try {
    const data = await fetchData('getOtherPlayersData');
    console.log('Other players data fetched successfully:', data);
    
    // Filter out players with the same username
    const filteredData = data.filter(player => player.username !== userNAME); 
    
    return filteredData;
  } catch (error) {
    console.error('Error fetching other players data:', error.message);
    return [];
  }
};

useEffect(() => {
  fetchOtherPlayers();

  // Fetch other players' data every 30 seconds
  const intervalId = setInterval(fetchOtherPlayers, 30000); // 30 seconds

  // Cleanup interval on component unmount
  return () => {
    clearInterval(intervalId);
  };
}, []);
  
  const checkMissileCollision = () => {
    for (let missile of missileData) {
      const distance = getDistance(userLocation.latitude, userLocation.longitude, missile.location.latitude, missile.location.longitude);
      if (distance <= missile.radius) {
        alert("Warning: You are in the radius of a missile!");
        console.log("Player died");
        break;
      }
    }
  };
  
  const checkLootCollection = () => {
    for (let loot of lootLocations) {
      const distance = getDistance(userLocation.latitude, userLocation.longitude, loot.latitude, loot.longitude);
      if (distance <= 40) { // Assuming loot radius is 40 meters
        alert("You've found loot nearby!");
        console.log("Loot collected");
        break;
      }
    }
  };
  
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Distance in meters
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    if (userLocation) {
      checkMissileCollision();
      checkLootCollection();
      sendLocationToBackend(userLocation.latitude, userLocation.longitude); // Send location to backend
    }
  }, [userLocation]);
  
  

  const fetchLootAndMissiles = useCallback(() => {
    // Fetch loot and missile data from backend
    const fetchLootFromBackend = async () => {
      // Simulated fetch function to get loot data:
      return [
        { latitude: 51.026281, longitude: -3.113764 }, // Loot location 1 TS
        { latitude: 45.305, longitude: -0.860 }, // Loot location 2
      ];
    };
  
    const fetchMissilesFromBackend = async () => {
      // Simulated fetch function to get missile data:
      return [
        { location: { latitude: 45.2949318, longitude: -0.852764 }, radius: 100 }, //temp missile locaiton 
        { location: { latitude: 51.025316, longitude: -3.115612 }, radius: 50 }, //2nd temp missle location TS
      ];
    };
  
    const updateData = async () => {
      const lootData = await fetchLootFromBackend();
      const missileData = await fetchMissilesFromBackend();
  
      setLootLocations(lootData);
      setMissileData(missileData);
    };
  
    // Initial fetch
    updateData();
  
    // Fetch data every 30 seconds
    const intervalId = setInterval(updateData, 30000); // 30 seconds
  
    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    fetchLootAndMissiles();
  }, [fetchLootAndMissiles]);

  const showPopup = () => {
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const selectMapStyle = (style) => {
    closePopup();
    switch (style) {
      case 'default':
        setSelectedMapStyle(DefaultMapStyle);
        break;
      case 'radar':
        setSelectedMapStyle(RadarMapStyle);
        break;
      case 'cherry':
        setSelectedMapStyle(CherryBlossomMapStyle);
        break;
      default:
        break;
    }
  };
//logs for location 
//console.log("lootLocations:", lootLocations);
//console.log("missileData:", missileData);


//To allow player to upload their own this is modular
  const resizedMarkerImage = require('./mapicons/logo.png'); // Your custom image path
  const resizedImageStyle = { width: 40, height: 40}; // Custom size for image

  return (
    <View style={styles.container}>

      <MapView
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  region={region}
  showsUserLocation={true}
  showsMyLocationButton={true}
  customMapStyle={selectedMapStyle}
>
  {/* Render Loot Drops */}
  {lootLocations.map((location, index) => (
    <Circle
    key={index}
    center={location}
    radius={20} //actual radius size
    fillColor="rgba(0, 0, 255, 0.5)"
    strokeColor="rgba(0, 0, 255, 0.8)"
  />  
  ))}

  {/* Render Missiles */}
  {missileData.map(({ location, radius }, index) => (
    <Circle
      key={index}
      center={location}
      radius={radius}
      fillColor="rgba(255, 0, 0, 0.5)"
      strokeColor="rgba(255, 0, 0, 0.8)"
    />
  ))}

{otherPlayersData.map((player, index) => {
    const { text, color } = getTimeDifference(player.timestamp);
    
    return (
        <React.Fragment key={index}>
            <Circle
                center={{ latitude: player.latitude, longitude: player.longitude }}
                radius={4} // Assuming a radius for other players
                fillColor="rgba(0, 255, 0, 0.2)" // Green color
                strokeColor="rgba(0, 255, 0, 0.8)"
            />
            <Marker
                key={index}
                coordinate={{ latitude: player.latitude, longitude: player.longitude }}
                title={player.username}
                description={text}//Finding it really hard to set "just now" as green
                style={{ color: color }}
            >
                {/* Use resized image for the Marker */}
                <Image
                    source={resizedMarkerImage}
                    style={resizedImageStyle}
                />
            </Marker>
        </React.Fragment>
    );
})}

</MapView>

      {/* Dropdown button */}
      <TouchableOpacity style={styles.dropdownButton} onPress={showPopup}>
        <Text style={styles.dropdownButtonText}>Theme</Text>
      </TouchableOpacity>

      <MapStylePopup
        visible={popupVisible}
        onClose={closePopup}
        onSelect={selectMapStyle}
      />
    </View>
  );
}