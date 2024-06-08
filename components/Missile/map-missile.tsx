import React from "react";
import { View, Image } from "react-native";
import { Circle, Marker, Polyline } from "react-native-maps";
import { missileImages } from "./missile";
import { GeoLocation, Missile } from "middle-earth";

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
    destination: GeoLocation;
    currentLocation: GeoLocation;
    trajectoryCoordinates: GeoLocation[];
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

// export const MapMissile = (missileProps: MissileProps) => {
//     const resizedmissileimage = missileImages[missileProps.type];
//     const resizedmissileicon = { width: 50, height: 50 }; // Custom size for image

//     return (
//         <View>
//             {/* Render Circle at destination coords */}
//             <Mapbox.CircleLayer
//                 id={`missile-destination-${missileProps.type}`}
//                 style={{
//                     circleRadius: missileProps.radius,
//                     circleColor: 'rgba(255, 0, 0, 0.2)',
//                     circleStrokeWidth: 2,
//                     circleStrokeColor: 'rgba(255, 0, 0, 0.8)'
//                 }}
//                 belowLayerID={`marker-${missileProps.type}`}
//             />
//             {/* Render Marker at current coords */}
//             <Mapbox.PointAnnotation
//                 id={`missile-marker-${missileProps.type}`}
//                 coordinate={[missileProps.currentLocation.longitude, missileProps.currentLocation.latitude]}
//                 title={`Missile: ${missileProps.type}`}
//                 snippet={missileProps.status}
//             >
//                 <Image source={resizedmissileimage} style={resizedmissileicon} />
//             </Mapbox.PointAnnotation>
//             {/* Render trajectory line */}
//             <Mapbox.LineLayer
//                 id={`missile-trajectory-${missileProps.type}`}
//                 style={{
//                     lineColor: 'red',
//                     lineWidth: 3
//                 }}
//             />
//         </View>
//     );
// }