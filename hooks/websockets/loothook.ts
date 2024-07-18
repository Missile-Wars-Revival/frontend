import { Loot } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLoot = (): Loot[] => {
    const { lootdata } = useWebSocketContext();
    const [Loots, setLoots] = useState<Loot[]>([]);

    useEffect(() => {
        if (lootdata) {
            //console.log('Received data:', lootdata);
            if (Array.isArray(lootdata)) {
                console.log('Data is an array:', lootdata);
                const fetchedLoots = lootdata.filter(item => item.itemType === "Loot");
                if (fetchedLoots.length > 0) {
                    setLoots(fetchedLoots.map(item => item));
                }
            } else if (typeof lootdata === 'object' && lootdata.itemType === "Loot") {
                //console.log('Data is a single Loot object:', lootdata);
                setLoots([lootdata]);
            } else {
                //console.warn('Data is not an array or a Loot object:',lootdata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [lootdata]);

    return Loots;
};

export default useFetchLoot;
