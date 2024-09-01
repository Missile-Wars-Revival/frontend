import axiosInstance from "./axios-instance";
import * as SecureStore from "expo-secure-store";

interface NotificationResponse {
	notifications: string[];
}

interface Notification {
	title: string;
	body: string;
	timestamp: string;
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

		// Parse the stringified JSON notifications
		const parsedNotifications = response.data.notifications.map(notificationString => 
			JSON.parse(notificationString) as Notification
		);

		return parsedNotifications;
	} catch (error) {
		console.error("Failed to fetch notifications:", error);
		throw error;
	}
};