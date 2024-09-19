import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

export const editUser = async (username: string, updates: any) => {
  try {
    const token = await SecureStore.getItemAsync("token");
    const response = await axiosInstance.post('/api/editUser', { token, username, updates });
    return response.data;
  } catch (error) {
    console.error('Error editing user:', error);
    throw error;
  }
};