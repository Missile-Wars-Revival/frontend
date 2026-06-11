import React, { useEffect, useState } from "react";
import { View, Platform } from "react-native";
import { Image } from "expo-image";
import { Circle, Marker, Polyline } from "react-native-maps";
import { GeoLocation, Missile } from "middle-earth";
import { getImages } from "../../api/store";
import { showMissileDetails } from "./missile-details";
import * as geolib from 'geolib';

const fallbackImage = require('../../assets/logo.png');

interface AllMissilesProps {
    missileData: Missile[];
}

interface MissileProps {
    destination: GeoLocation;
    currentLocation: GeoLocation;
    sentbyusername: string;
    radius: number;
    type: string;
    status: string;
    etatimetoimpact: string;
    getImageForProduct: (imageName: string) => any;
}

export const AllMissiles = (props: AllMissilesProps) => {
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => fallbackImage);

    useEffect(() => {
        const loadImages = async () => {
            const imageGetter = await getImages();
            setGetImageForProduct(() => imageGetter);
        };
        loadImages();
    }, []);

    return (
        <>
            {props.missileData.map(({ destination, currentLocation, radius, type, status, etatimetoimpact, sentbyusername }, index) => (
                <React.Fragment key={index}>
                    <MapMissile destination={destination}
                        currentLocation={currentLocation}
                        sentbyusername={sentbyusername}
                        radius={radius}
                        type={type}
                        status={status}
                        etatimetoimpact={etatimetoimpact}
                        getImageForProduct={getImageForProduct} />
                </React.Fragment>
            ))}
        </>
    );
}

export const MapMissile = (missileProps: MissileProps) => {

    const { getImageForProduct } = missileProps;

    const generateTrajectory = (start: any, end: any, segments: number) => {
        const totalDistance = geolib.getDistance(start, end);
        const bearing = geolib.getGreatCircleBearing(start, end);
        let points = [start]; // Start with the initial position

        for (let i = 1; i < segments; i++) {
            const distanceTraveled = (totalDistance / segments) * i;
            const intermediatePoint = geolib.computeDestinationPoint(start, distanceTraveled, bearing);
            points.push({ latitude: intermediatePoint.latitude, longitude: intermediatePoint.longitude });
        }

        points.push(end);
        return points;
    };

    const trajectoryCoordinates = generateTrajectory(missileProps.currentLocation, missileProps.destination, 100);

    // Ensure all coordinates are numbers
    const validTrajectoryCoordinates = trajectoryCoordinates.map(coord => ({
        latitude: Number(coord.latitude),
        longitude: Number(coord.longitude)
    }));

    const resizedmissileimage = getImageForProduct(missileProps.type);
    const standardMissileSize = { width: 50, height: 50 }; // Fixed size for all missile images

    const isAndroid = Platform.OS === 'android';

    const handleMarkerPress = () => {
        // The details modal is hosted outside the MapView (MissileDetailsHost)
        // because react-native-maps never presents modals mounted under it.
        showMissileDetails({
            type: missileProps.type,
            status: missileProps.status,
            sentbyusername: missileProps.sentbyusername,
            etatimetoimpact: missileProps.etatimetoimpact,
            radius: missileProps.radius,
        });
    };

    return (
        <View>
            {/* Render Circle at destination coords */}
            <Circle
                center={{
                    latitude: Number(missileProps.destination.latitude),
                    longitude: Number(missileProps.destination.longitude)
                }}
                radius={missileProps.radius}
                fillColor="rgba(255, 0, 0, 0.2)"
                strokeColor="rgba(255, 0, 0, 0.8)"
                // Add these props for Android
                {...(isAndroid && {
                    strokeWidth: 1,
                    zIndex: 1,
                })}
            />
            {/* Render Marker at current coords */}
            <Marker
                coordinate={{
                    latitude: Number(missileProps.currentLocation.latitude),
                    longitude: Number(missileProps.currentLocation.longitude)
                }}
                onPress={handleMarkerPress}
                zIndex={1}
            >
                <Image
                    source={resizedmissileimage}
                    style={standardMissileSize}
                    contentFit="contain"
                />
            </Marker>
            {/* Render trajectory line */}
            <Polyline
                coordinates={validTrajectoryCoordinates}
                strokeColor="red"
                strokeWidth={3}
            />
        </View>
    )
}
