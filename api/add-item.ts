import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function additem(
    token: string,
    itemName: string,
    type: string,
  ) {
    try {
      const response = await axiosInstance.post("/api/addItem", {
        token,
        itemName,
        type,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to add item")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to add item")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }