import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const updatelocActive = async (locActive: boolean) => {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) throw new Error("No authentication token found.");
        await AsyncStorage.setItem('locActive', JSON.stringify(locActive));
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
        if (!token) throw new Error("No authentication token found.");
        
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
        throw error; // Propagate the error to be handled by the caller
    }
}