import { Missile } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const useFetchMissiles = (): Missile[] => {
    const { missiledata } = useWebSocketContext();
    const [missiles, setMissiles] = useState<Missile[]>([]);

    useEffect(() => {
        if (missiledata) {
            if (Array.isArray(missiledata)) {
                const fetchedMissiles = missiledata.filter(item => item.itemType === "Missile");
                if (fetchedMissiles.length > 0) {
                    setMissiles(fetchedMissiles.map(item => item));
                }
            } else if (typeof missiledata === 'object' && missiledata.itemType === "Missile") {
                setMissiles([missiledata]);
            } else {
                console.warn('Data is not an array or a missile object:', missiledata);
            }
        }
    }, [missiledata]);

    return missiles;
};

export default useFetchMissiles;
