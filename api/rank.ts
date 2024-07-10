import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function addrankpoints(
    token: string,
    points: number
  ) {
    try {
      const response = await axiosInstance.post("/api/addRankPoints", {
        token,
        points,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

  export async function removerankpoints(
    token: string,
    points: number
  ) {
    try {
      const response = await axiosInstance.post("/api/removeRankPoints", {
        token,
        points,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }