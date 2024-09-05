import { Friend } from "../../types/types";
import { useWebSocketContext } from "../../util/Context/websocket";
import { useEffect, useState } from "react";
import { fetchAndCacheImage } from "../../util/imagecache";

interface FriendData {
  username: string;
  // Add other properties if needed
}

const useFetchFriends = (): Friend[] => {
    const { friendsdata } = useWebSocketContext();
    const [friends, setFriends] = useState<Friend[]>([]);

    useEffect(() => {
        const fetchFriendsWithImages = async (friendsData: FriendData[]) => {
            const updatedFriends = await Promise.all(friendsData.map(async (item) => ({
                username: item.username,
                profileImageUrl: await fetchAndCacheImage(item.username)
            })));
            setFriends(updatedFriends);
        };

        if (friendsdata && Array.isArray(friendsdata)) {
            fetchFriendsWithImages(friendsdata);
        }
    }, [friendsdata]);

    return friends;
};

export default useFetchFriends;
