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
        throw new Error("Token not found");
      }
      const response = await axiosInstance.delete("/api/deleteNotificationToken", {
        data: { token },
      });
      return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}