import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { logout } from "../api/login";
import { resetServerSession } from "../api/server-discovery";
import { setBackgroundAccessibleItem } from "./secure-store";

export async function saveCredentials(
  username: string,
  token: string,
  notificationToken: string,
): Promise<void> {
  try {
    // Store encrypted username and password
    await SecureStore.setItemAsync("username", username);
    await setBackgroundAccessibleItem("token", token);
    // The push token is often still empty at login (permission granted later /
    // async fetch unresolved). Only cache a real value — the cache mirrors
    // what the backend holds, and login skips empty tokens server-side too.
    if (notificationToken) {
      await SecureStore.setItemAsync("notificationToken", notificationToken);
    }
  } catch (error) {
    console.error("Error storing credentials securely:", error);
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await clearCredentials();
  await AsyncStorage.setItem('signedIn', 'false');
  // Next sign-in must go through the server selector again (Phase 7).
  resetServerSession();
}

export async function clearCredentials(): Promise<void> {
  try {
    await logout();
    // Clearing credentials stored in SecureStore
    await SecureStore.deleteItemAsync("username");
    await SecureStore.deleteItemAsync("email");
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("notificationToken")
    await SecureStore.deleteItemAsync("firebaseUID");
    // Clearing additional items stored in AsyncStorage
    await AsyncStorage.removeItem("visibilitymode"); //Friends or global map (this may be stored backend eventually)
    await AsyncStorage.removeItem("selectedMapStyle"); //Map theme
    await AsyncStorage.removeItem("regionlocation"); //Cache of locaiton
    await AsyncStorage.setItem("firstload", `true`); //To cache if its first time opening app
    await AsyncStorage.setItem('dbconnection', 'true'); //To cache db connection status across the app
    await AsyncStorage.setItem(`isAlive`, `true`); //Stored locally for same reason as above
    await AsyncStorage.removeItem('signedIn');
    await AsyncStorage.removeItem('locActive');
    await AsyncStorage.removeItem('onboardingComplete');
    await AsyncStorage.removeItem('alreadyLaunchedV3');
    console.log("All credentials and settings successfully cleared.");
  } catch (error) {
    console.error("Failed to clear credentials and settings:", error);
  }
}
