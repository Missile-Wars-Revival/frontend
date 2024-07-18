import { Landmine } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLandmines = (): Landmine[] => {
    const { landminedata } = useWebSocketContext();
    const [Landmines, setLandmines] = useState<Landmine[]>([]);

    useEffect(() => {
        if (landminedata) {
            //console.log('Received data:', landminedata);
            if (Array.isArray(landminedata)) {
                //console.log('Data is an array:', landminedata);
                const fetchedLandmines = landminedata.filter(item => item.itemType === "Landmine");
                if (fetchedLandmines.length > 0) {
                    setLandmines(fetchedLandmines.map(item => item.payload));
                }
            } else if (typeof landminedata === 'object' && landminedata.itemType === "Landmine") {
                //console.log('Data is a single Landmines object:', landminedata);
                setLandmines([landminedata]);
            } else {
                //console.warn('Data is not an array or a Landmines object:', data);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [landminedata]);

    return Landmines;
};

export default useFetchLandmines;
