import React, { useState } from "react";
import { Button, View, Image, Text, Modal, Dimensions } from "react-native";
import { Circle, Marker } from "react-native-maps";
import { MissileLibrary } from "./Missile/missile";
import { Players } from "./map-players";
import { useUserName } from "../util/fetchusernameglobal";
const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png"); // Your custom image path
const resizedplayericon = { width: 30, height: 30 }; // Custom size for image

interface PlayerProps {
  location: { latitude: number; longitude: number };
  player: Players;
  timestamp: string;
  index: number;
}
export const PlayerComp = (props: PlayerProps) => {
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
  const [showMissileLibrary, setShowMissileLibrary] = useState(false);

  const userName = useUserName()

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
        {/* Wrap image and button inside a View */}
        <View style={{ alignItems: 'center' }}>
          <Image source={resizedplayerimage} style={resizedplayericon} />
          <Text style={{ color: 'grey' }}>{props.player.username}</Text>

          {/* Missile Lib Button */}
          {selectedMarkerIndex !== 10 && selectedMarkerIndex === props.index && props.player.username !== userName && (
            <View style={{ backgroundColor: 'red', borderRadius: 5, marginTop: 2 }}>
              {/* Ensure onPress event is passed the player's username */}
              <Button
                title={`Fire Missile At Player: ${props.player.username}`}
                onPress={() => {
                  fireMissile(props.player.username);
                }}
                color="white"
              />
            </View>
          )}

          {/* Missile library popup */}
          <Modal
            animationType="slide"
            transparent={true}
            visible={showMissileLibrary}
            onRequestClose={() => setShowMissileLibrary(false)}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ backgroundColor: 'white', borderRadius: 10, width: Dimensions.get('window').width - 40, maxHeight: Dimensions.get('window').height - 200 }}>
                {/* Include MissileLibrary component */}
                <MissileLibrary playerName={props.player.username} />
                <View style={{ alignSelf: 'flex-end', padding: 10 }}>
                  <Button title="Done" onPress={() => setShowMissileLibrary(false)} />
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </Marker>
    </View>
  )
}