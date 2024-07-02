import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

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
