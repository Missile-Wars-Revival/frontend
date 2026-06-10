import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationAsRead, deleteNotification } from '../../api/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
	const [unreadChatCount, setUnreadChatCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const lastFetchTimeRef = useRef(0);

	const updateUnreadCount = useCallback((notifs: Notification[]) => {
		const chatCount = notifs.filter(n => !n.isRead && n.title === 'New Message').length;
		const otherCount = notifs.filter(n => !n.isRead && n.title !== 'New Message').length;
		setUnreadChatCount(chatCount);
		setUnreadCount(otherCount);
		notificationEmitter.emit('unreadCountUpdated', { count: otherCount, chatCount });
	}, []);

	const fetchNotifications = useCallback(async (force = false) => {
		if (!force && Date.now() - lastFetchTimeRef.current < 30000) {
			// If not forced and less than 30 seconds since last fetch, don't fetch
			return;
		}
		try {
			setIsLoading(true);
			setError(null);
			const data = await getNotifications();
			setNotifications(data);
			notificationEmitter.emit('notificationsUpdated', data);
			lastFetchTimeRef.current = Date.now();

			// Store the latest notification
			try {
				if (data.length > 0) {
					const latestNotification = data[0];
					if (latestNotification) {
						await AsyncStorage.setItem('latestNotification', `${latestNotification.title}: ${latestNotification.body}`);
					}
				}
			} catch (error) {
				console.error('Failed to store latest notification:', error);
			}
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
			setError('Failed to load notifications. Please try again.');
			notificationEmitter.emit('error', error);
		}
		setIsLoading(false);
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchNotifications();

		const handleNewNotification = () => {
			fetchNotifications();
		};
		notificationEmitter.on('newNotification', handleNewNotification);

		const handleNotificationsUpdated = (data: { type: string, count: number }) => {
			if (data.type === 'chat') {
				setUnreadChatCount(prevCount => Math.max(0, prevCount - data.count));
			}
			// Fetch all notifications to ensure all counts are up to date
			fetchNotifications();
		};
		notificationEmitter.on('notificationsUpdated', handleNotificationsUpdated);

		return () => {
			notificationEmitter.off('newNotification', handleNewNotification);
			notificationEmitter.off('notificationsUpdated', handleNotificationsUpdated);
		};
	}, [fetchNotifications]);

	// Derive unread counts from notifications list to avoid stale closures and keep in sync
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		updateUnreadCount(notifications);
	}, [notifications, updateUnreadCount]);

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
		} catch (error) {
			console.error('Failed to mark notification as read:', error);
		}
	};

	const markMessagesAsRead = async (notificationId: string) => {
		try {
			setNotifications(prevNotifications =>
				prevNotifications.map(notification =>
					notification.id === notificationId.toString()
						? { ...notification, isRead: true }
						: notification
				)
			);
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
		} catch (error) {
			console.error('Failed to delete notification:', error);
		}
	};

	const clearAllNotifications = useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			
			// Delete notifications one by one
			for (const notification of notifications) {
				await deleteNotification(notification.id);
			}
			
			setNotifications([]);
			notificationEmitter.emit('notificationsCleared');
		} catch (error) {
			console.error('Failed to clear all notifications:', error);
			setError('Failed to clear notifications. Please try again.');
		}
		setIsLoading(false);
	}, [notifications]);

	return {
		notifications,
		unreadCount,
		unreadChatCount,
		isLoading,
		error,
		fetchNotifications,
		markAsRead,
		markMessagesAsRead,
		deleteNotificationById,
		clearAllNotifications,
	};
};