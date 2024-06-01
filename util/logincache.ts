import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function saveCredentials(
  username: string,
  token: string
): Promise<void> {
  try {
    // Store encrypted username and password
    await SecureStore.setItemAsync("username", username);
    await SecureStore.setItemAsync("token", token);
  } catch (error) {
    console.error("Error storing credentials securely:", error);
    throw error;
  }
}

export async function getCredentials() {
  try {
    const username = await SecureStore.getItemAsync("username");
    const token = await SecureStore.getItemAsync("token");

    if (username && token) {
      return { username, token };
    } else {
      // Handle the case where credentials are not found
      console.log("No credentials stored");
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch credentials", error);
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  try {
    // Clearing credentials stored in SecureStore
    await SecureStore.deleteItemAsync("username");
    await SecureStore.deleteItemAsync("token");

    // Clearing additional items stored in AsyncStorage
    await AsyncStorage.removeItem("visibilitymode");
    await AsyncStorage.removeItem("selectedMapStyle");
    await AsyncStorage.removeItem("lastLocation");

    console.log("All credentials and settings successfully cleared.");
  } catch (error) {
    console.error("Failed to clear credentials and settings:", error);
  }
}
