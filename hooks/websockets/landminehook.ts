import { Landmine } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const useFetchLandmines = (): Landmine[] => {
    const { landminedata } = useWebSocketContext();
    const [landmine, setlandmine] = useState<Landmine[]>([]);

    useEffect(() => {
        if (landminedata) {
            if (Array.isArray(landminedata)) {
                const fetchedlandmines = landminedata.filter(item => item.itemType === "Landmine");
                if (fetchedlandmines.length > 0) {
                    setlandmine(fetchedlandmines.map(item => item));
                }
            } else if (typeof landminedata === 'object' && landminedata.itemType === "Landmine") {
                setlandmine([landminedata]);
            } else {
                console.warn('Data is not an array or a missile object:', landminedata);
            }
        }
    }, [landminedata]);

    return landmine;
};

export default useFetchLandmines;