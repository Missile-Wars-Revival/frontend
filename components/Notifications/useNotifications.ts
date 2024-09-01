import { useState, useEffect, useCallback } from 'react';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../api/notifications';

// Simple custom event emitter
class SimpleEventEmitter {
	private listeners: { [event: string]: Function[] } = {};

	on(event: string, callback: Function) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	off(event: string, callback: Function) {
		if (!this.listeners[event]) return;
		this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
	}

	emit(event: string, data?: any) {
		if (!this.listeners[event]) return;
		this.listeners[event].forEach(callback => callback(data));
	}
}

// Create a global event emitter
export const notificationEmitter = new SimpleEventEmitter();

interface Notification {
	id: string;
	title: string;
	body: string;
	sentby: string;
	timestamp: string;
	isRead: boolean;
	userId: string;
}

export const useNotifications = () => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await getNotifications();
			setNotifications(data);
			updateUnreadCount(data);
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
			setError('Failed to load notifications. Please try again.');
		} finally {
			setIsLoading(false);
		}
	}, []);

	const updateUnreadCount = useCallback((notifs: Notification[]) => {
		const count = notifs.filter(n => !n.isRead).length;
		setUnreadCount(count);
		// Emit the new unread count
		notificationEmitter.emit('unreadCountUpdated', count);
	}, []);

	useEffect(() => {
		fetchNotifications();

		// Set up listener for new notifications
		const handleNewNotification = () => {
			fetchNotifications();
		};
		notificationEmitter.on('newNotification', handleNewNotification);

		return () => {
			notificationEmitter.off('newNotification', handleNewNotification);
		};
	}, [fetchNotifications]);

	const markAsRead = async (notificationId: string) => {
		try {
			await markNotificationAsRead(notificationId);
			setNotifications(prevNotifications =>
				prevNotifications.map(notification =>
					notification.id === notificationId.toString()
						? { ...notification, isRead: true }
						: notification
				)
			);
			updateUnreadCount(notifications.map(n =>
				n.id === notificationId.toString() ? { ...n, isRead: true } : n
			));
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
		}
	};

	const deleteNotificationById = async (notificationId: string) => {
		try {
			await deleteNotification(notificationId);
			setNotifications(prevNotifications => 
				prevNotifications.filter(notification => notification.id !== notificationId)
			);
			updateUnreadCount(notifications.filter(n => n.id !== notificationId));
		} catch (error) {
			console.error('Failed to delete notification:', error);
		}
	};

	return {
		notifications,
		unreadCount,
		isLoading,
		error,
		fetchNotifications,
		markAsRead,
		deleteNotificationById, // Add this to the returned object
	};
};