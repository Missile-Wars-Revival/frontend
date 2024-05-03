import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";

export async function testUsers() {
  try {
    const response = await axiosInstance.get("/api/testusers");

    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data);
    }

    throw error;
  }
}
