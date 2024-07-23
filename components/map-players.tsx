import React, { useEffect } from "react";
import { PlayerComp } from "./player";
import { useUserName } from "../util/fetchusernameglobal";
import { getTimeDifference, isInactiveFor12Hours } from "../util/get-time-difference";
import useFetchPlayerlocations from "../hooks/websockets/playerlochook";

export interface Players {
  username: string;
  latitude?: number;
  longitude?: number;
  updatedAt: string;
}

export const AllPlayers = () => {

  // const userName = useUserName();
  const userName = useUserName();

  const otherPlayersData = useFetchPlayerlocations() 

  return (
    <>
      {otherPlayersData
        .filter(player => player.username.trim() !== userName.trim() && !isInactiveFor12Hours(player.updatedAt))
        .map((player, index) => {
          const { text } = getTimeDifference(player.updatedAt);

          const location = {
            latitude: player.latitude ?? 0, // Fallback to 0 if undefined
            longitude: player.longitude ?? 0 // Fallback to 0 if undefined
          };

          return (
            <React.Fragment key={index}>
              <PlayerComp index={index} player={player} location={location} timestamp={text}></PlayerComp>
            </React.Fragment>
          );
        })}
    </>
  )
}