import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { removemoney } from "./money";
import { Alert } from "react-native";
import { playDeathSound } from "../util/sounds/deathsound";

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
    if (!token) {
      console.log('Token not found');
      return;
    }
    await AsyncStorage.setItem('isAlive', JSON.stringify(isAlive));
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