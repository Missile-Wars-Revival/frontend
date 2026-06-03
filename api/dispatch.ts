import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";

const DEV_OFFLINE_TOKEN = "dev-offline-token";

export async function dispatch(
  token: string,
  latitude: number,
  longitude: number
) {
  if (token === DEV_OFFLINE_TOKEN) {
    return { success: true, offline: true };
  }

  try {
    const response = await axiosInstance.post("/api/dispatch", {
      token,
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
