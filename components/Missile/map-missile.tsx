import React from "react";
import { View, Image } from "react-native";
import { Circle, Marker, Polyline } from "react-native-maps";
import { missileImages } from "./missile";
import { GeoLocation, Missile } from "middle-earth";
import { convertimestampfuturemissile } from "../../util/get-time-difference";

interface AllMissilesProps {
    missileData: Missile[];
}

interface TrajectCalc {
    latitude: number, longitude: number

}

interface MissileProps {
    destination: GeoLocation;
    currentLocation: GeoLocation;
    trajectoryCoordinates: TrajectCalc[];
    radius: number;
    type: string;
    status: string;
    etatimetoimpact: string
}

export const AllMissiles = (props: AllMissilesProps) => {
    return (
        <>
            {props.missileData.map(({ destination, currentLocation, radius, type, status, etatimetoimpact }, index) => {

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
                            status={status}
                            etatimetoimpact={etatimetoimpact} />
                    </React.Fragment>
                );
            })}
        </>
    );
}


export const MapMissile = (missileProps: MissileProps) => {

    const resizedmissileimage = missileImages[missileProps.type];
    const resizedmissileicon = { width: 50, height: 50 }; // Custom size for image

    // Convert timestamp to a future time in a readable format
    const { text } = convertimestampfuturemissile(missileProps.etatimetoimpact);

    // Determine the description based on the missile status
    let description = `${missileProps.status}`;
    if (missileProps.status === "Incoming") {
        description += ` ETA: ${text}`;
    }

    return (
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
                description={description}
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
