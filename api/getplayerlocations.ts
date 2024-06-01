import axiosInstance from "./axios-instance";

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
