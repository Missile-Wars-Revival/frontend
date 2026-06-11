import { Loot } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const useFetchLoot = (): Loot[] => {
    const { lootdata } = useWebSocketContext();
    const [Loots, setLoots] = useState<Loot[]>([]);

    useEffect(() => {
        if (lootdata) {
            if (Array.isArray(lootdata)) {
                const fetchedLoots = lootdata.filter(item => item.itemType === "Loot");
                if (fetchedLoots.length > 0) {
                    setLoots(fetchedLoots.map(item => item));
                }
            } else if (typeof lootdata === 'object' && lootdata.itemType === "Loot") {
                setLoots([lootdata]);
            } else {
                console.warn('Data is not an array or a Loot object:', lootdata);
            }
        }
    }, [lootdata]);

    return Loots;
};

export default useFetchLoot;
