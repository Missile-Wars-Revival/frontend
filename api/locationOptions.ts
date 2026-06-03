import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DEV_OFFLINE_TOKEN = "dev-offline-token";

export const updatelocActive = async (locActive: boolean) => {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        await AsyncStorage.setItem('locActive', JSON.stringify(locActive));

        if (token === DEV_OFFLINE_TOKEN) {
            return;
        }

        // Including the token as part of the URL query parameters
        const url = `/api/locActive?token=${encodeURIComponent(token)}`;
        await axiosInstance.patch(url, {
            locActive
        });
        console.log("locActive status updated successfully to:", locActive);
        if (locActive === false) {
        }

    } catch (error) {
        console.error("Failed to update locActive status:", error);
        throw new Error('Failed to update locActive mode.');
    }
};

//get loActive status
export async function getlocActive() {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return null;

        if (token === DEV_OFFLINE_TOKEN) {
            await AsyncStorage.setItem('locActive', JSON.stringify(true));
            return true;
        }

        const response = await axiosInstance.get(`/api/getlocActive?token=${encodeURIComponent(token)}`);
        const locActive = response.data.locActive;

        console.log("Received locActive status:", locActive);

        await AsyncStorage.setItem('locActive', JSON.stringify(locActive));
        return locActive;
    } catch (error) {
        console.error("Error in getlocActive:", error);
        if (isAxiosError(error)) {
            console.error("Response data:", error.response?.data);
        }
        throw error;
    }
}

export const randomLocation = async (randomLocation: boolean) => {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        await AsyncStorage.setItem('randomLocation', JSON.stringify(randomLocation));

        if (token === DEV_OFFLINE_TOKEN) {
            return { randomLocation };
        }

        // Including the token as part of the URL query parameters
        const url = `/api/randomLocation?token=${encodeURIComponent(token)}`;
        const response = await axiosInstance.patch(url, {
            randomLocation
        });
        console.log("randomLocation API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Failed to update randomLocation status:", error);
        if (isAxiosError(error)) {
            console.error("Response data:", error.response?.data);
            throw new Error(`Failed to update randomLocation mode. Server response: ${JSON.stringify(error.response?.data)}`);
        }
        throw new Error('Failed to update randomLocation mode.');
    }
};

//get randomLocation status
export async function getRandomLocation() {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return null;

        if (token === DEV_OFFLINE_TOKEN) {
            const cachedRandomLocation = await AsyncStorage.getItem('randomLocation');
            return cachedRandomLocation ? JSON.parse(cachedRandomLocation) : false;
        }

        const response = await axiosInstance.get(`/api/getrandomLocation?token=${encodeURIComponent(token)}`);
        const randomLocation = response.data.randomLocation;

        console.log("Received randomLocation status:", randomLocation);

        await AsyncStorage.setItem('randomLocation', JSON.stringify(randomLocation));
        return randomLocation;
    } catch (error) {
        console.error("Error in getRandomLocation:", error);
        if (isAxiosError(error)) {
            console.error("Response data:", error.response?.data);
        }
        throw error;
    }
}