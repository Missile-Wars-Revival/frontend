import React from "react";
import { View, Image } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { GeoLocation, Loot } from "middle-earth";
import { convertimestampfuture } from "../util/get-time-difference";
const resizedlootimage = require("../assets/mapassets/Airdropicon.png"); // Your custom image path
const resizedlooticon = { width: 50, height: 50 }; // Custom size for image

interface AllLootDropsProps {
    lootLocations: Loot[];
}

export const AllLootDrops = (props: AllLootDropsProps) => {
    return (
    <>
            {props.lootLocations .map(({location, rarity, expiretime}, index) => (
            <React.Fragment key={index}>
                <LootDrop location={location} rarity={rarity} expiretime={expiretime} />
            </React.Fragment>
            ))}
    
    </>
    )
}


interface LootProps {
    location: GeoLocation;
    rarity: string;
    expiretime: string;
  }


export const LootDrop = (props: LootProps) => {
    const { text } = convertimestampfuture(props.expiretime);
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
            title={`Loot Rarity: ${props.rarity}`}
            description={`${text}`}
            >
            <Image source={resizedlootimage} style={resizedlooticon} />
            </Marker>
        </View>
    )
}