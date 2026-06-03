import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removemoney } from "./money";
import { Alert } from "react-native";
//import { playDeathSound } from "../util/sounds/deathsound";

const DEV_OFFLINE_TOKEN = "dev-offline-token";

const isDevOfflineToken = (token: string) => token === DEV_OFFLINE_TOKEN;

export async function getHealth(
  token: string,
) {
  if (isDevOfflineToken(token)) {
    const cachedHealth = await AsyncStorage.getItem('health');
    const health = cachedHealth ? Number(cachedHealth) : 100;
    return { health };
  }

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
  if (isDevOfflineToken(token)) {
    await AsyncStorage.setItem('health', String(newHealth));
    return { success: true, health: newHealth };
  }

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
  if (isDevOfflineToken(token)) {
    const cachedHealth = await AsyncStorage.getItem('health');
    const currentHealth = cachedHealth ? Number(cachedHealth) : 100;
    const updatedHealth = Math.max(0, currentHealth - amount);
    await AsyncStorage.setItem('health', String(updatedHealth));
    return { success: true, health: updatedHealth };
  }

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
  if (isDevOfflineToken(token)) {
    const cachedHealth = await AsyncStorage.getItem('health');
    const currentHealth = cachedHealth ? Number(cachedHealth) : 100;
    const updatedHealth = currentHealth + amount;
    await AsyncStorage.setItem('health', String(updatedHealth));
    return { success: true, health: updatedHealth };
  }

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
    if (!token) {
      console.log('Token not found');
      return;
    }
    await AsyncStorage.setItem('isAlive', JSON.stringify(isAlive));

    if (isDevOfflineToken(token)) {
      return;
    }

    // Including the token as part of the URL query parameters
    const url = `/api/isAlive?token=${encodeURIComponent(token)}`;
    await axiosInstance.patch(url, {
      isAlive
    });
    console.log("isAlive status updated successfully to:", isAlive);
    if (isAlive === false) {
      //playDeathSound();
      const response = await axiosInstance.get('/api/getMoney', {
        params: { token }
      });
      const amountmon = response.data.money

      const deductmon = amountmon * 0.4

      Alert.alert(`You have lost 40% of your money which is: ${deductmon} Coins`)

      removemoney(token, deductmon)
    }

  } catch (error) {
    console.error("Failed to update isAlive status:", error);
    throw new Error('Failed to update isAlive mode.');
  }
};

//get alive status
export async function getisAlive(
  token: string,
) {
  if (isDevOfflineToken(token)) {
    const cachedIsAlive = await AsyncStorage.getItem('isAlive');
    const isAliveValue = cachedIsAlive ? JSON.parse(cachedIsAlive) : true;
    const data = { isAlive: Boolean(isAliveValue) };
    await AsyncStorage.setItem('isAlive', JSON.stringify(data));
    return data;
  }

  try {
    const response = await axiosInstance.post("/api/getisAlive", {
      token,
    });
    await AsyncStorage.setItem('isAlive', JSON.stringify(response.data));
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("failed to get isAlive")
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("failed to get isAlive")
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}