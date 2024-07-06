import axiosInstance from "./axios-instance";
import axios, { isAxiosError } from "axios";

interface FriendResponse {
  message: string;
}

export async function addFriend(token: string, friend: string): Promise<FriendResponse> {
  try {
    const response = await axiosInstance.post("/api/addFriend", {
      token,
      friend,
    });

    // Assuming the backend always sends a JSON response with a message.
    return response.data as FriendResponse;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // Handling Axios errors specifically
      if (error.response) {
        // Backend responded with a status code outside the 2xx range
        console.error("Backend returned an error:", error.response.data);
        throw new Error(error.response.data.message || 'Unknown error occurred');
      } else if (error.request) {
        // No response was received after sending the request
        console.error("No response received:", error.request);
        throw new Error('No response from server');
      } else {
        // Something happened setting up the request that triggered an error
        console.error("Error setting up your request:", error.message);
        throw new Error('Error setting up request');
      }
    } else {
      // Non-Axios error
      console.error("An unexpected error occurred:", error);
      throw error;
    }
  }
}