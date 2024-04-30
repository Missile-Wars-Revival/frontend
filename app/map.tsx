import React, { useEffect, useState, useCallback } from "react";
import { Text, View, TouchableOpacity, Image, Button, Modal, Dimensions, ScrollView } from "react-native";
import MapView, { PROVIDER_GOOGLE, Circle, Marker } from "react-native-maps";
import * as ExpoLocation from "expo-location";

//Themes
import { DefaultMapStyle } from "../themes/defaultMapStyle";
import { RadarMapStyle } from "../themes/radarMapStyle";
import { CherryBlossomMapStyle } from "../themes/cherryBlossomMapStyle";

//Types
import { Loot, Missile, Landmine, Location, Player, Missilelib, missileImages } from "../types/types";

import { MapStylePopup } from "../components/map-style-popup";
import { getTimeDifference, isInactiveFor24Hours } from "../util/get-time-difference";

import { userNAME } from "../temp/login"; // fetch from backend eventually

//Hooks
import { dispatch } from "../api/dispatch";
import { fetchOtherPlayersData } from "../api/getplayerlocations";

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
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);

  const [otherPlayersData, setOtherPlayersData] = useState([] as Player[]); // Type assertion to inform TypeScript about the correct type

  const fetchOtherPlayers = async () => {
    try {
      const data = await fetchOtherPlayersData();
      setOtherPlayersData(data); 
    } catch (error) {
      console.error('Error fetching other players data:', error);
    }
  };

  useEffect(() => {
    fetchOtherPlayers(); // Initial send

    // Set interval to send location to backend every 30 seconds
    const intervalId = setInterval(fetchOtherPlayers, 30000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

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
  const apiUrl = `${backendUrl}/api/`;
  //console.log(apiUrl)

  const sendLocationToBackend = async (): Promise<void> => {
    try {
        if (!userLocation || !userLocation.latitude || !userLocation.longitude) {
            console.log('Latitude or longitude is missing. Not sending to backend');
            return;
        }

        const { latitude, longitude } = userLocation;

        const response = await dispatch(userNAME, latitude, longitude); 

        if (response && response.success) {
            console.log('Location sent successfully');
        } else if (response && response.message !== "Location dispatched") {
            console.log('Failed to send location:', response.message);
        } else {
            console.log('Location dispatched');
        }
    } catch (error) {
        console.log("Error sending location to backend:", (error as Error).message);
    }
};


  useEffect(() => {
    sendLocationToBackend(); // Initial send

    // Set interval to send location to backend every 60 seconds
    const intervalId = setInterval(sendLocationToBackend, 60000);

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [userLocation]); // Add userLocation to dependency array

  //Pending update from backend....
  async function fetchplayerlocation() {
    try {
        const playerdata = await fetchOtherPlayersData();
        console.log(playerdata);
    } catch (error) {
        console.error('Error:', error);
    }
}

  useEffect(() => {
    fetchplayerlocation();

    // Fetch other players' data every 30 seconds
    const intervalId = setInterval(fetchplayerlocation, 60000); // 30 seconds

    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, []);

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

    const fetchMissilesFromBackend = async (): Promise<Missile[]> => {
      // Simulated fetch function to get missile data:
      return [
        { destination: { latitude: 45.2949318, longitude: -0.852764 }, currentLocation: { latitude: 45.2949318, longitude: -0.852764 },radius: 100, type: "TheNuke", status:"Hit"  }, //temp missile location
        { destination: { latitude: 51.025316, longitude: -3.115612 }, currentLocation: { latitude: 52.025316, longitude: -3.115612 },radius: 50, type: "Ballista", status:"Approaching" }, //2nd temp missle location TS
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
    }, 5000); // 5 seconds

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
            !missile.destination ||
            !missile.destination.latitude ||
            !missile.destination.longitude ||
            !missile.currentLocation ||
            !missile.currentLocation.latitude ||
            !missile.currentLocation.longitude
        ) {
            console.log("Error: Missile location data incomplete");
            continue;
        }

        const userDistanceToDestination = getDistance(
            userLocation.latitude,
            userLocation.longitude,
            missile.destination.latitude,
            missile.destination.longitude
        );

        if (userDistanceToDestination <= missile.radius && 
            (missile.destination.latitude !== missile.currentLocation.latitude ||
            missile.destination.longitude !== missile.currentLocation.longitude)) {
            alert("Missile inbound! Run!");
            console.log("Missile inbound");
            // Handle missile inbound here...
        }

        if (userDistanceToDestination <= missile.radius && 
            missile.destination.latitude === missile.currentLocation.latitude &&
            missile.destination.longitude === missile.currentLocation.longitude) {
            alert("Player died");
            console.log("Player died");
            // Handle player death here...
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
  const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png"); // Your custom image path
  const resizedplayericon = { width: 30, height: 30 }; // Custom size for image

  const resizedlootimage = require("../assets/mapassets/Airdropicon.png"); // Your custom image path
  const resizedlooticon = { width: 50, height: 50 }; // Custom size for image

  //Missile Lib

  // Define the fetchMissileLib function- BACKEND UPDATE
const fetchMissileLib = (): Promise<Missilelib[]> => {
  return new Promise((resolve) => {
    // Simulating asynchronous data fetching
    setTimeout(() => {
      const missileLibraryData: Missilelib[] = [
        { type: 'Amplifier', quantity: 10, description: " Missile" },
        { type: 'Ballista', quantity: 9 , description: " Missile "},
        { type: 'BigBertha', quantity: 8 , description: " Missile "},
        { type: 'Bombabom', quantity: 7 , description: " Missile "},
        { type: 'BunkerBlocker', quantity: 6 , description: " Missile "},
        { type: 'Buzzard', quantity: 5 , description: " Missile "},
        { type: 'ClusterBomb', quantity: 4 , description: " Missile "},
        { type: 'CorporateRaider', quantity: 3 , description: " Missile "},
        { type: 'GutShot', quantity: 2 , description: " Missile "},
        { type: 'TheNuke', quantity: 1 , description: " Missile "},
        { type: 'Yokozuna', quantity: 5 , description: " Missile "},
        { type: 'Zippy', quantity: 3 , description: " Missile "},
      ];
      resolve(missileLibraryData);
    }, 0); // Simulating a delay of 1 second
  });
};

//Missile types
//   Amplifier:
//   Ballista: 
//   BigBertha:
//   Bombabom: 
//   BunkerBlocker:
//   Buzzard: 
//   ClusterBomb: 
//   CorporateRaider: 
//   GutShot: 
//   TheNuke: 
//   Yokozuna: 
//   Zippy: 


const MissileLibrary = () => {
  const [missileLibrary, setMissileLibrary] = useState<Missilelib[]>([]);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const fetchMissileLibrary = async () => {
      try {
        const missileLibraryData = await fetchMissileLib();
        setMissileLibrary(missileLibraryData);
      } catch (error) {
        console.error('Error fetching missile library:', error);
      } finally {
        setLoading(false); // Set loading to false regardless of success or failure
      }
    };

    fetchMissileLibrary();
  }, []);

  if (loading) {
    return 
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text>Select your Missile:</Text>
      {missileLibrary.map((missile, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10 }}>
          <Image source={missileImages[missile.type]} style={{ width: 50, height: 50, marginRight: 10 }} />
          <Text>{missile.type} - Quantity: {missile.quantity}</Text>
        </View>
      ))}
    </ScrollView>
  );
}; 

const [isModalVisible, setIsModalVisible] = useState(false);

  return (
    <View className="flex-1 bg-gray-200">
      <MapView
        provider={PROVIDER_GOOGLE}
        className="flex-1"
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={selectedMapStyle}
      >
        {/* Render Loot Drops */}
{lootLocations.map((location, index) => (
  <React.Fragment key={index}>
    {/* Render Circle */}
    <Circle
      center={location}
      radius={20} //actual radius size
      fillColor="rgba(0, 0, 255, 0.2)"
      strokeColor="rgba(0, 0, 255, 0.8)"
    />
    {/* Render Marker */}
    <Marker
      coordinate={{
        latitude: location.latitude,
        longitude: location.longitude,
      }}
    >
      <Image source={resizedlootimage} style={resizedlooticon} />
    </Marker>
  </React.Fragment>
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
{/* Render Missiles */}
{missileData.map(({ destination, currentLocation, radius, type, status }, index) => {

// Define a mapping of image paths with an index signature
const missileImagePaths: { [key: string]: any } = {
  Amplifier: require("../assets/missiles/Amplifier.png"),
  Ballista: require("../assets/missiles/Ballista.png"),
  BigBertha: require("../assets/missiles/BigBertha.png"),
  Bombabom: require("../assets/missiles/Bombabom.png"),
  BunkerBlocker: require("../assets/missiles/BunkerBlocker.png"),
  ClusterBomb: require("../assets/missiles/ClusterBomb.png"),
  CorporateRaider: require("../assets/missiles/CorporateRaider.png"),
  GutShot: require("../assets/missiles/GutShot.png"),
  TheNuke: require("../assets/missiles/TheNuke.png"),
  Yokozuna: require("../assets/missiles/Yokozuna.png"),
  Zippy: require("../assets/missiles/Zippy.png"),

  // Add other missile types here
};
  const resizedmissileimage = missileImagePaths[type];
  const resizedmissileicon = { width: 50, height: 50 }; // Custom size for image
  
  return (
    <React.Fragment key={index}>
      {/* Render Circle at destination coords */}
      <Circle
        center={destination}
        radius={radius}
        fillColor="rgba(255, 0, 0, 0.2)"
        strokeColor="rgba(255, 0, 0, 0.8)"
      />
      {/* Render Marker at current coords */}
      <Marker
        coordinate={currentLocation}
        title={`Missile: ${type}`}
        description={`${status}`}
      >
        <Image source={resizedmissileimage} style={resizedmissileicon} />
      </Marker>
    </React.Fragment>
  );
})}

{otherPlayersData
          .filter(player => player.username !== userNAME && !isInactiveFor24Hours(player.updatedAt)) // Filter out inactive players(12) and the player's own username
          .map((player, index) => {
            const { text } = getTimeDifference(player.updatedAt);

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
                  onPress={() => {
                    if (selectedMarkerIndex === index) {
                      setSelectedMarkerIndex(null); // Deselect the marker NOT WORKING
                    } else {
                      setSelectedMarkerIndex(index); // Select the marker
                    }
                  }}
                >
                  {/* Use resized image for the Marker */}
                  <Image source={resizedplayerimage} style={resizedplayericon} />
                </Marker>
                {selectedMarkerIndex !== null && selectedMarkerIndex === index && ( // Conditionally render button... maybe
                  <View style={{ backgroundColor: 'red', borderRadius: 5, marginTop: 2 }}>
                    <Button
                      title={`Fire Missile At Player: ${player.username}`}
                      onPress={() => setIsModalVisible(true)}
                      color="white" // Set text color to white
                    />
                  </View>
                )}
              </React.Fragment>
            );
          })}
      </MapView>
{/* Missile library popup */}
<Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
            {/* Include MissileLibrary component */}
            <MissileLibrary />
            <View style={{ alignSelf: 'flex-end', padding: 10 }}>
              <Button title="Cancel" onPress={() => setIsModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>

      {/* Dropdown button */}
      <TouchableOpacity
        className="absolute bottom-[20px] left-[20px] rounded-[5px] p-[10px] bg-white shadow-md"
        onPress={showPopup}
      >
        <Text className="text-[16px]">Theme</Text>
      </TouchableOpacity>

      <MapStylePopup
        visible={popupVisible}
        transparent={true}
        onClose={closePopup}
        onSelect={selectMapStyle}
      />
    </View>
  );
}