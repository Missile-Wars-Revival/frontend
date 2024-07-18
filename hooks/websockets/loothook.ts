import { Loot } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLoot = (): Loot[] => {
    const { sendWebsocket, data } = useWebSocketContext();
    const [Loot, setLoot] = useState<Loot[]>([]);

    useEffect(() => {
        const fetchLootMessage = {
            messages: [{ itemType: "FetchLoot" }]
        };

        console.log('Sending FetchLoot message:', fetchLootMessage);
        sendWebsocket(fetchLootMessage);
    }, [sendWebsocket]);

    useEffect(() => {
        if (data) {
            console.log('Received data:', data);
            if (Array.isArray(data)) {
                console.log('Data is an array:', data);
                const fetchedLoot = data.filter(item => item.itemType === "Loot");
                if (fetchedLoot.length > 0) {
                    setLoot(fetchedLoot.map(item => item.payload));
                }
            } else if (typeof data === 'object' && data.itemType === "Loot") {
                console.log('Data is a single Loot object:', data);
                setLoot([data]);
            } else {
                //console.warn('Data is not an array or a Loot object:', data);
            }
        } else {
            console.log('Data is undefined or null');
        }
    }, [data]);

    return Loot;
};

export default useFetchLoot;
