import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";

export async function dispatch(
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    const response = await axiosInstance.post("/api/dispatch", {
      username,
      latitude,
      longitude,
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }
    console.error(error);
  }
}
