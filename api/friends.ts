import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function friends(username: string, password: string) {
  try {
    const response = await axiosInstance.post("/api/friends", {
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
