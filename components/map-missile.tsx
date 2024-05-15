import React from "react";
import { View, Image } from "react-native";
import { Circle, Marker, Polyline } from "react-native-maps";
import { missileImages } from "../components/missile";
import { Location } from "../types/types";



interface MissileProps {
    destination: Location;
    currentLocation: Location;
    trajectoryCoordinates: Location[];
    radius: number;
    type: string;
    status: string;
}
export const MapMissile = (missileProps: MissileProps) => {

    const resizedmissileimage = missileImages[missileProps.type];
    const resizedmissileicon = { width: 50, height: 50 }; // Custom size for image
    return(
        <View>
            {/* Render Circle at destination coords */}
            <Circle
                center={missileProps.destination}
                radius={missileProps.radius}
                fillColor="rgba(255, 0, 0, 0.2)"
                strokeColor="rgba(255, 0, 0, 0.8)"
            />
            {/* Render Marker at current coords */}
            <Marker
                coordinate={missileProps.currentLocation}
                title={`Missile: ${missileProps.type}`}
                description={`${missileProps.status}`}
            >
                <Image source={resizedmissileimage} style={resizedmissileicon} />
            </Marker>
            {/* Render trajectory line */}
            <Polyline
                coordinates={missileProps.trajectoryCoordinates}
                strokeColor="red"
                strokeWidth={3}
            />
        </View>
    )
}