import axiosInstance from "./axios-instance";
import { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { auth, signInWithEmailAndPassword } from "../util/firebase/firebaseAuth";

async function lookupEmail(username: string): Promise<string> {
  const response = await axiosInstance.post("/api/lookup", { username });
  return response.data.email;
}

export async function login(username: string, password: string, notificationToken: string) {
  try {
    const isDevBypassCredentials = __DEV__ && username === 'Test' && password === 'Testing123!';

    if (isDevBypassCredentials) {
      try {
        const response = await axiosInstance.post('/api/login', { username, password, notificationToken });
        return response.data;
      } catch (error) {
        // Frontend-only fallback for local/dev builds when backend is offline.
        if (isAxiosError(error) && !error.response) {
          return {
            message: 'Login successful (frontend-only dev mode)',
            token: 'dev-offline-token',
            username: 'Test',
            devBypass: true,
            offline: true,
          };
        }
        throw error;
      }
    }

    const email = await lookupEmail(username);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await SecureStore.setItemAsync("firebaseUID", userCredential.user.uid);
    const idToken = await userCredential.user.getIdToken();
    const response = await axiosInstance.post("/api/login", { idToken, notificationToken });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.message ?? error.response?.data ?? "Login failed");
    }
    throw error;
  }
}

export async function logout() {
  try {
    // Drop this device's push token from Firebase central so a signed-out
    // device stops receiving pushes (tokens live only there since Phase 6).
    const uid = auth.currentUser?.uid;
    if (uid) {
      const { getDatabase, ref, remove } = await import("firebase/database");
      await remove(ref(getDatabase(), `notificationTokens/${uid}`));
    }
    await SecureStore.deleteItemAsync("notificationToken");
  } catch (error) {
    console.error("Error during logout:", error);
  }
}
