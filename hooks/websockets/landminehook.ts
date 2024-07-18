import { Landmine } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLandmines = (): Landmine[] => {
    const { sendWebsocket, data } = useWebSocketContext();
    const [Landmines, setLandmines] = useState<Landmine[]>([]);

    useEffect(() => {
        const fetchLandminesMessage = {
            messages: [{ itemType: "FetchLandmines" }]
        };

        console.log('Sending FetchLandmines message:', fetchLandminesMessage);
        sendWebsocket(fetchLandminesMessage);
    }, [sendWebsocket]);

    useEffect(() => {
        if (data) {
            console.log('Received data:', data);
            if (Array.isArray(data)) {
                console.log('Data is an array:', data);
                const fetchedLandmines = data.filter(item => item.itemType === "Landmine");
                if (fetchedLandmines.length > 0) {
                    setLandmines(fetchedLandmines.map(item => item.payload));
                }
            } else if (typeof data === 'object' && data.itemType === "Landmine") {
                console.log('Data is a single Landmines object:', data);
                setLandmines([data]);
            } else {
                //console.warn('Data is not an array or a Landmines object:', data);
            }
        } else {
            console.log('Data is undefined or null');
        }
    }, [data]);

    return Landmines;
};

export default useFetchLandmines;
