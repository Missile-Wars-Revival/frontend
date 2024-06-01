import React from "react";
import { View, Image } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { GeoLocation } from "middle-earth";
const resizedlootimage = require("../assets/mapassets/Airdropicon.png"); // Your custom image path
const resizedlooticon = { width: 50, height: 50 }; // Custom size for image

interface AllLootDropsProps {
    lootLocations: GeoLocation[];
}

export const AllLootDrops = (props: AllLootDropsProps) => {
    return (
        <>
            {props.lootLocations.map((location, index) => (
            <React.Fragment key={index}>
                <LootDrop location={location} />
            </React.Fragment>
            ))}
        </>
    )
}


interface LootProps {
    location: GeoLocation;

}

export const LootDrop = (props: LootProps) => {
    return (
        <View>
            {/* Render Circle */}
            <Circle
            center={props.location}
            radius={20} //actual radius size
            fillColor="rgba(0, 0, 255, 0.2)"
            strokeColor="rgba(0, 0, 255, 0.8)"
            />
            {/* Render Marker */}
            <Marker
            coordinate={{
                latitude: props.location.latitude,
                longitude: props.location.longitude,
            }}
            >
            <Image source={resizedlootimage} style={resizedlooticon} />
            </Marker>
        </View>
    )
}