import axios from 'axios';
import axiosInstance from './axios-instance';

interface FriendsOnlyResponse {
  message: string;
  user: {
    username: string;
    friendsOnly: boolean;
  };
}

export const updateFriendsOnlyStatus = async (token: string, friendsOnly: boolean) => {
    try {
        // Including the token as part of the URL query parameters
        const url = `/api/friendsOnlyStatus?token=${encodeURIComponent(token)}`;
        await axiosInstance.patch(url, {
            friendsOnly  // Send friendsOnly status in the request body as the backend expects
        });
        console.log("FriendsOnly status updated successfully to:", friendsOnly);
    } catch (error) {
        console.error("Failed to update FriendsOnly status:", error);
        throw new Error('Failed to update visibility mode.');
    }
};

