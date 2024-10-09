import { Players } from "../../components/map-players";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchPlayerlocations = (): Players[] => {
    const { playerlocations } = useWebSocketContext();
    const [ploc, setploc] = useState<Players[]>([]);

    useEffect(() => {
        if (playerlocations) {
            //console.log('Received data:', playerlocations);
            if (Array.isArray(playerlocations)) {
                const validPlayerLocations = playerlocations.filter(item => item.hasOwnProperty("latitude") && item.hasOwnProperty("longitude"));
                if (validPlayerLocations.length > 0) {
                    setploc(validPlayerLocations.map(item => ({
                        username: item.username,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt,
                        deletedAt: item.deletedAt,
                        health: item.health,
                        transportStatus: item.transportStatus,
                        randomlocation: item.randomlocation
                    })));
                }
            } else {
                console.warn('Data is not an array:', playerlocations);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [playerlocations]);

    return ploc;
};

export default useFetchPlayerlocations;
