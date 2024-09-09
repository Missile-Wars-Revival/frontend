import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

interface WeaponTypesResponse {
  landmineTypes: any[];
  missileTypes: any[];
}

export interface Product {
    id: string;
    name: string;
    type: string;
    price: number;
    image: any;
    description: string;
    speed?: number;
    radius?: number;
    damage?: number;
    fallout?: number;
    duration?: number;
  }
  
  export interface PremProduct {
    id: string;
    name: string;
    type: string;
    price: number;
    displayprice: string;
    image: any;
    description: string;
    sku?: string;
  }

export async function getWeaponTypes(): Promise<WeaponTypesResponse> {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.get('/api/getWeaponTypes', {
      params: { token },
    });
    if (response.data && response.data.landmineTypes && response.data.missileTypes) {
      return response.data;
    } else {
      console.error("API did not return the expected structure:", response.data);
      return { landmineTypes: [], missileTypes: [] };
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("Error fetching weapon types:", error.response?.data || error.message);
    } else {
      console.error("Error fetching weapon types:", error);
    }
    return { landmineTypes: [], missileTypes: [] };
  }
}