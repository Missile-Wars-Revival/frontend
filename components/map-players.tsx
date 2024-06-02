import React, { useEffect, useState } from "react";
import { Player } from "middle-earth";
import { PlayerComp } from "./player";
import { useUserName } from "../util/fetchusernameglobal";
import { getTimeDifference, isInactiveFor24Hours } from "../util/get-time-difference";
import { fetchOtherPlayersData } from "../api/getplayerlocations";

export const AllPlayers = () => {

  const userNAME = useUserName();

    const [otherPlayersData, setOtherPlayersData] = useState([] as Player[]); 


    //When implementing websockets this is what needs to be changed
    const fetchOtherPlayers = async () => {
      try {
        const data = await fetchOtherPlayersData();
        setOtherPlayersData(data); 
        //console.log("Data fetching...", data);
      } catch (error) {
        console.error('Error fetching other players data:', error);
      }
    };
  
    useEffect(() => {
      fetchOtherPlayers(); // Initial fetch
  
      // Set interval to send location to backend every 30 seconds
      const intervalId = setInterval(fetchOtherPlayers, 30000);
  
      // Cleanup interval on component unmount
      return () => {
        clearInterval(intervalId);
      };
    }, []);
    return (
        <>
            {otherPlayersData
            .filter(player => player.username !== userNAME && !isInactiveFor24Hours(player.updatedAt))
            .map((player, index) => {
            const { text } = getTimeDifference(player.updatedAt);

            const location = {
              latitude: player.location.latitude ?? 0, // Fallback to 0 if undefined
              longitude: player.location.longitude ?? 0 // Fallback to 0 if undefined
            };            

            return (
                <React.Fragment key={index}>
                <PlayerComp index={index} player={player} location={location} description={text}></PlayerComp>
                </React.Fragment>
            );
            })}
        </>
    )
}