import { Landmine } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchLandmines = (): Landmine[] => {
    const { landminedata } = useWebSocketContext();
    const [landmine, setlandmine] = useState<Landmine[]>([]);

    useEffect(() => {
        if (landminedata) {
            //console.log('Received data:', landminedata);
            if (Array.isArray(landminedata)) {
                //console.log('Data is an array:', landminedata);
                const fetchedlandmines = landminedata.filter(item => item.itemType === "Landmine");
                if (fetchedlandmines.length > 0) {
                    setlandmine(fetchedlandmines.map(item => item));
                }
            } else if (typeof landminedata === 'object' && landminedata.itemType === "Landmine") {
                //console.log('Data is a single landmine object:', landminedata);
                setlandmine([landminedata]);
            } else {
                console.warn('Data is not an array or a missile object:', landminedata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [landminedata]);

    return landmine;
};

export default useFetchLandmines;