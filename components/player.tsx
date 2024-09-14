// import React, { useState, useEffect } from "react";
// import { Button, View, Image, Text, Modal, Dimensions, StyleSheet } from "react-native";
// import { Circle, Marker } from "react-native-maps";
// import { MissileLibrary } from "./Missile/missile";
// import { Players } from "./map-players";
// import { useUserName } from "../util/fetchusernameglobal";
// import { fetchAndCacheImage } from "../util/imagecache";

// const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png");
// const carImage = require("../assets/transport/car.png");
// const planeImage = require("../assets/transport/plane.png");
// const trainImage = require("../assets/transport/train.png");
// //const bicycleImage = require("../assets/transport/bicycle.png");
// //const shipImage = require("../assets/transport/ship.png");
// const boatImage = require("../assets/transport/boat.png");
// //const walkingImage = require("../assets/transport/walking.png");

// const styles = StyleSheet.create({
//   profileImage: {
//     width: 36,
//     height: 36,
//     borderRadius: 18, // Half of width/height to make it circular
//     overflow: 'hidden', // Ensures the image doesn't spill outside the rounded borders
//   },
//   username: {
//     color: 'grey',
//     marginTop: 2,
//     fontSize: 12, // Adjust as needed
//   },
//   healthBarContainer: {
//     width: 36,
//     height: 4,
//     backgroundColor: '#ddd',
//     borderRadius: 2,
//     marginTop: 2,
//   },
//   healthBar: {
//     height: '100%',
//     borderRadius: 2,
//   },
//   transportImage: {
//     width: 48,
//     height: 48,
//     position: 'absolute',
//     bottom: 0,
//     zIndex: 1,
//   },
//   profileImageOverlay: {
//     position: 'absolute',
//     top: 0,
//     right: 0,
//     zIndex: 2,
//   },
// });

// interface PlayerProps {
//   location: { latitude: number; longitude: number };
//   player: Players;
//   timestamp: string;
//   health: number;
//   transportStatus: string;
//   index: number;
// }

// export const PlayerComp = (props: PlayerProps) => {
//   const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
//   const [showMissileLibrary, setShowMissileLibrary] = useState(false);
//   const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

//   const userName = useUserName();

//   useEffect(() => {
//     const loadProfileImage = async () => {
//       try {
//         const imageUrl = await fetchAndCacheImage(props.player.username);
//         setProfileImageUrl(imageUrl);
//       } catch (error) {
//         console.error("Failed to load profile image:", error);
//         setProfileImageUrl(null); // Fallback to default image if loading fails
//       }
//     };

//     loadProfileImage();
//   }, [props.player.username]);

//   const fireMissile = (playerName: string) => {
//     setShowMissileLibrary(true);
//   };

//   const getHealthBarColor = (health: number) => {
//     // Start with a dark green (0, 128, 0) and transition to red (255, 0, 0)
//     const red = Math.round(255 * (100 - health) / 100);
//     const green = Math.round(128 * health / 100);
//     return `rgb(${red}, ${green}, 0)`;
//   };

//   const getTransportImage = (status: string) => {
//     switch (status) {
//       case 'plane': return planeImage;
//       case 'highspeed': return trainImage;
//       case 'car': return carImage;
//       //case 'bicycle': return bicycleImage;
//       //case 'ship': return shipImage;
//       case 'boat': return boatImage;
//       //case 'walking': return walkingImage;
//       default: return null;
//     }
//   };

//   const handleMarkerPress = () => {
//     if (selectedMarkerIndex === props.index) {
//       setSelectedMarkerIndex(null); // Reset to null instead of 10
//     } else {
//       setSelectedMarkerIndex(props.index);
//     }
//   };

