import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

const DEV_OFFLINE_TOKEN = "dev-offline-token";

export async function getuserprofile(
    username: string,
) {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return { success: false, message: "Not signed in" };
        if (token === DEV_OFFLINE_TOKEN) return { success: false, message: "Not signed in" };
        const response = await axiosInstance.get(`/api/user-profile/`, { params: { token, username }, });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.log("failed to get user profile")
            return (
                error.response?.data || { success: false, message: "Request failed" }
            );
        } else {
            console.log("failed to get userprofile")
            console.error(error);
            return { success: false, message: "Request failed" };
        }
    }
}

export async function getselfprofile(
) {
    try {
        const token = await SecureStore.getItemAsync("token");
        if (!token) return { success: false, message: "Not signed in" };
        if (token === DEV_OFFLINE_TOKEN) return { success: false, message: "Not signed in" };
        const response = await axiosInstance.get(`/api/self-profile/`, { params: { token }, });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.log("failed to get user profile")
            return (
                error.response?.data || { success: false, message: "Request failed" }
            );
        } else {
            console.log("failed to get userprofile")
            console.error(error);
            return { success: false, message: "Request failed" };
        }
    }
}

export async function startGetSelfProfile(token: string) {
    try {
        if (!token) throw new Error("No authentication token found.");
        if (token === DEV_OFFLINE_TOKEN) return { success: false, message: "Not signed in" };
        const response = await axiosInstance.get(`/api/self-profile/`, { params: { token }, });
        return response.data;
    } catch (error) {
        if (isAxiosError(error)) {
            console.log("failed to get user profile")
            return (
                error.response?.data || { success: false, message: "Request failed" }
            );
        } else {
            console.log("failed to get userprofile")
            console.error(error);
            return { success: false, message: "Request failed" };
        }
    }
}