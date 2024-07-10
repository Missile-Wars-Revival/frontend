import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

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