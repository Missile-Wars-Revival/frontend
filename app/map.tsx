import React, { useEffect, useState, useCallback } from "react";
import { Text, View, TouchableOpacity, Image } from "react-native";
import MapView, { PROVIDER_GOOGLE, Circle, Marker } from "react-native-maps";
import * as ExpoLocation from "expo-location";

//Themes
import { DefaultMapStyle } from "../themes/defaultMapStyle";
import { RadarMapStyle } from "../themes/radarMapStyle";
import { CherryBlossomMapStyle } from "../themes/cherryBlossomMapStyle";

//Stylesheet
import { styles } from "../styles";

//Types
import { Loot, Missile, Landmine, Location, Player } from "../types/types";

import { MapStylePopup } from "../components/map-style-popup";
import { getTimeDifference } from "../util/get-time-difference";

const userNAME = "Player"; //todo: get username from backend

export default function Map() {
  const defaultRegion = {
    latitude: 0,
    longitude: 0,
    latitudeDelta: 0,
    longitudeDelta: 0,
  };

  const [region, setRegion] = useState(defaultRegion); //null was defaultRegion but zoomed in ugly
  const [selectedMapStyle, setSelectedMapStyle] = useState(DefaultMapStyle);
  const [popupVisible, setPopupVisible] = useState(false);
  const [lootLocations, setLootLocations] = useState<Loot[]>([]);
  const [missileData, setMissileData] = useState<Missile[]>([]);
  const [landminedata, setlandminelocations] = useState<Landmine[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);

  const [otherPlayersData, setOtherPlayersData] = useState([]);

  const fetchOtherPlayers = async () => {
    const data = await fetchOtherPlayersData();
    setOtherPlayersData(data);
  };

  useEffect(() => {
    fetchOtherPlayers();
  }, []);

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
        };

        const response = await fetchData("dispatch", "POST", data);
        //console.log('Location sent successfully:', response);
      } else {
        //console.log('Latitude or longitude is missing. Not sending backend');
      }
    } catch (error) {
      console.log(
        "Error sending location to backend:",
        (error as Error).message
      );
    }
  };

  const fetchLocation = useCallback(async () => {
    try {
      let { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      let location = await ExpoLocation.getCurrentPositionAsync({});
      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      };
      //setRegion(userLoc); //set starting region as user location
      setUserLocation(userLoc); // Update userLocation
    } catch (error) {
      console.log("Error fetching location:", (error as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchLocation(); // Fetch location on component mount

    // Set interval to fetch location every 30 seconds
    const intervalId = setInterval(fetchLocation, 30000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchLocation]);

  const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  const apiUrl = `${backendUrl}:3000/api/`;
  //console.log(apiUrl);

  const fetchData = async (
    endpoint: string,
    method: string = "GET",
    body: any | null = null // Adjusted the type to any
  ) => {
    let url = apiUrl + endpoint;

    const config: {
      method: string;
      headers: {
        "Content-Type": string;
      };
      body?: string;
    } = {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    // If method is GET, append data as query parameters
    if (method === "GET" && body) {
      url += `?${new URLSearchParams(body).toString()}`;
    } else if (method === "POST" && body) {
      config.body = JSON.stringify(body); // Send body as JSON string
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`Failed to fetch data. Status: ${response.status}`);
      } else {
        return response.json();
      }
    } catch (error) {
      console.log(`Error fetching data: ${(error as Error).message}`);
      throw error;
    }
  };

  useEffect(() => {
    sendLocationToBackend(); // Initial send

    // Set interval to send location to backend every 30 seconds
    const intervalId = setInterval(sendLocationToBackend, 30000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [userLocation]); // Add userLocation to dependency array

  //Pending update from backend....
  const fetchOtherPlayersData = async () => {
    try {
      const data = await fetchData("getOtherPlayersData");

      // Filter out players with the same username
      const filteredData = data.filter(
        (player: Player) => player.username !== userNAME
      );

      // Filter out players with timestamps older than 2 weeks
      const currentTime = new Date().getTime();
      const twoWeeksInMillis = 2 * 7 * 24 * 60 * 60 * 1000; // 2 weeks in milliseconds

      const recentPlayersData = filteredData.filter((player: Player) => {
        const playerTime = new Date(player.timestamp).getTime();
        return currentTime - playerTime <= twoWeeksInMillis;
      });

      return recentPlayersData;
    } catch (error) {
      console.log(
        "Error fetching other players data:",
        (error as Error).message
      );
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

  //Missile, landmine and loot drop logic !!!!NOT WORKING TODO!!!!

  //fetch dist

  const fetchLootAndMissiles = useCallback(() => {
    const fetchLootFromBackend = async () => {
      // Simulated fetch function to get loot data:
      return [
        { latitude: 51.026281, longitude: -3.113764 }, // Loot location 1 TS
        { latitude: 45.305, longitude: -0.86 }, // Loot location 2
      ];
    };

    const fetchlandmineFromBackend = async () => {
      // Simulated fetch function to get landmine data:
      return [
        { latitude: 45.2949318, longitude: -0.852764 }, //temp landmine location
        { latitude: 51.025682, longitude: -3.1174578 }, //2nd temp landmine location TS
      ];
    };

    const fetchMissilesFromBackend = async () => {
      // Simulated fetch function to get missile data:
      return [
        {
          location: { latitude: 45.2949318, longitude: -0.852764 },
          radius: 100,
        }, //temp missile location
        { location: { latitude: 51.025316, longitude: -3.115612 }, radius: 50 }, //2nd temp missle location TS
      ];
    };

    const updateData = async () => {
      const lootData = await fetchLootFromBackend();
      const landminedata = await fetchlandmineFromBackend();
      const missileData = await fetchMissilesFromBackend();

      setLootLocations(lootData);
      setlandminelocations(landminedata);
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

  const getDistance = (
    lat1: Location["latitude"],
    lon1: Location["longitude"],
    lat2: Location["latitude"],
    lon2: Location["longitude"]
  ) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Distance in meters
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (userLocation) {
        checkLandmineCollision();
        checkMissileCollision();
        checkLootCollection();
      }
    }, 5000); // 30 seconds

    // Clear interval on component unmount to prevent memory leaks
    return () => clearInterval(intervalId);
  }, []);

  //Check Collision

  const checkMissileCollision = () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("Error: User location not available");
      return;
    }

    for (let missile of missileData) {
      if (
        !missile.location ||
        !missile.location.latitude ||
        !missile.location.longitude
      ) {
        console.log("Error: Missile location data incomplete");
        continue;
      }

      const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        missile.location.latitude,
        missile.location.longitude
      );
      if (distance <= missile.radius) {
        alert("Warning: You are in the radius of a missile!");
        console.log("Player died");
        //Missile impact info here....
        break;
      }
    }
  };

  const checkLandmineCollision = () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("Error: User location not available");
      return;
    }

    for (let landmine of landminedata) {
      if (!landmine.latitude || !landmine.longitude) {
        console.log("Error: Landmine location data incomplete");
        continue;
      }

      const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        landmine.latitude,
        landmine.longitude
      );
      if (distance <= 30) {
        alert("Warning: You are in the radius of a landmine!");
        console.log("Player died");
        // Landmine impact logic here
        break;
      }
    }
  };

  const checkLootCollection = () => {
    if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
      console.log("Error: User location not available");
      return;
    }

    for (let loot of lootLocations) {
      if (!loot.latitude || !loot.longitude) {
        console.log("Error: Loot location data incomplete");
        continue;
      }

      const distance = getDistance(
        userLocation.latitude,
        userLocation.longitude,
        loot.latitude,
        loot.longitude
      );
      if (distance <= 20) {
        // Assuming loot radius is 20 meters
        alert("You've found loot nearby!");
        console.log("Loot collected");
        // loot pickup logic here
        break;
      }
    }
  };

  const showPopup = () => {
    setPopupVisible(true);
  };

  const closePopup = () => {
    setPopupVisible(false);
  };

  const selectMapStyle = (style: string) => {
    closePopup();
    switch (style) {
      case "default":
        setSelectedMapStyle(DefaultMapStyle);
        break;
      case "radar":
        setSelectedMapStyle(RadarMapStyle);
        break;
      case "cherry":
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
  const resizedMarkerImage = require("../assets/Female_Avatar_PNG.png"); // Your custom image path
  const resizedImageStyle = { width: 30, height: 30 }; // Custom size for image

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
            fillColor="rgba(0, 0, 255, 0.2)"
            strokeColor="rgba(0, 0, 255, 0.8)"
          />
        ))}

        {/* Render landmine Drops */}
        {landminedata.map((location, index) => (
          <Circle
            key={index}
            center={location}
            radius={30} //actual radius size
            fillColor="rgba(128, 128, 128, 0.3)"
            strokeColor="rgba(128, 128, 128, 0.8)"
          />
        ))}

        {/* Render Missiles */}
        {missileData.map(({ location, radius }, index) => (
          <Circle
            key={index}
            center={location}
            radius={radius}
            fillColor="rgba(255, 0, 0, 0.2)"
            strokeColor="rgba(255, 0, 0, 0.8)"
          />
        ))}

        {otherPlayersData.map((player: Player, index) => {
          const { text, color } = getTimeDifference(player.timestamp);

          return (
            <React.Fragment key={index}>
              <Circle
                center={{
                  latitude: player.latitude,
                  longitude: player.longitude,
                }}
                radius={6} // Assuming a radius for other players
                fillColor="rgba(0, 255, 0, 0.2)" // Green color
                strokeColor="rgba(0, 255, 0, 0.8)"
              />
              <Marker
                key={index}
                coordinate={{
                  latitude: player.latitude,
                  longitude: player.longitude,
                }}
                title={player.username}
                description={text} //Finding it really hard to set "just now" as green
                style={{ backgroundColor: color }}
              >
                {/* Use resized image for the Marker */}
                <Image source={resizedMarkerImage} style={resizedImageStyle} />
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
