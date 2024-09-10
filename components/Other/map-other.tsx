import React from "react";
import { View, Image } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { GeoLocation, Other } from "middle-earth";
import { convertimestampfuture } from "../../util/get-time-difference";
const resizedOtherimage = require("../../assets/mapassets/shield.png"); // Your custom image path
const resizedOthericon = { width: 50, height: 50 }; // Custom size for image

interface AllOtherProps {
    OtherLocations: Other[];
}

interface OtherProps {
    type: string
    radius: number
    location: GeoLocation;
    expiretime: string;
}

export const AllOther = (props: AllOtherProps) => {
    return (
        <>
            {props.OtherLocations.map(({ location, type, expiretime, radius }, index) => (
                <React.Fragment key={index}>
                    <OtherDrop location={location} type={type} radius={radius} expiretime={expiretime} />
                </React.Fragment>
            ))}

        </>
    )
}


export const OtherDrop = (props: OtherProps) => {
    const { text } = convertimestampfuture(props.expiretime);
    return (
        <View>
            {/* Render Circle */}
            <Circle
                center={props.location}
                radius={props.radius} //actual radius size
                fillColor="rgba(0, 0, 255, 0.2)"
                strokeColor="rgba(0, 0, 255, 0.8)"
            />
            {/* Render Marker */}
            <Marker
                coordinate={{
                    latitude: props.location.latitude,
                    longitude: props.location.longitude,
                }}
                title={`${props.type}`}
                description={`${text}`}
            >
                <Image source={resizedOtherimage} style={resizedOthericon} />
            </Marker>
        </View>
    )
}