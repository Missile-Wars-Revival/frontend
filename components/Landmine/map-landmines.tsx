import { Circle, Marker } from "react-native-maps";
import React from "react";
import { useUserName } from "../../util/fetchusernameglobal";
import { GeoLocation, Landmine } from "middle-earth";
import { View, Image } from "react-native";
import { convertimestampfuture } from "../../util/get-time-difference";
import { useLandmine } from "../../util/Context/landminecontext";
import { itemimages } from "../../app/profile";

interface AllLandmineProps {
    landminedata: Landmine[];
}

export const AllLandMines = (props: AllLandmineProps) => {
    const userNAME = useUserName();
    const { showAllLandmines } = useLandmine();

    return (
        <>
        {props.landminedata
            .filter(landmine => showAllLandmines || landmine.placedby === userNAME)
            .map(({ type, location, placedby, placedtime, etaexpiretime }, index) => (
                <React.Fragment key={index}>
                    <MapLandmine location={location} type={type} placedby={placedby} placedtime={placedtime} etaexpiretime={etaexpiretime} />
                </React.Fragment>
            ))}
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
    const resizedlandmineimage = itemimages[landmineProps.type];
    const resizedlandmineicon = { width: 50, height: 50 };

    const { text } = convertimestampfuture(landmineProps.etaexpiretime);
    return(
        <View>
            <Circle
                center={{
                    latitude: Number(landmineProps.location.latitude),
                    longitude: Number(landmineProps.location.longitude)
                }}
                radius={10}
                fillColor="rgba(128, 128, 128, 0.3)"
                strokeColor="rgba(128, 128, 128, 0.8)" 
            />
            <Marker
                coordinate={{
                    latitude: Number(landmineProps.location.latitude),
                    longitude: Number(landmineProps.location.longitude)
                }}
                title={`Landmine: ${landmineProps.type}`}
                description={`${text}`}
            >
                <Image source={resizedlandmineimage} style={resizedlandmineicon} />
            </Marker>
        </View>
    )
}