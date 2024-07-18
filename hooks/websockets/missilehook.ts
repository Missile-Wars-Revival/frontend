import { Missile } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchMissiles = (): Missile[] => {
    const { missiledata } = useWebSocketContext();
    const [missiles, setMissiles] = useState<Missile[]>([]);

    useEffect(() => {
        if (missiledata) {
            //console.log('Received data:', missiledata);
            if (Array.isArray(missiledata)) {
                //console.log('Data is an array:', missiledata);
                const fetchedMissiles = missiledata.filter(item => item.itemType === "Missile");
                if (fetchedMissiles.length > 0) {
                    setMissiles(fetchedMissiles.map(item => item));
                }
            } else if (typeof missiledata === 'object' && missiledata.itemType === "Missile") {
                //console.log('Data is a single missile object:', missiledata);
                setMissiles([missiledata]);
            } else {
                console.warn('Data is not an array or a missile object:', missiledata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [missiledata]);

    return missiles;
};

export default useFetchMissiles;
