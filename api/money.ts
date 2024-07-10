import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function addmoney(
    token: string,
    amount: number
  ) {
    try {
      // Send location data without password
      const response = await axiosInstance.post("/api/addMoney", {
        token,
        amount,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to add money")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to add money")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

  export async function removemoney(
    token: string,
    amount: number
  ) {
    try {
      // Send location data without password
      const response = await axiosInstance.post("/api/removeMoney", {
        token,
        amount,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to remove money")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to remove money")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }