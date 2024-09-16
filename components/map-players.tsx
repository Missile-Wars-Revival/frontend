import React from "react";
import { PlayerComp } from "./player";
import { getTimeDifference, isInactiveFor12Hours } from "../util/get-time-difference";
import useFetchPlayerlocations from "../hooks/websockets/playerlochook";

export interface Players {
  username: string;
  latitude?: number;
  longitude?: number;
  updatedAt: string;
  health: number;
  transportStatus: string;
}

export const AllPlayers = () => {

  const otherPlayersData = useFetchPlayerlocations() 

  return (
    <>
      {otherPlayersData
      .filter(player => !isInactiveFor12Hours(player.updatedAt))
        .map((player, index) => {
          const { text } = getTimeDifference(player.updatedAt);

          const location = {
            latitude: Number(player.latitude ?? 0), // Fallback to 0 if undefined
            longitude: Number(player.longitude ?? 0) // Fallback to 0 if undefined
          };

          return (
            <React.Fragment key={index}>
              <PlayerComp index={index} player={player} location={location} timestamp={text} health={player.health} transportStatus={player.transportStatus} ></PlayerComp> 
            </React.Fragment>
          );
        })}
    </>
  )
}