//   return (
//     <View>
//       <Circle
//         center={{
//           latitude: props.location.latitude,
//           longitude: props.location.longitude,
//         }}
//         radius={6}
//         fillColor="rgba(0, 255, 0, 0.2)"
//         strokeColor="rgba(0, 255, 0, 0.8)"
//       />
//       <Marker
//         coordinate={{
//           latitude: props.location.latitude,
//           longitude: props.location.longitude,
//         }}
//         title={props.player.username}
//         description={props.timestamp}
//         onPress={handleMarkerPress} // Use the new handler
//       >
//         <View style={{ alignItems: 'center' }}>
//           {getTransportImage(props.transportStatus) && (
//             <Image 
//               source={getTransportImage(props.transportStatus)} 
//               style={styles.transportImage} 
//             />
//           )}
//           <Image 
//             source={profileImageUrl ? { uri: profileImageUrl } : resizedplayerimage} 
//             style={[styles.profileImage, styles.profileImageOverlay]} 
//           />
//           <Text style={styles.username}>{props.player.username}</Text>

//           {selectedMarkerIndex !== null && selectedMarkerIndex === props.index && props.player.username !== userName && (
//             <View style={{ backgroundColor: 'red', borderRadius: 5, marginTop: 2, padding: 2 }}>
//               <Button
//                 title="Fire Missile"
//                 onPress={() => {
//                   fireMissile(props.player.username);
//                 }}
//                 color="white"
//               />
//             </View>
//           )}

//           <Modal
//             animationType="slide"
//             transparent={true}
//             visible={showMissileLibrary}
//             onRequestClose={() => setShowMissileLibrary(false)}
//           >
//             <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
//               <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
//                 <MissileLibrary 
//                   playerName={props.player.username} 
//                   onMissileFired={() => setShowMissileLibrary(false)}
//                   onClose={() => setShowMissileLibrary(false)}
//                 />
//                 <View style={{ alignSelf: 'flex-end', padding: 10 }}>
//                   <Button title="Done" onPress={() => setShowMissileLibrary(false)} />
//                 </View>
//               </View>
//             </View>
//           </Modal>

//           {/* Health Bar */}
//           <View style={styles.healthBarContainer}>
//             <View 
//               style={[
//                 styles.healthBar, 
//                 { 
//                   width: `${props.health}%`,
//                   backgroundColor: getHealthBarColor(props.health)
//                 }
//               ]}
//             />
//           </View>
//         </View>
//       </Marker>
//     </View>
//   );
// };

import React, { useState, useEffect } from "react";
import { Button, View, Image, Text, Modal, Dimensions, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { Circle, Marker } from "react-native-maps";
import { MissileLibrary } from "./Missile/missile";
import { Players } from "./map-players";
import { useUserName } from "../util/fetchusernameglobal";
import { fetchAndCacheImage } from "../util/imagecache";

const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png");

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
});

interface PlayerProps {
  location: { latitude: number; longitude: number };
  player: Players;
  timestamp: string;
  health: number;
  index: number;
}

export const PlayerComp = (props: PlayerProps) => {
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const userName = useUserName();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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

  return (
    <View>
      <Circle
        center={{
          latitude: props.location.latitude,
          longitude: props.location.longitude,
        }}
        radius={6}
        fillColor="rgba(0, 255, 0, 0.2)"
        strokeColor="rgba(0, 255, 0, 0.8)"
      />
      <Marker
        coordinate={{
          latitude: props.location.latitude,
          longitude: props.location.longitude,
        }}
        title={props.player.username}
        description={props.timestamp}
        onPress={handleMarkerPress} // Use the new handler
      >
        <View style={{ alignItems: 'center' }}>
          <Image 
            source={profileImageUrl ? { uri: profileImageUrl } : resizedplayerimage} 
            style={styles.profileImage} 
          />
          <Text style={styles.username}>{props.player.username}</Text>

          {selectedMarkerIndex !== null && selectedMarkerIndex === props.index && props.player.username !== userName && (
            <View style={{ backgroundColor: 'red', borderRadius: 5, marginTop: 2, padding: 2 }}>
              <Button
                title="Fire Missile"
                onPress={() => {
                  fireMissile(props.player.username);
                }}
                color="white"
              />
            </View>
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
                  width: `${props.health}%`,
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