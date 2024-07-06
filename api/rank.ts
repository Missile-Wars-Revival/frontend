import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function addrankpoints(
    token: string,
    points: number
  ) {
    try {
      // Send location data without password
      const response = await axiosInstance.post("/api/addRankPoints", {
        token,
        points,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to add rank pts")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to add rank pts")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }