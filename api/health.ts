import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getHealth(
    token: string,
  ) {
    try {
      const response = await axiosInstance.post("/api/getHealth", {
        token: token
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to get health")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to get health")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

  export async function setHealth(
    token: string,
    newHealth: number,
  ) {
    try {
      const response = await axiosInstance.post("/api/setHealth", {
        token: token,
        newHealth: newHealth
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to add health")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to add health")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

  export async function removeHealth(
    token: string,
    amount: number,
  ) {
    try {
      const response = await axiosInstance.post("/api/removeHealth", {
        token: token,
        amount: amount
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to remove health")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to remove health")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

  export async function addHealth(
    token: string,
    amount: number,
  ) {
    try {
      const response = await axiosInstance.post("/api/addHealth", {
        token: token,
        amount: amount
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        console.log("failed to add health")
        return (
          error.response?.data || { success: false, message: "Request failed" }
        );
      } else {
        console.log("failed to add health")
        console.error(error);
        return { success: false, message: "Request failed" };
      }
    }
  }

//is Alive
  export const updateisAlive = async (token: string, isAlive: boolean) => {
    try {
      await AsyncStorage.setItem('isAlive', JSON.stringify(isAlive));
      // Including the token as part of the URL query parameters
      const url = `/api/isAlive?token=${encodeURIComponent(token)}`;
      await axiosInstance.patch(url, {
        isAlive  // Send isAlive status in the request body as the backend expects
      });
      console.log("isAlive status updated successfully to:", isAlive);
    } catch (error) {
      console.error("Failed to update FriendsOnly status:", error);
      throw new Error('Failed to update visibility mode.');
    }
  };

  //get alive status
  export async function getisAlive(
    token: string,
  ) {
    try {
      const response = await axiosInstance.post("/api/getisAlive", {
        token,
      });
      await AsyncStorage.setItem('isAlive', JSON.stringify(response.data));
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