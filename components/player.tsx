import React, { useState, useEffect, useMemo } from "react";
import { Button, View, Image, Text, Modal, Dimensions, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Circle, Marker } from "react-native-maps";
import { MissileLibrary } from "./Missile/missile";
import { Players } from "./map-players";
import { useUserName } from "../util/fetchusernameglobal";
import { fetchAndCacheImage } from "../util/imagecache";
import useFetchFriends from "../hooks/websockets/friendshook";

const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png");
const carImage = require("../assets/transport/car.png");
const planeImage = require("../assets/transport/plane.png");
const trainImage = require("../assets/transport/train.png");
//const bicycleImage = require("../assets/transport/bicycle.png");
//const shipImage = require("../assets/transport/ship.png");
const boatImage = require("../assets/transport/boat.png");
// const walkingImage = require("../assets/transport/walking.png");

const getTransportImage = (status: string) => {
  switch (status) {
    case 'plane': return planeImage;
    case 'highspeed': return trainImage;
    case 'car': return carImage;
    //case 'bicycle': return bicycleImage;
    //case 'ship': return shipImage;
    case 'boat': return boatImage;
    //case 'walking': return walkingImage;
    default: return null;
  }
};

const styles = StyleSheet.create({
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  username: {
    color: 'grey',
    marginTop: 2,
    fontSize: 12,
  },
  healthBarContainer: {
    width: 36,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginTop: 2,
  },
  healthBar: {
    height: '100%',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlayDark: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    width: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height - 200,
  },
  modalContentDark: {
    backgroundColor: '#1E1E1E',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f7fafc',
  },
  modalHeaderDark: {
    backgroundColor: '#2C2C2C',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3748',
  },
  modalTitleDark: {
    color: '#FFF',
  },
  doneButton: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  doneButtonDark: {
    backgroundColor: '#3D3D3D',
  },
  doneButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  doneButtonTextDark: {
    color: '#4CAF50',
  },
  fireMissileButton: {
    backgroundColor: 'red',
    borderRadius: 5,
    marginTop: 2,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fireMissileText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

interface PlayerProps {
  location: { latitude: number; longitude: number };
  player: Players;
  timestamp: string;
  health: number;
  transportStatus: string;
  index: number;
  randomlocation: boolean;
}

export const getLeagueAirspace = (league: string): number => {
  switch (league.toLowerCase()) {
    case 'bronze': return 60;
    case 'silver': return 80;
    case 'gold': return 120;
    case 'diamond': return 140;
    case 'legend': return 200;
    default: return 20; 
  }
};

// Function to get a random offset location for the circle center
const getOffsetLocation = (latitude: number, longitude: number, offsetRadius: number) => {
  const earthRadius = 6371000; // Radius of the Earth in meters
  const randomAngle = Math.random() * 2 * Math.PI; // Random angle
  const randomDistance = Math.random() * offsetRadius; // Random distance within the offset radius

  const offsetLatitude = latitude + (randomDistance / earthRadius) * (180 / Math.PI) * Math.cos(randomAngle);
  const offsetLongitude = longitude + (randomDistance / earthRadius) * (180 / Math.PI) * Math.sin(randomAngle) / Math.cos(latitude * Math.PI / 180);

  return { latitude: offsetLatitude, longitude: offsetLongitude };
};

// Function to get a random location within a given radius
const getRandomLocation = (latitude: number, longitude: number, radius: number) => {
  const earthRadius = 6371000; // Radius of the Earth in meters
  const randomAngle = Math.random() * 2 * Math.PI; // Random angle
  const randomDistance = Math.random() * radius; // Random distance within the radius

  const newLatitude = latitude + (randomDistance / earthRadius) * (180 / Math.PI) * Math.cos(randomAngle);
  const newLongitude = longitude + (randomDistance / earthRadius) * (180 / Math.PI) * Math.sin(randomAngle) / Math.cos(latitude * Math.PI / 180);

  return { latitude: newLatitude, longitude: newLongitude };
};

export const PlayerComp = (props: PlayerProps) => {
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const userName = useUserName();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const friends = useFetchFriends(); // Use the friends hook

  useEffect(() => {
    const loadProfileImage = async () => {
      try {
        const imageUrl = await fetchAndCacheImage(props.player.username);
        setProfileImageUrl(imageUrl);
      } catch (error) {
        console.error("Failed to load profile image:", error);
        setProfileImageUrl(null); // Fallback to default image if loading fails
      }
    };

    loadProfileImage();
  }, [props.player.username]);

  const fireMissile = (playerName: string) => {
    setShowMissileLibrary(true);
  };

  const getHealthBarColor = (health: number) => {
    const red = Math.round(255 * (100 - health) / 100);
    const green = Math.round(128 * health / 100);
    return `rgb(${red}, ${green}, 0)`;
  };

  const handleMarkerPress = () => {
    if (selectedMarkerIndex === props.index) {
      setSelectedMarkerIndex(null); // Reset to null instead of 10
    } else {
      setSelectedMarkerIndex(props.index);
    }
  };

  const transportImage = getTransportImage(props.transportStatus); // Get the transport image based on status

  const { latitude, longitude } = props.location;

  // Define radii
  const baseRadius = 6; // Default radius when randomlocation is false
  const randomRadius = 50; // Radius when randomlocation is true

  // Check if the player is a friend
  const isFriend = friends.some(friend => friend.username === props.player.username);

  // Determine if we should use random location
  const useRandomLocation = props.randomlocation && !isFriend;

  const circleRadius = useRandomLocation ? randomRadius : baseRadius;

  // Define offset radius for the circle center when using random location
  const offsetRadius = useRandomLocation ? 100 : 0;

  // Compute circle center with offset when using random location
  const circleCenter = useMemo(() => {
    if (useRandomLocation) {
      return getOffsetLocation(latitude, longitude, offsetRadius);
    }
    return { latitude, longitude };
  }, [useRandomLocation, latitude, longitude]);

  // Compute marker location
  const markerLocation = useMemo(() => {
    if (useRandomLocation) {
      return getRandomLocation(circleCenter.latitude, circleCenter.longitude, circleRadius);
    }
    return { latitude, longitude };
  }, [useRandomLocation, circleCenter, circleRadius]);

  // Define dynamic colors based on useRandomLocation
  const circleFillColor = useRandomLocation ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 255, 0, 0.2)";
  const circleStrokeColor = useRandomLocation ? "rgba(0, 255, 0, 0.6)" : "rgba(0, 255, 0, 0.8)";

  return (
    <View>
      <Circle
        center={circleCenter}
        radius={circleRadius}
        fillColor={circleFillColor}
        strokeColor={circleStrokeColor}
      />
      <Marker
        coordinate={markerLocation}
        title={props.player.username}
        description={props.timestamp}
        onPress={handleMarkerPress}
      >
        <View style={{ alignItems: 'center', position: 'relative' }}>
          <Image 
            source={profileImageUrl ? { uri: profileImageUrl } : resizedplayerimage} 
            style={styles.profileImage} 
          />
          {transportImage && ( // Render the transport image layered on top of the player icon if available
            <Image 
              source={transportImage} 
              style={{ 
                width: 40, 
                height: 40, 
                position: 'absolute', 
                top: 15, // Adjusted to move the transport image down
                left: 0, // Adjust as needed to position correctly
                right: 5, // Adjust as needed to position correctly
              }}
              resizeMode="contain" 
            />
          )}
          <Text style={styles.username}>{props.player.username}</Text>

          {selectedMarkerIndex !== null && selectedMarkerIndex === props.index && props.player.username !== userName && (
            <TouchableOpacity
              style={styles.fireMissileButton}
              onPress={() => fireMissile(props.player.username)}
            >
              <Text style={styles.fireMissileText}>Fire Missile</Text>
            </TouchableOpacity>
          )}

          <Modal
            animationType="slide"
            transparent={true}
            visible={showMissileLibrary}
            onRequestClose={() => setShowMissileLibrary(false)}
          >
            <View style={[styles.modalOverlay, isDarkMode && styles.modalOverlayDark]}>
              <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
                <View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
                  <Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Missile Library</Text>
                  <TouchableOpacity
                    style={[styles.doneButton, isDarkMode && styles.doneButtonDark]}
                    onPress={() => setShowMissileLibrary(false)}
                  >
                    <Text style={[styles.doneButtonText, isDarkMode && styles.doneButtonTextDark]}>Done</Text>
                  </TouchableOpacity>
                </View>
                <MissileLibrary 
                  playerName={props.player.username} 
                  onMissileFired={() => setShowMissileLibrary(false)}
                  onClose={() => setShowMissileLibrary(false)}
                />
              </View>
            </View>
          </Modal>

          <View style={styles.healthBarContainer}>
            <View 
              style={[
                styles.healthBar, 
                { 
                  width: `${Math.max(0, Math.min(100, props.health))}%`,
                  backgroundColor: getHealthBarColor(props.health)
                }
              ]}
            />
          </View>
        </View>
      </Marker>
    </View>
  );
};