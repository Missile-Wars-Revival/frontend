import React, { useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import MapView, { PROVIDER_GOOGLE, Circle } from "react-native-maps";
import * as Location from 'expo-location';

const DefaultMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      { "color": "#f5f5f5" }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#616161" }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#f5f5f5" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      { "color": "#dadada" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#616161" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#0077be" } // Ocean blue color
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#9e9e9e" }
    ]
  }
];

const RadarMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      { "color": "#212121" }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#212121" }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#9e9e9e" }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#bdbdbd" }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      { "color": "#181818" }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#616161" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      { "color": "#2c2c2c" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8a8a8a" }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      { "color": "#373737" }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      { "color": "#3c3c3c" }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      { "color": "#4e4e4e" }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#616161" }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#757575" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#000000" }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#3d3d3d" }
    ]
  }
];

const CherryBlossomMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      { "color": "#f5f5f5" } // Light grey color
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8C4356" } // Cherry blossom pink color
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      { "color": "#f5f5f5" } // Light grey color
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8C4356" } // Cherry blossom pink color
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [
      { "color": "#ffffff" } // White color
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      { "visibility": "off" }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8C4356" } // Cherry blossom pink color
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      { "color": "#dadada" } // Light grey color
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#8C4356" } // Cherry blossom pink color
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      { "color": "#E8B3C2" } // Light cherry blossom pink color
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#9e9e9e" } // Grey color
    ]
  }
];

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

  const fetchLocation = useCallback(async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Permission to access location was denied');
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
  }, []);

  const fetchLootAndMissiles = useCallback(() => {
    // Fetch loot and missile data from backend
    const fetchLootFromBackend = async () => {
      // Simulated fetch function to get loot data:
      return [
        { latitude: 51.0284388, longitude: -3.1001024 }, // Loot location 1 
        { latitude: 45.305, longitude: -0.860 }, // Loot location 2
      ];
    };
  
    const fetchMissilesFromBackend = async () => {
      // Simulated fetch function to get missile data:
      return [
        { location: { latitude: 45.2949318, longitude: -0.852764 }, radius: 100 }, //temp missile locaiton 
        { location: { latitude: 51.0256046, longitude: -3.1085848 }, radius: 500 }, //2nd temp missle location 
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
  
    // Fetch data every 60 seconds
    const intervalId = setInterval(updateData, 60000); // 60 seconds
  
    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    fetchLocation();
    fetchLootAndMissiles();
  }, [fetchLocation, fetchLootAndMissiles]);

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
    radius={40} //actual radius size
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f4f4',
  },
  header: {
    fontSize: 24,
    color: "#333",
    textAlign: "center",
    paddingTop: 20,
    paddingBottom: 10,
  },
  map: {
    flex: 1,
  },
  dropdownButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    padding: 10,
  },
  dropdownButtonText: {
    fontSize: 16,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 5,
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f4f4f4',
    width: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
  },
});

