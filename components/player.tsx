import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Circle, Marker } from "react-native-maps";
import { Players } from "./map-players";
import { useUserName } from "../util/fetchusernameglobal";
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
});

interface PlayerProps {
  location: { latitude: number; longitude: number };
  player: Players;
  timestamp: string;
  health: number;
  transportStatus: string;
  index: number;
  randomlocation: boolean;
  onPlayerSelect?: (username: string) => void;
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
  const userName = useUserName();
  const friends = useFetchFriends(); // Use the friends hook

  const getHealthBarColor = (health: number) => {
    const red = Math.round(255 * (100 - health) / 100);
    const green = Math.round(128 * health / 100);
    return `rgb(${red}, ${green}, 0)`;
  };

  // Marker children are rasterized by react-native-maps and don't reliably
  // re-render after mount, so the marker carries no interactive UI at all.
  // Tapping it reports the selection up to MapComp, which shows a real
  // (tappable) action card hosted outside the MapView.
  const handleMarkerPress = () => {
    if (props.player.username !== userName) {
      props.onPlayerSelect?.(props.player.username);
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
  }, [useRandomLocation, latitude, longitude, offsetRadius]);

  // Compute marker location
  const markerLocation = useMemo(() => {
    if (useRandomLocation) {
      return getRandomLocation(circleCenter.latitude, circleCenter.longitude, circleRadius);
    }
    return { latitude, longitude };
  }, [useRandomLocation, circleCenter, circleRadius, latitude, longitude]);

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
        zIndex={2} // Higher zIndex for players
      >
        <View style={{ alignItems: 'center', position: 'relative' }}>
          <Image
            source={props.player.profileImageUrl ? { uri: props.player.profileImageUrl } : resizedplayerimage}
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