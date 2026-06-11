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
  randomlocation: boolean;
  profileImageUrl?: string | null;
}

export const AllPlayers = () => {

  const otherPlayersData = useFetchPlayerlocations() 

  return (
    <>
      {otherPlayersData.flatMap((player, index) => {
        if (isInactiveFor12Hours(player.updatedAt)) {
          return [];
        }

        const { text } = getTimeDifference(player.updatedAt);

        const location = {
          latitude: Number(player.latitude ?? 0),
          longitude: Number(player.longitude ?? 0),
        };

        return (
          <React.Fragment key={`${player.username}-${index}`}>
            <PlayerComp index={index} player={player} location={location} timestamp={text} health={player.health} transportStatus={player.transportStatus} randomlocation={player.randomlocation} />
          </React.Fragment>
        );
      })}
    </>
  )
}