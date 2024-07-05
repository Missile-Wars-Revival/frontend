import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function removeFriend(
  token: string,
  friend: string
) {
  try {
    const response = await axiosInstance.delete("/api/removeFriend", {
      data: {
        token,
        friend,
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
