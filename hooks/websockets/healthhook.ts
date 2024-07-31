import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchHealth = (): number => {
    const { healthdata } = useWebSocketContext();
    const [Health, setHealth] = useState<number>(100);

    useEffect(() => {
        if (healthdata) {
            // Adjusting for the specific health data format {"health": 10}
            if (typeof healthdata === 'number') {
                // Directly setting health if it's a number
                setHealth(healthdata);
            } else if (typeof healthdata === 'object' && 'health' in healthdata && typeof healthdata.health === 'number') {
                // Properly extracting the health value if it's in the expected object format
                setHealth(healthdata.health);
            } else {
                // Log some error or handle unexpected healthdata format
                console.warn('Received health data in an unexpected format:', healthdata);
            }
        } else {
            // Optionally reset to default if no data is received
            setHealth(0);
        }
    }, [healthdata]);

    return Health;
};

export default useFetchHealth;