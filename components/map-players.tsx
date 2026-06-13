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
  // Phase 11A: set by the server. "diffused" means latitude/longitude are
  // already the display-safe offset point — render as-is. Absent on old
  // servers (fall back to the legacy client-side diffusion of randomlocation).
  locationPrecision?: "precise" | "diffused";
  // The player's league airspace radius (m) — sizes the diffusion circle and
  // the marker's offset within it.
  airspaceRadius?: number;
  profileImageUrl?: string | null;
}

export const AllPlayers = ({ onPlayerSelect }: { onPlayerSelect?: (player: Players) => void }) => {

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
            <PlayerComp index={index} player={player} location={location} timestamp={text} health={player.health} transportStatus={player.transportStatus} randomlocation={player.randomlocation} locationPrecision={player.locationPrecision} airspaceRadius={player.airspaceRadius} onPlayerSelect={onPlayerSelect} />
          </React.Fragment>
        );
      })}
    </>
  )
}