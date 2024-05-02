import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function addFriend(
  username: string,
  password: string,
  friend: string
) {
  try {
    const response = await axiosInstance.post("/api/addFriend", {
      username,
      password,
      friend,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}
