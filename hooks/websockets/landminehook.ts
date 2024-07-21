import { Landmine } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLandmines = (): Landmine[] => {
    const { landminedata } = useWebSocketContext();
    const [landmines, setlandmines] = useState<Landmine[]>([]);

    useEffect(() => {
        if (landminedata) {
            //console.log('Received data:', landminedata);
            if (Array.isArray(landminedata)) {
                //console.log('Data is an array:', landminedata);
                const fetchedlandmines = landminedata.filter(item => item.itemType === "Missile");
                if (fetchedlandmines.length > 0) {
                    setlandmines(fetchedlandmines.map(item => item));
                }
            } else if (typeof landminedata === 'object' && landminedata.itemType === "Missile") {
                //console.log('Data is a single missile object:', landminedata);
                setlandmines([landminedata]);
            } else {
                console.warn('Data is not an array or a missile object:', landminedata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [landminedata]);

    return landmines;
};

export default useFetchLandmines;