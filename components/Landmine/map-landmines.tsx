import { Circle } from "react-native-maps";
import { Landmine  } from "../../types/types";
import React from "react";
import { useUserName } from "../../util/fetchusernameglobal";

interface LandMineRenderProps {
    landminedata: Landmine[];
}
export const AllLandMines = (props: LandMineRenderProps) => {
    const userNAME = useUserName();
    return (
        <>
            {props.landminedata
            .filter(landmine => landmine.placedby === userNAME)
            .map((location, index) => (
            <Circle
                key={index}
                center={location}
                radius={10} //actual radius size
                fillColor="rgba(128, 128, 128, 0.3)"
                strokeColor="rgba(128, 128, 128, 0.8)" />
            ))}     
        </>
    )
}