import { useState, useEffect } from 'react';
import axiosInstance from "./axios-instance";
import { Friend } from "../types/types"

export const useFetchFriends = (username: string) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFriends = async () => {
            try {
                const response = await axiosInstance.post("/api/friends", {
                    username: username
                });
                setFriends(response.data.friends);
            } catch (error: any) {
                if (error.response) {
                    setError(error.response.data.message);
                } else if (error.isAxiosError) {
                    setError(error.message);
                } else {
                    setError("An error occurred while fetching friends.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();

        // Clean-up function if needed
        return () => {
            // Any clean-up logic
        };
    }, [username]); // Trigger effect whenever username changes

    return { friends, loading, error };
};

export default useFetchFriends;
