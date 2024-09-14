import React from "react";
import { PlayerComp } from "./player";
import { getTimeDifference, isInactiveFor12Hours } from "../util/get-time-difference";
import useFetchPlayerlocations from "../hooks/websockets/playerlochook";
import { Platform } from "react-native";

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
  const isAndroid = Platform.OS === 'android';

  return (
    <>
      {otherPlayersData
        .filter(player => !isInactiveFor12Hours(player.updatedAt))
        .map((player, index) => {
          const { text } = getTimeDifference(player.updatedAt);

          const location = isAndroid ? {
            latitude: parseFloat((player.latitude ?? 0).toFixed(6)),
            longitude: parseFloat((player.longitude ?? 0).toFixed(6))
          } : {
            latitude: player.latitude ?? 0,
            longitude: player.longitude ?? 0
          };

          return (
            <React.Fragment key={index}>
              <PlayerComp index={index} player={player} location={location} timestamp={text} health={player.health} />
              {/* transportStatus={player.transportStatus} */}
            </React.Fragment>
          );
        })}
    </>
  )
}