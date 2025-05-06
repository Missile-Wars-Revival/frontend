import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

export async function login(username: string, password: string, notificationToken: string) {
  try {
    const response = await axiosInstance.post("/api/login", {
      username,
      password,
      notificationToken,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}

export async function logout() {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (!token) {
        console.log("No token found during logout, continuing cleanup");
        return;
      }
      await axiosInstance.delete("/api/deleteNotificationToken", {
        data: { token },
      });
    } catch (error) {
      console.error("Error during logout:", error);
      // Don't throw the error, just log it and continue with cleanup
    }
}