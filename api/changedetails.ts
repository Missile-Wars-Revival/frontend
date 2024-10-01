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
      // Parse the token and update it in SecureStore
      const newToken = JSON.parse(response.data.token);
      await SecureStore.setItemAsync("token", newToken);
    }
    return { success: true, message: response.data.message, token: response.data.token };
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to change password");
      if (error.response?.status === 400) {
        if (error.response.data.message.includes("Token is required")) {
          return { success: false, message: "Authentication failed. Please log in again." };
        } else {
          return { success: false, message: error.response.data.message };
        }
      } else if (error.response?.status === 401) {
        return { success: false, message: "Invalid token. Please log in again." };
      } else if (error.response?.status === 404) {
        return { success: false, message: "User not found" };
      } else if (error.response?.status === 500) {
        return { success: false, message: "Server error. Failed to change password." };
      }
      return { success: false, message: error.response?.data.message || "Failed to change password" };
    } else {
      console.error("Failed to change password:", error);
      return { success: false, message: "An unexpected error occurred" };
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
    
    if (response.data.token) {
      // Parse the token and update it in SecureStore
      const newToken = JSON.parse(response.data.token);
      await SecureStore.setItemAsync("token", newToken);
    }
    
    return {
      success: true,
      message: response.data.message,
      token: response.data.token
    };
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to change username");
      if (error.response?.status === 400) {
        return { 
          success: false, 
          message: error.response.data.message || "Invalid input for username change" 
        };
      } else if (error.response?.status === 401) {
        return { 
          success: false, 
          message: "Authentication failed. Please log in again." 
        };
      } else if (error.response?.status === 404) {
        return { 
          success: false, 
          message: "User not found" 
        };
      } else if (error.response?.status === 409) {
        return { 
          success: false, 
          message: "Username already exists" 
        };
      }
      return {
        success: false,
        message: error.response?.data.message || "Failed to change username"
      };
    } else {
      console.error("Failed to change username:", error);
      return { success: false, message: "An unexpected error occurred" };
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
    const response = await axiosInstance.post("/api/deleteAccount", {
      token,
      username
    });
    return { success: true, message: response.data.message };
  } catch (error) {
    if (isAxiosError(error)) {
      console.log("Failed to delete account");
      if (error.response?.status === 400) {
        return { 
          success: false, 
          message: "Invalid token. Please log in again." 
        };
      } else if (error.response?.status === 401) {
        return { 
          success: false, 
          message: "Invalid token. Please log in again." 
        };
      } else if (error.response?.status === 403) {
        return { 
          success: false, 
          message: "You are not authorized to delete this account." 
        };
      } else if (error.response?.status === 500) {
        return { 
          success: false, 
          message: "Server error. Failed to delete account." 
        };
      }
      return {
        success: false,
        message: error.response?.data.message || "Failed to delete account"
      };
    } else {
      console.error("Failed to delete account:", error);
      return { success: false, message: "An unexpected error occurred" };
    }
  }
}
