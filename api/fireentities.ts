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

export const firemissileplayer = async (playerusername: string, type: string,) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log('Token not found');
      return;
    }

    const response = await axiosInstance.post("/api/firemissile@player", {
      token,
      playerusername,
      type,
    });
    return response.data
  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};

export const placelandmine = async (loclat: string, loclong: string, landminetype: string,) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log('Token not found');
      return;
    }

    const locLat = loclat.toString();
    const locLong = loclong.toString();

    const response = await axiosInstance.post("/api/placelandmine", {
      token,
      locLat,
      locLong,
      landminetype,
    });
    return response.data
  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};

export const steppedonlandmine = async (landmineid: number) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log('Token not found');
      return;
    }

    const response = await axiosInstance.post("/api/steppedonlandmine", {
      token,
      landmineid,
    });
    return response.data
  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};

export const placeLoot = async (loclat: string, loclong: string) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log('Token not found');
      return;
    }

    const locLat = loclat.toString();
    const locLong = loclong.toString();

    const response = await axiosInstance.post("/api/placeloot", {
      token,
      locLat,
      locLong,
    });
    return response.data
  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};

export const lootpickup = async (lootid: number, amount: number) => {
  const token = await SecureStore.getItemAsync("token");
  try {
    if (!token) {
      console.log('Token not found');
      return;
    }

    const response = await axiosInstance.post("/api/lootpickup", {
      token,
      lootid,
      amount,
    });
    return response.data
  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};