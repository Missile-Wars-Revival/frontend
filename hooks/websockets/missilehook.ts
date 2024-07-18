import { Missile } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchMissiles = (): Missile[] => {
    const { sendWebsocket, data } = useWebSocketContext();
    const [missiles, setMissiles] = useState<Missile[]>([]);

    useEffect(() => {
        const fetchMissilesMessage = {
            messages: [{ itemType: "FetchMissiles" }]
        };

        console.log('Sending FetchMissiles message:', fetchMissilesMessage);
        sendWebsocket(fetchMissilesMessage);
    }, [sendWebsocket]);

    useEffect(() => {
        if (data) {
            console.log('Received data:', data);
            if (Array.isArray(data)) {
                console.log('Data is an array:', data);
                const fetchedMissiles = data.filter(item => item.itemType === "Missile");
                if (fetchedMissiles.length > 0) {
                    setMissiles(fetchedMissiles.map(item => item.payload));
                }
            } else if (typeof data === 'object' && data.itemType === "Missile") {
                console.log('Data is a single missile object:', data);
                setMissiles([data]);
            } else {
                //console.warn('Data is not an array or a missile object:', data);
            }
        } else {
            console.log('Data is undefined or null');
        }
    }, [data]);

    return missiles;
};

export default useFetchMissiles;
