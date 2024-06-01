import React, { useState } from "react";
import { Button, View, Image, Text } from "react-native";
import { Circle, Marker } from "react-native-maps";
import { Player } from "middle-earth";
const resizedplayerimage = require("../assets/mapassets/Female_Avatar_PNG.png"); // Your custom image path
const resizedplayericon = { width: 30, height: 30 }; // Custom size for image

interface PlayerProps {
  index: number;
  player: Player;
  location: {
      latitude: number;
      longitude: number;
  };
  description: string;
}
export const PlayerComp = (playerProps: PlayerProps) => {
    const [selectedMarkerIndex, setSelectedMarkerIndex] = useState<number | null>(null);
    return (

        <View>
            <Circle 
                center={{
                    latitude: playerProps.player.latitude,
                    longitude: playerProps.player.longitude,
                }}
                radius={6}
                fillColor="rgba(0, 255, 0, 0.2)"
                strokeColor="rgba(0, 255, 0, 0.8)"
            />
        <Marker
          coordinate={{
            latitude: playerProps.player.latitude,
            longitude: playerProps.player.longitude,
          }}
          title={playerProps.player.username}
          description={playerProps.description}
          onPress={() => {
            if (selectedMarkerIndex === playerProps.index) {
              setSelectedMarkerIndex(10);
              //setSelectedPlayerUsername(playerProps.player.username);
              //fireMissile(playerProps.player.username);
              //TODO fix this
            } else {
              setSelectedMarkerIndex(playerProps.index);
            }
            //console.log("selectedMarkerIndex:", selectedMarkerIndex);
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
                console.log("Button clicked for player:", playerProps.player.username);
            }}
            color="white"
            />
        </View>
)}
          </View>
        </Marker>
    </View>
    )
}