import { Other } from "middle-earth";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

/* eslint-disable react-hooks/set-state-in-effect */

const useFetchOther = (): Other[] => {
    const { otherdata } = useWebSocketContext();
    const [Other, setOther] = useState<Other[]>([]);

    useEffect(() => {
        if (otherdata) {
            if (Array.isArray(otherdata)) {
                const fetchedOthers = otherdata.filter(item => item.itemType === "Other");
                if (fetchedOthers.length > 0) {
                    setOther(fetchedOthers.map(item => item));
                }
            } else if (typeof otherdata === 'object' && otherdata.itemType === "Other") {
                setOther([otherdata]);
            } else {
                console.warn('Data is not an array or an Other object:', otherdata);
            }
        }
    }, [otherdata]);

    return Other;
};

export default useFetchOther;
