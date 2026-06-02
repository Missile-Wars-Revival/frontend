import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const useFetchHealth = (): number => {
    const { healthdata } = useWebSocketContext();
    const [Health, setHealth] = useState<number>(100);

    useEffect(() => {
        if (healthdata) {
            // Adjusting for the specific health data format {"health": 10}
            if (typeof healthdata === 'number') {
                setHealth(healthdata);
            } else if (typeof healthdata === 'object' && 'health' in healthdata && typeof healthdata.health === 'number') {
                setHealth(healthdata.health);
            } else {
                // Log some error or handle unexpected healthdata format
                console.warn('Received health data in an unexpected format:', healthdata);
            }
        } else {
            setHealth(0);
        }
    }, [healthdata]);

    return Health;
};

export default useFetchHealth;