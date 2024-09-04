import { isAxiosError, AxiosError } from "axios";
import axiosInstance from "./axios-instance";

export async function register(
  username: string,
  email: string,
  password: string,
  notificationToken: string
) {
  try {
    const response = await axiosInstance.post("/api/register", {
      username,
      email,
      password,
      notificationToken,
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.log("Axios error:", axiosError.message);
      if (axiosError.response) {
        throw new Error(error.response?.data);
      }
    }
    throw error;
  }
}
