import { Circle, Marker } from "react-native-maps";
import React, { useEffect, useState } from "react";
import { useUserName } from "../../util/fetchusernameglobal";
import { GeoLocation, Landmine } from "middle-earth";
import { View, Image } from "react-native";
import { convertimestampfuture } from "../../util/get-time-difference";
import { useLandmine } from "../../util/Context/landminecontext";
import { getImages } from "../../api/store";
import { getLeagueAirspace } from "../player";
import { useUserLeague } from "../../hooks/api/useUserLEague";
import { calculateDistance, getCurrentLocation, location } from "../../util/locationreq";

interface AllLandmineProps {
    landminedata: Landmine[];
}

export const AllLandMines = (props: AllLandmineProps) => {
    const userNAME = useUserName();
    const { showAllLandmines } = useLandmine();
    const userLeague = useUserLeague();
    const leagueairspace = getLeagueAirspace(userLeague?.league || 'bronze');

    const [userLocation, setUserLocation] = useState<location | null>(null);
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

    useEffect(() => {
        (async () => {
            let location = await getCurrentLocation();
            setUserLocation({
                latitude: location.latitude,
                longitude: location.longitude
            });
        })();
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            const imageGetter = await getImages();
            setGetImageForProduct(() => imageGetter);
        };
        loadImages();
    }, []);

    if (!userLocation) {
        return null; // Or a loading indicator
    }

    return (
        <>
        {props.landminedata
            .filter(landmine => {
                const distance = calculateDistance(userLocation, landmine.location);
                return (showAllLandmines && distance <= leagueairspace) || landmine.placedby === userNAME;
            })
            .map(({ type, location, placedby, placedtime, etaexpiretime }, index) => (
                <React.Fragment key={index}>
                    <MapLandmine 
                        location={location} 
                        type={type} 
                        placedby={placedby} 
                        placedtime={placedtime} 
                        etaexpiretime={etaexpiretime} 
                        getImageForProduct={getImageForProduct}
                    />
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
    getImageForProduct: (imageName: string) => any;
}

export const MapLandmine = (landmineProps: LandmineProps) => {
    const resizedlandmineimage = landmineProps.getImageForProduct(landmineProps.type);
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
                description={`Placed by ${landmineProps.placedby} with ${text} left`}
                zIndex={1} // Same priority as missiles
            >
                <Image source={resizedlandmineimage} style={resizedlandmineicon} />
            </Marker>
        </View>
    )
}
