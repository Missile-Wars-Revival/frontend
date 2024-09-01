import React, { useState, useEffect } from "react";
import { Button, View, Image, Text, Modal, Dimensions, StyleSheet } from "react-native";
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
    borderRadius: 18, // Half of width/height to make it circular
    overflow: 'hidden', // Ensures the image doesn't spill outside the rounded borders
  },
  username: {
    color: 'grey',
    marginTop: 2,
    fontSize: 12, // Adjust as needed
  },
});

interface PlayerProps {
  location: { latitude: number; longitude: number };
  player: Players;
  timestamp: string;
  index: number;
}

export const PlayerComp = (props: PlayerProps) => {
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const userName = useUserName();

  useEffect(() => {
    const loadProfileImage = async () => {
      const imageUrl = await fetchAndCacheImage(props.player.username);
      setProfileImageUrl(imageUrl);
    };

    loadProfileImage();
  }, [props.player.username]);

  const fireMissile = (playerName: string) => {
    setShowMissileLibrary(true);
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
        onPress={() => {
          if (selectedMarkerIndex === props.index) {
            setSelectedMarkerIndex(10);
          } else {
            setSelectedMarkerIndex(props.index);
          }
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <Image 
            source={profileImageUrl ? { uri: profileImageUrl } : resizedplayerimage} 
            style={styles.profileImage} 
          />
          <Text style={styles.username}>{props.player.username}</Text>

          {selectedMarkerIndex !== 10 && selectedMarkerIndex === props.index && props.player.username !== userName && (
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
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
                <MissileLibrary 
                  playerName={props.player.username} 
                  onMissileFired={() => setShowMissileLibrary(false)}
                  onClose={() => setShowMissileLibrary(false)}
                />
                <View style={{ alignSelf: 'flex-end', padding: 10 }}>
                  <Button title="Done" onPress={() => setShowMissileLibrary(false)} />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Marker>
    </View>
  );
};