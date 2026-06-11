import { Friend } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";

// The friends websocket payload already carries profileImageUrl (resolved server-side),
// so this hook just passes it through.
const useFetchFriends = (): Friend[] => {
    const { friendsdata } = useWebSocketContext();
    return Array.isArray(friendsdata) ? friendsdata : [];
};

export default useFetchFriends;
