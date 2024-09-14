import { Circle, Marker } from "react-native-maps";
import React from "react";
import { useUserName } from "../../util/fetchusernameglobal";
import { GeoLocation, Landmine } from "middle-earth";
import { View, Image, Platform } from "react-native";
import { LandmineImages } from "./landmine"; 
import { convertimestampfuture } from "../../util/get-time-difference";

interface AllLandmineProps {
    landminedata: Landmine[];
}

export const AllLandMines = (props: AllLandmineProps) => {
    const userNAME = useUserName();
    return (
        <>
        {props.landminedata .filter(landmine => landmine.placedby === userNAME) .map(({ type, location, placedby, placedtime, etaexpiretime }, index) => {

            return (
            <React.Fragment key={index}>
                <MapLandmine location={location} type={type} placedby={placedby} placedtime={placedtime} etaexpiretime={etaexpiretime}  />
            </React.Fragment>
            );
        })}
        </>
    );
}

interface LandmineProps {
    type: string;
    location: GeoLocation;
    placedby: string;
    placedtime: string;
    etaexpiretime: string;
  }

export const MapLandmine = (landmineProps: LandmineProps) => {
    const resizedlandmineimage = LandmineImages[landmineProps.type];
    const resizedlandmineicon = { width: 50, height: 50 }; // Custom size for image
    const { text } = convertimestampfuture(landmineProps.etaexpiretime);
    const isAndroid = Platform.OS === 'android';

    return(
        <View>
            {/* Render Circle at destination coords */}
            <Circle
                center={isAndroid ? {
                    latitude: parseFloat(landmineProps.location.latitude.toFixed(6)),
                    longitude: parseFloat(landmineProps.location.longitude.toFixed(6))
                } : landmineProps.location}
                radius={10}
                fillColor="rgba(128, 128, 128, 0.3)"
                strokeColor="rgba(128, 128, 128, 0.8)"
                {...(isAndroid && {
                    strokeWidth: 1,
                    zIndex: 1,
                })}
            />
            <Marker
                coordinate={isAndroid ? {
                    latitude: parseFloat(landmineProps.location.latitude.toFixed(6)),
                    longitude: parseFloat(landmineProps.location.longitude.toFixed(6))
                } : landmineProps.location}
                title={`Landmine: ${landmineProps.type}`}
                description={`${text}`}
            >
                <Image source={resizedlandmineimage} style={resizedlandmineicon} />
            </Marker>
        </View>
    )
}