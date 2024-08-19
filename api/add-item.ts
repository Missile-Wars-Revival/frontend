import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function additem(token: string, itemName: string, category: string) {
    try {
      const response = await axiosInstance.post("/api/addItem", {
        token,
        itemName,
        category,
      });
      console.log("response", response.data)
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