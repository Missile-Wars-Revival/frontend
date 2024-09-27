import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

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
      //console.log("failed to add item")
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

export async function removeItem(itemName: string, quantity: number) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/deduct-inventory", {
      token,
      itemName,
      quantity,
    });
    console.log("response", response.data)
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      //console.log("failed to add item")
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      //console.log("failed to add item")
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function receiveItem(itemName: string, quantity: number) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/add-inventory", {
      token,
      itemName,
      quantity,
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