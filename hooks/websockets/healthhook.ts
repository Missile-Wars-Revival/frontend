import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

interface Health {
    health: any
}

const useFetchLoot = (): Health[] => {
    const { healthdata } = useWebSocketContext();
    const [Health, setHealth] = useState<Health[]>([]);

    useEffect(() => {
        if (healthdata) {
            //console.log('Received data:', lootdata);
            if (Array.isArray(healthdata)) {
                //console.log('Data is an array:', lootdata);
                const fetchedLoots = healthdata.filter(item => item.itemType === "Health");
                if (fetchedLoots.length > 0) {
                    setHealth(fetchedLoots.map(item => item));
                }
            } else if (typeof healthdata === 'object' && healthdata.itemType === "Health") {
                //console.log('Data is a single Loot object:', lootdata);
                setHealth([healthdata]);
            } else {
                //console.warn('Data is not an array or a Loot object:',lootdata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [healthdata]);

    return Health;
};

export default useFetchLoot;
