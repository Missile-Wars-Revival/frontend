import axiosInstance from './axios-instance';
import * as SecureStore from "expo-secure-store";

export const updateFriendsOnlyStatus = async (friendsOnly: boolean) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
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

