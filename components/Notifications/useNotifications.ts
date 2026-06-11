import { useState, useEffect, useCallback, useRef } from 'react';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../../api/notifications';
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

interface UseNotificationsOptions {
	enabled?: boolean;
}

export const useNotifications = ({ enabled = true }: UseNotificationsOptions = {}) => {
	const [notifications, setNotifications] = useState<Notification[]>([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [unreadChatCount, setUnreadChatCount] = useState(0);
	const [isLoading, setIsLoading] = useState(enabled);
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
		if (!enabled) {
			setNotifications([]);
			setUnreadCount(0);
			setUnreadChatCount(0);
			setIsLoading(false);
			setError(null);
			return;
		}
		if (!force && Date.now() - lastFetchTimeRef.current < 30000) {
			// If not forced and less than 30 seconds since last fetch, don't fetch
			return;
		}
		try {
			setIsLoading(true);
			setError(null);
			const data = await getNotifications();
			setNotifications(data);
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
	}, [enabled]);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchNotifications();

		const handleNewNotification = () => {
			fetchNotifications();
		};
		notificationEmitter.on('newNotification', handleNewNotification);

		const handleNotificationsUpdated = (data?: { type?: string, count?: number }) => {
			const count = data?.count;
			if (data?.type === 'chat' && typeof count === 'number') {
				setUnreadChatCount(prevCount => Math.max(0, prevCount - count));
			}
			// Fetch all notifications to ensure all counts are up to date.
			fetchNotifications(true);
		};
		notificationEmitter.on('notificationsUpdated', handleNotificationsUpdated);

		const handleUnreadCountUpdated = (data?: { count?: number, chatCount?: number }) => {
			if (typeof data?.count === 'number') setUnreadCount(data.count);
			if (typeof data?.chatCount === 'number') setUnreadChatCount(data.chatCount);
		};
		notificationEmitter.on('unreadCountUpdated', handleUnreadCountUpdated);

		return () => {
			notificationEmitter.off('newNotification', handleNewNotification);
			notificationEmitter.off('notificationsUpdated', handleNotificationsUpdated);
			notificationEmitter.off('unreadCountUpdated', handleUnreadCountUpdated);
		};
	}, [enabled, fetchNotifications]);

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
			notificationEmitter.emit('notificationsUpdated', { type: 'read', count: 1 });
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
			notificationEmitter.emit('notificationsUpdated', { type: 'delete', count: 1 });
		} catch (error) {
			console.error('Failed to delete notification:', error);
		}
	};

	// Non-destructive replacement for the old clear-all: notifications stay in
	// the list (the server prunes them after 30 days), they just stop counting
	// as unread.
	const markAllAsRead = useCallback(async () => {
		try {
			setError(null);
			await markAllNotificationsAsRead();
			setNotifications(prevNotifications =>
				prevNotifications.map(notification => ({ ...notification, isRead: true }))
			);
			notificationEmitter.emit('unreadCountUpdated', { count: 0, chatCount: 0 });
			notificationEmitter.emit('notificationsUpdated', { type: 'read' });
		} catch (error) {
			console.error('Failed to mark all notifications as read:', error);
			setError('Failed to update notifications. Please try again.');
		}
	}, []);

	return {
		notifications: enabled ? notifications : [],
		unreadCount: enabled ? unreadCount : 0,
		unreadChatCount: enabled ? unreadChatCount : 0,
		isLoading: enabled ? isLoading : false,
		error: enabled ? error : null,
		fetchNotifications,
		markAsRead,
		markAllAsRead,
		markMessagesAsRead,
		deleteNotificationById,
	};
};
