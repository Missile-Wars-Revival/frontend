import React, { useState } from "react";
import { Button, View, Image, Text, Modal, Dimensions } from "react-native";
import { Circle, Marker } from "react-native-maps";
import { GeoLocation, Player } from "middle-earth";
import { MissileLibrary } from "./Missile/missile";
const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png"); // Your custom image path
const resizedplayericon = { width: 30, height: 30 }; // Custom size for image

interface PlayerProps {
  index: number;
  player: Player;
  location: { latitude: number; longitude: number };
  description: string;
}
export const PlayerComp = (playerProps: PlayerProps) => {
  const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);

  const [showMissileLibrary, setShowMissileLibrary] = useState(false);


  const fireMissile = (playerName: string) => {
    setShowMissileLibrary(true);
  };

  return (

    <View>
      <Circle
        center={{
          latitude: playerProps.player.location.latitude,
          longitude: playerProps.player.location.longitude,
        }}
        radius={6}
        fillColor="rgba(0, 255, 0, 0.2)"
        strokeColor="rgba(0, 255, 0, 0.8)"
      />
      <Marker
        coordinate={{
          latitude: playerProps.player.location.latitude,
          longitude: playerProps.player.location.longitude,
        }}
        title={playerProps.player.username}
        description={playerProps.description}
        onPress={() => {
          if (selectedMarkerIndex === playerProps.index) {
            setSelectedMarkerIndex(10);
          } else {
            setSelectedMarkerIndex(playerProps.index);
          }
        }}
      >
        {/* Wrap image and button inside a View */}
        <View style={{ alignItems: 'center' }}>
          <Image source={resizedplayerimage} style={resizedplayericon} />
          <Text style={{ color: 'grey' }}>{playerProps.player.username}</Text>

          {/* Missile Lib Button */}
          {selectedMarkerIndex !== 10 && selectedMarkerIndex === playerProps.index && (
            <View style={{ backgroundColor: 'red', borderRadius: 5, marginTop: 2 }}>
              {/* Ensure onPress event is passed the player's username */}
              <Button
                title={`Fire Missile At Player: ${playerProps.player.username}`}
                onPress={() => {
                  fireMissile(playerProps.player.username);
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
                <MissileLibrary playerName={playerProps.player.username} />
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