import React from "react";
import { View, Image } from "react-native";
import { Circle, Marker, Polyline } from "react-native-maps";
import { missileImages } from "./Missile/missile";
import { Location, Missile } from "../types/types";

interface AllMissilesProps {
    missileData: Missile[];
}

export const AllMissiles = (props: AllMissilesProps) => {
    return (
        <>
        {props.missileData.map(({ destination, currentLocation, radius, type, status }, index) => {

            // Define a mapping of image paths with an index signature (paths found in components)
    
            // Calculate coordinates for trajectory line
            const trajectoryCoordinates = [
            { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            { latitude: destination.latitude, longitude: destination.longitude },
            ];
            
            return (
            <React.Fragment key={index}>
                <MapMissile destination={destination}
                currentLocation={currentLocation} 
                trajectoryCoordinates={trajectoryCoordinates} 
                radius={radius} 
                type={type} 
                status={status} />
            </React.Fragment>
            );
        })}
        </>
    );
}

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