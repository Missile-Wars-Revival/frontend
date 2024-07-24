import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

export const firemissileloc = async (destlat: string, destlong: string, type: string,) => {
  const token = await SecureStore.getItemAsync("token");
    try {
      if (!token) {
        console.log('Token not found');
        return;
      }

      const destLat = destlat.toString();
      const destLong = destlong.toString();

      const response = await axiosInstance.post("/api/firemissile@loc", {
        token,
        destLat,
        destLong,
        type,
      });
      return response.data
    } catch (error) {
      console.error("Failed to update isAlive status:", error);
      throw new Error('Failed to update isAlive mode.');
    }
  };