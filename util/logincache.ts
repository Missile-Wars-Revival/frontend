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

export async function clearCredentials(): Promise<void> {
  try {
    // Clearing credentials stored in SecureStore
    await SecureStore.deleteItemAsync("username");
    await SecureStore.deleteItemAsync("token");

    // Clearing additional items stored in AsyncStorage
    await AsyncStorage.removeItem("visibilitymode"); //Friends or global map (this may be stored backend eventually)
    await AsyncStorage.removeItem("selectedMapStyle"); //Map theme
    await AsyncStorage.removeItem("regionlocation"); //Cache of locaiton
    await AsyncStorage.setItem("firstload", `true`); //To cache if its first time opening app
    await AsyncStorage.setItem('dbconnection', 'true'); //To cache db connection status across the app
    await AsyncStorage.setItem(`isAlive`, `true`); //Stored locally for same reason as above
    await AsyncStorage.removeItem('signedIn');
    console.log("All credentials and settings successfully cleared.");
  } catch (error) {
    console.error("Failed to clear credentials and settings:", error);
  }
}
