import { Friend } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";

const useFetchFriends = (): Friend[] => {
    const { friendsdata } = useWebSocketContext();
    const [Friendss, setFriendss] = useState<Friend[]>([]);

    useEffect(() => {
        if (friendsdata) {
            //console.log('Received data:', friendsdata);
            if (Array.isArray(friendsdata)) {
                //console.log('Data is an array:', friendsdata);
                const fetchedFriendss = friendsdata.filter(item => item.itemType === "Friends");
                if (fetchedFriendss.length > 0) {
                    setFriendss(fetchedFriendss.map(item => item));
                }
            } else if (typeof friendsdata === 'object' && friendsdata.itemType === "Friends") {
                //console.log('Data is a single Friends object:', friendsdata);
                setFriendss([friendsdata]);
            } else {
                //console.warn('Data is not an array or a Friends object:',friendsdata);
            }
        } else {
            //console.log('Data is undefined or null');
        }
    }, [friendsdata]);

    return Friendss;
};

export default useFetchFriends;
