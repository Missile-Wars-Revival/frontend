import { Other } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchOther = (): Other[] => {
    const { otherdata } = useWebSocketContext();
    const [Other, setOther] = useState<Other[]>([]);

    useEffect(() => {
        if (otherdata) {
            //console.log('Received data:', lootdata);
            if (Array.isArray(otherdata)) {
                //console.log('Data is an array:', lootdata);
                const fetchedLoots = otherdata.filter(item => item.itemType === "Other");
                if (fetchedLoots.length > 0) {
                    setOther(fetchedLoots.map(item => item));
                }
            } else if (typeof otherdata === 'object' && otherdata.itemType === "Other") {
                //console.log('Data is a single Loot object:', lootdata);
                setOther([otherdata]);
            } else {
                //console.warn('Data is not an array or a Loot object:',lootdata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [otherdata]);

    return Other;
};

export default useFetchOther;
