import { AxiosResponse } from "axios";
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

export const markMessageNotificationAsRead = async (): Promise<void> => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			throw new Error('Authentication token not found');
		}

		await axiosInstance.delete("/api/deleteMessageNotifications", {
			data: { token }
		});
	} catch (error) {
		console.error("Failed to mark notification as read:", error);
		throw error;
	}
};

export const deleteNotification = async (notificationId: string) => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			throw new Error('Authentication token not found');
		}

		await axiosInstance.delete("/api/deleteNotification", {
			data: { token, notificationId }
		});
	} catch (error) {
		console.error("Failed to delete notification:", error);
		throw error;
	}
};

interface NotificationPreferences {
	id: number;
	userId: number;
	incomingEntities: boolean;
	entityDamage: boolean;
	entitiesInAirspace: boolean;
	eliminationReward: boolean;
	lootDrops: boolean;
	friendRequests: boolean;
	leagues: boolean;
}

interface NotificationPreferencesResponse {
	preferences: NotificationPreferences;
}

interface UpdatePreferencesResponse {
	message: string;
	preferences: NotificationPreferences;
}


export const getNotificationPreferences = async (): Promise<NotificationPreferences> => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			console.log('Token not found');
			throw new Error('Authentication token not found');
		}

		const response: AxiosResponse<NotificationPreferencesResponse> = await axiosInstance.get("/api/notificationPreferences", {
			params: { token },
		});

		return response.data.preferences;
	} catch (error) {
		console.error("Failed to fetch notification preferences:", error);
		throw error;
	}
};

export const updateNotificationPreferences = async (
	preferences: Partial<NotificationPreferences>
): Promise<NotificationPreferences> => {
	try {
		const token = await SecureStore.getItemAsync("token");
		if (!token) {
			console.log('Token not found');
			throw new Error('Authentication token not found');
		}

		// First, get the current preferences
		const currentPreferences = await getNotificationPreferences();

		// Merge the current preferences with the new partial preferences
		const updatedPreferences = { ...currentPreferences, ...preferences };

		const response: AxiosResponse<UpdatePreferencesResponse> = await axiosInstance.patch(
			"/api/changeNotificationPreferences",
			{ token, preferences: updatedPreferences }
		);

		console.log("Updated preferences:", response.data.preferences);

		return response.data.preferences;
	} catch (error) {
		console.error("Failed to update notification preferences:", error);
		throw error;
	}
};
