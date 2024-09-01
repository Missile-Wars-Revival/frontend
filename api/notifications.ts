import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

interface NotificationResponse {
	notifications: Notification[];
}

interface Notification {
	id: string;
	title: string;
	body: string;
	sentby: string;
	timestamp: string;
	isRead: boolean;
	userId: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			console.log('Token not found');
			throw new Error('Authentication token not found');
		}

		const response = await axiosInstance.get<NotificationResponse>("/api/notifications", {
			params: { token },
		});

		// The response.data.notifications is already an array of Notification objects
		return response.data.notifications;
	} catch (error) {
		console.error("Failed to fetch notifications:", error);
		throw error;
	}
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			throw new Error('Authentication token not found');
		}

		await axiosInstance.patch("/api/markNotificationAsRead", { 
			notificationId,
			token 
		});
	} catch (error) {
		console.error("Failed to mark notification as read:", error);
		throw error;
	}
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
	try {
	  const token = await SecureStore.getItemAsync("token");
	  if (!token) {
		throw new Error('Authentication token not found');
	  }
  
	  await axiosInstance.delete("/api/deleteNotification", { 
		data: { notificationId, token }
	  });
	} catch (error) {
	  console.error("Failed to delete notification:", error);
	  throw error;
	}
  };