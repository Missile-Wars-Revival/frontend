import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function login(username: string, password: string) {
  try {
    const response = await axiosInstance.post("/api/login", {
      username,
      password,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}
