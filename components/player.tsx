import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Circle, Marker } from "react-native-maps";
import { Players } from "./map-players";
import { useUserName } from "../util/fetchusernameglobal";

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
  locationPrecision?: "precise" | "diffused";
  onPlayerSelect?: (player: Players) => void;
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

export const PlayerComp = (props: PlayerProps) => {
  const userName = useUserName();

  const getHealthBarColor = (health: number) => {
    const red = Math.round(255 * (100 - health) / 100);
    const green = Math.round(128 * health / 100);
    return `rgb(${red}, ${green}, 0)`;
  };

  // Marker children are rasterized by react-native-maps and don't reliably
  // re-render after mount, so the marker carries no interactive UI at all.
  // Tapping it reports the selection up to MapComp, which opens the player
  // details modal hosted outside the MapView.
  const handleMarkerPress = () => {
    if (props.player.username !== userName) {
      props.onPlayerSelect?.(props.player);
    }
  };

  const transportImage = getTransportImage(props.transportStatus); // Get the transport image based on status

  const { latitude, longitude } = props.location;

  // Define radii
  const baseRadius = 6; // Default radius when randomlocation is false
  const approximateRadius = 100; // Matches the server-side diffusion radius.

  // Phase 11A: the server now diffuses locations. When it tells us the point is
  // already diffused, render it AS-IS — a stable coordinate that's easy to tap.
  // Only fall back to the legacy client-side offset when talking to an old
  // server that sends no precision flag (then honour randomlocation for all viewers).
  const serverDiffused = props.locationPrecision === "diffused";
  const legacyDiffuse = props.locationPrecision === undefined && props.randomlocation;
  const isApproximate = serverDiffused || legacyDiffuse;

  const circleRadius = isApproximate ? approximateRadius : baseRadius;

  // One display point drives both the visible marker and its approximation
  // circle, so the tap target stays on the marker instead of the circle center.
  const displayLocation = useMemo(() => {
    if (legacyDiffuse) {
      return getOffsetLocation(latitude, longitude, 100);
    }
    return { latitude, longitude };
  }, [legacyDiffuse, latitude, longitude]);

  // Define dynamic colors based on whether the location is approximate
  const circleFillColor = isApproximate ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 255, 0, 0.2)";
  const circleStrokeColor = isApproximate ? "rgba(0, 255, 0, 0.6)" : "rgba(0, 255, 0, 0.8)";

  return (
    <View>
      <Circle
        center={displayLocation}
        radius={circleRadius}
        fillColor={circleFillColor}
        strokeColor={circleStrokeColor}
      />
      {/* No title/description: the native callout would swallow the first
          tap, forcing a second tap to reach the action UI. The details modal
          opens straight from onPress instead. */}
      <Marker
        coordinate={displayLocation}
        anchor={{ x: 0.5, y: 0.32 }}
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
