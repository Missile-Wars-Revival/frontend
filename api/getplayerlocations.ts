import axios from "axios";
import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

export async function fetchOtherPlayersData(): Promise<any[]> {
    try {
        const response = await axiosInstance.get('/api/playerlocations');

        if (response.status !== 200) {
            throw new Error('Failed to fetch player locations');
        }

        return response.data.map((player: any) => ({
            username: player.username,
            latitude: player.latitude,
            longitude: player.longitude,
            updatedAt: player.updatedAt
        }));
    } catch (error) {
        console.error("Error fetching other players data:", error);
        // Return an empty array if an error occurs
        return [];
    }
}

export async function searchOtherPlayersData(searchTerm: string): Promise<any[]> {
    try {
        const response = await axiosInstance.get('/api/playerlocations', {
            params: {
                searchTerm: searchTerm
            }
        });

        if (response.status !== 200) {
            throw new Error('Failed to fetch player locations');
        }

        return response.data.map((player: any) => ({
            username: player.username,
            latitude: player.latitude,
            longitude: player.longitude,
            updatedAt: player.updatedAt
        }));
    } catch (error) {
        console.error("Error fetching other players data:", error);
        // Return an empty array if an error occurs
        return [];
    }
}

export const NearbyPlayersData = async (latitude: number, longitude: number) => {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) {
            throw new Error("Token not found");
        }
        
        // Use GET request and send data as query parameters
        const response = await axiosInstance.get('/api/nearby', {
            params: {
                token,
                latitude: latitude.toString(),  // Convert to string if necessary
                longitude: longitude.toString()  // Convert to string if necessary
            }
        });

        if (response.data && response.data.nearbyUsers) {
            return response.data.nearbyUsers;
        } else {
            const message = response.data.message || 'No nearby users found or bad response format';
            throw new Error(message);
        }
    } catch (error: unknown) {
        // Check if the error is an AxiosError
        if (axios.isAxiosError(error)) {
            //console.log("Error fetching nearby players:", error.message);
            if (error.response) {
                //console.error("Error Response:", error.response.data);
                const errorMessage = error.response.data.message || 'An unexpected error occurred';
                console.log("Error Message:", errorMessage);
            }
        } else if (error instanceof Error) {
            console.error("Error:", error.message);
        } else {
            console.error("An unexpected error type was thrown.");
        }
        return [];  // Return empty array in case of error
    }
};
