import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

interface WeaponTypesResponse {
  landmineTypes: any[];
  missileTypes: any[];
  otherTypes: any[];
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

  // Add this function at the top level of your file
export const mapProductType = (productid: string) => {
    switch (productid) {
      case "Amplifier":
        return "Missiles";
      case "Ballista":
        return "Missiles";
      case "BigBertha":
        return "Landmine";
      case "BunkerBlocker":
        return "Landmine";
      case "Buzzard":
        return "Missiles";
      case "ClusterBomb":
        return "Missiles";
      case "CorporateRaider":
        return "Missiles";
      case "GutShot":
        return "Missiles";
      case "ShieldBreaker":
        return "Missiles";
      case "Zippy":
        return "Missiles";
      case "Coins500_":
        return "Coins";
      case "Coins1000_":
        return "Coins";
      case "Coins2000_":
        return "Coins";
      default:
        return "Other";
    }
  };

  export const shopimages: any = {
    Amplifier: require('../assets/missiles/Amplifier.png'),
    Ballista: require('../assets/missiles/Ballista.png'),
    BigBertha: require('../assets/missiles/BigBertha.png'),
    Bombabom: require('../assets/missiles/Bombabom.png'),
    BunkerBlocker: require('../assets/missiles/BunkerBlocker.png'),
    Buzzard: require('../assets/missiles/Buzzard.png'),
    ClusterBomb: require('../assets/missiles/ClusterBomb.png'),
    CorporateRaider: require('../assets/missiles/CorporateRaider.png'),
    GutShot: require('../assets/missiles/GutShot.png'),
    TheNuke: require('../assets/missiles/TheNuke.png'),
    Yokozuna: require('../assets/missiles/Yokozuna.png'),
    ShieldBreaker: require('../assets/missiles/Yokozuna.png'),
    Zippy: require('../assets/missiles/Zippy.png'),
    Coins500_: require('../assets/store/500coins.png'),
    Coins1000_: require('../assets/store/1000coins.png'),
    Coins2000_: require('../assets/store/1000coins.png'),
    LootDrop: require('../assets/mapassets/Airdropicon.png'),
    Shield: require('../assets/mapassets/shield.png'),
    UltraShield: require('../assets/mapassets/ultrashield.png'),
    LandmineSweep: require('../assets/mapassets/landminesweeper.png'),
    default: require('../assets/logo.png'), // Default image if identifier not found
  };

export async function getWeaponTypes(): Promise<WeaponTypesResponse> {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.get('/api/getWeaponTypes', {
      params: { token },
    });
    if (response.data && response.data.landmineTypes && response.data.missileTypes && response.data.otherTypes) {
      return response.data;
    } else {
      console.error("API did not return the expected structure:", response.data);
      return { landmineTypes: [], missileTypes: [], otherTypes: [] };
    }
  } catch (error) {
    if (isAxiosError(error)) {
      console.error("Error fetching weapon types:", error.response?.data || error.message);
    } else {
      console.error("Error fetching weapon types:", error);
    }
    return { landmineTypes: [], missileTypes: [], otherTypes: [] };
  }
}