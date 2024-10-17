import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { GeoLocation, Loot } from "middle-earth";
import { convertimestampfuture } from "../../util/get-time-difference";
import { getImages } from "../../api/store";
const resizedlootimage = require("../../assets/mapassets/Airdropicon.png"); // Your custom image path
const resizedlooticon = { width: 40, height: 40 }; // Custom size for image

interface AllLootDropsProps {
    lootLocations: Loot[];
}

interface LootProps {
    location: GeoLocation;
    rarity: string;
    expiretime: string;
}

export const AllLootDrops = (props: AllLootDropsProps) => {
    return (
        <>
            {props.lootLocations.map(({ location, rarity, expiretime }, index) => (
                <React.Fragment key={index}>
                    <LootDrop location={location} rarity={rarity} expiretime={expiretime} />
                </React.Fragment>
            ))}

        </>
    )
}


export const LootDrop = (props: LootProps) => {
    const { text } = convertimestampfuture(props.expiretime);
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

    useEffect(() => {
        const loadImages = async () => {
            const imageGetter = await getImages();
            setGetImageForProduct(() => imageGetter);
        };
        loadImages();
    }, []);
    return (
        <View>
            {/* Render Circle */}
            <Circle
                center={{
                    latitude: Number(props.location.latitude),
                    longitude: Number(props.location.longitude)
                }}
                radius={20} //actual radius size
                fillColor="rgba(0, 0, 255, 0.2)"
                strokeColor="rgba(0, 0, 255, 0.8)"
            />
            {/* Render Marker */}
            <Marker
                coordinate={{
                    latitude: Number(props.location.latitude),
                    longitude: Number(props.location.longitude),
                }}
                title={`Loot Rarity: ${props.rarity}`}
                description={`${text}`}
            >
                <Image source={getImageForProduct("LootDrop")} style={resizedlooticon} />
            </Marker>
        </View>
    )
}