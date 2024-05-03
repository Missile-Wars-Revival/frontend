import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function getUser(username: string) {
  try {
    const response = await axiosInstance.get("/api/getuser", {
      params: {
        username,
      },
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}
