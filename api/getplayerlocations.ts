import axiosInstance from "./axios-instance";
import { Player } from "../types/types";

export async function fetchOtherPlayersData(): Promise<Player[]> {
    try {
        const response = await axiosInstance.get('/api/playerlocations');

        if (response.status !== 200) {
            throw new Error('Failed to fetch player locations');
        }

        return response.data.map((player: Player) => ({
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
