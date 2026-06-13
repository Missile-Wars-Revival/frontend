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

// A DETERMINISTIC point within `maxMeters` of (lat,lng), seeded by `seed`
// (FNV-1a hash, not Math.random), so a diffused player's circle/marker stay put
// across location ticks instead of jittering — and the marker is easy to tap.
const stableOffset = (latitude: number, longitude: number, seed: string, maxMeters: number) => {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const u = hash >>> 0;
  const angle = ((u % 36000) / 36000) * 2 * Math.PI;
  const distance = (((u >>> 8) % 1000) / 1000) * maxMeters;
  const earthRadius = 6371000;
  const dLat = (distance / earthRadius) * (180 / Math.PI) * Math.cos(angle);
  const dLng = (distance / earthRadius) * (180 / Math.PI) * Math.sin(angle) / Math.cos(latitude * Math.PI / 180);
  return { latitude: latitude + dLat, longitude: longitude + dLng };
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

  const username = props.player.username;

  // Define radii. The diffusion circle is kept modest (≈ the server-side
  // DIFFUSION_RADIUS_METERS) so it doesn't dominate the map.
  const baseRadius = 6; // Default radius when randomlocation is false
  const approximateRadius = 60;

  // Phase 11A: the server now diffuses locations. A "diffused" point is already
  // privacy-safe. Only fall back to a client-side offset when an OLD server
  // sends no precision flag (then honour randomlocation for all viewers).
  const serverDiffused = props.locationPrecision === "diffused";
  const legacyDiffuse = props.locationPrecision === undefined && props.randomlocation;
  const isApproximate = serverDiffused || legacyDiffuse;

  const circleRadius = isApproximate ? approximateRadius : baseRadius;

  // Circle center: a server-diffused coordinate is safe to sit on. The legacy
  // old-server coordinate is still PRECISE, so push the circle off it (stably)
  // so we never draw it on the real spot.
  const circleCenter = useMemo(() => {
    if (legacyDiffuse) return stableOffset(latitude, longitude, username + ':c', approximateRadius);
    return { latitude, longitude };
  }, [legacyDiffuse, latitude, longitude, username]);

  // Avatar marker: for diffused players, a stable spot INSIDE the circle (not
  // dead center, seeded by username) — so it reads as "somewhere in this area"
  // and the tap target is the marker, not the circle's middle. Precise players
  // render right on their point.
  const markerLocation = useMemo(() => {
    if (!isApproximate) return { latitude, longitude };
    return stableOffset(circleCenter.latitude, circleCenter.longitude, username + ':m', approximateRadius * 0.62);
  }, [isApproximate, circleCenter, latitude, longitude, username]);

  // Define dynamic colors based on whether the location is approximate
  const circleFillColor = isApproximate ? "rgba(0, 255, 0, 0.1)" : "rgba(0, 255, 0, 0.2)";
  const circleStrokeColor = isApproximate ? "rgba(0, 255, 0, 0.6)" : "rgba(0, 255, 0, 0.8)";

  return (
    <View>
      <Circle
        center={circleCenter}
        radius={circleRadius}
        fillColor={circleFillColor}
        strokeColor={circleStrokeColor}
      />
      {/* No title/description: the native callout would swallow the first
          tap, forcing a second tap to reach the action UI. The details modal
          opens straight from onPress instead. */}
      <Marker
        coordinate={markerLocation}
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
