import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function nearby(
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    const response = await axiosInstance.get("/api/nearby", {
      data: { username, latitude, longitude },
    });

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      return error.response?.data;
    }

    console.log(error);
  }
}
