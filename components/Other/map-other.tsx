import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { Marker, Circle } from "react-native-maps";
import { GeoLocation, Other } from "middle-earth";
import { convertimestampfuture } from "../../util/get-time-difference";
import { getImages } from "../../api/store";

const fallbackImage = require('../../assets/logo.png');

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
    const [getImageForProduct, setGetImageForProduct] = useState<(imageName: string) => any>(() => () => require('../../assets/logo.png'));

    useEffect(() => {
        const loadImages = async () => {
            const imageGetter = await getImages();
            setGetImageForProduct(() => imageGetter);
        };
        loadImages();
    }, []);

    const resizedotherimage = getImageForProduct(props.type);
    const resizedothericon = { width: 40, height: 40 };

    return (
        <View>
            <Circle
                center={{
                    latitude: Number(props.location.latitude),
                    longitude: Number(props.location.longitude)
                }}
                radius={Number(props.radius)}
                fillColor="rgba(0, 0, 255, 0.2)"
                strokeColor="rgba(0, 0, 255, 0.8)"
            />
            <Marker
                coordinate={{
                    latitude: Number(props.location.latitude),
                    longitude: Number(props.location.longitude)
                }}
                title={`${props.type}`}
                description={`${text}`}
                zIndex={1} // Same priority as missiles
            >
                <Image source={resizedotherimage} style={resizedothericon} />
            </Marker>
        </View>
    )
}