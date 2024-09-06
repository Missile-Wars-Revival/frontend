import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

export interface Player {
    id: string;
    username: string;
    points: number;
    profilePicture: string;
    isCurrentUser?: boolean;
}

export interface League {
    id: string;
    name: string;
    topPlayer: {
        username: string;
        points: number;
    };
}

export async function fetchTopLeagues() {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        const response = await axiosInstance.get('/api/topleagues', {
            params: { token },
        });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.error("Error fetching top leagues:", error.response?.data || error.message);
        } else {
            console.error("Error fetching top leagues:", error);
        }
        return [];
    }
}

export async function fetchCurrentLeague() {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        const response = await axiosInstance.get('/api/leagues/current', {
            params: { token },
        });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.error("Error fetching current league:", error.response?.data || error.message);
        } else {
            console.error("Error fetching current league:", error);
        }
        return null;
    }
}

export async function fetchLeaguePlayers() {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        const response = await axiosInstance.get('/api/leagues/players', {
            params: { token },
        });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.error("Error fetching league players:", error.response?.data || error.message);
        } else {
            console.error("Error fetching league players:", error);
        }
        return [];
    }
}
