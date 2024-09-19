import { isAxiosError } from "axios";
import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

export async function requestPasswordReset(email: string) {
  try {
    const response = await axiosInstance.post("/api/requestPasswordReset", {
      email
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("failed to send location")
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("failed to send location")
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function requestUsernameReminder(email: string) {
  try {
    const response = await axiosInstance.post("/api/requestUsernameReminder", {
      email
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to request username reminder");
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("Failed to request username reminder");
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function changePassword(newPassword: string) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/changePassword", {
      token,
      newPassword
    });
    if (response.data.token) {
      // Update the token in SecureStore
      await SecureStore.setItemAsync("token", response.data.token);
    }
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to request password change");
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );  
    } else {
      console.log("Failed to request password change");
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function changeUsername(newUsername: string) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/changeUsername", {
      token,
      newUsername
    });
    
    // Check if the response contains a new token
    if (response.data.token) {
      // Update the token in SecureStore
      await SecureStore.setItemAsync("token", response.data.token);
    }
    
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to request username change");
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("Failed to request username change");
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function changeEmail(newEmail: string) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/changeEmail", {
      token,
      newEmail
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to request email change");
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("Failed to request email change");
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}

export async function deleteAcc(username: string) {
  try {
    const token = await SecureStore.getItemAsync("token");
    if (!token) throw new Error("No authentication token found.");
    const response = await axiosInstance.post("/api/deleteUser", {
      token,
      username
    });
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to delete account");
      return (
        error.response?.data || { success: false, message: "Request failed" }
      );
    } else {
      console.log("Failed to request account deletion change");
      console.error(error);
      return { success: false, message: "Request failed" };
    }
  }
}
