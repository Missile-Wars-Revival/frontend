import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";

export async function dispatch(
  token: string,
  username: string,
  latitude: number,
  longitude: number
) {
  try {
    // Send location data without password
    const response = await axiosInstance.post("/api/dispatch", {
      token,
      username,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("failed to send location")
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("failed to send location")
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}
