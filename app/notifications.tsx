import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNotifications } from '../components/Notifications/useNotifications';
import * as SecureStore from "expo-secure-store";
import { addFriend } from '../api/friends';

interface Notification {
	id: string;
	title: string;
	body: string;
  sentby: string;
	timestamp: string;
	isRead: boolean;
	userId: string;
}

const getTimeDifference = (timestamp: string): string => {
	const now = new Date();
	const notificationDate = new Date(timestamp);
	const differenceInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

	if (differenceInSeconds < 60) {
		return `${differenceInSeconds} seconds ago`;
	} else if (differenceInSeconds < 3600) {
		const minutes = Math.floor(differenceInSeconds / 60);
		return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
	} else if (differenceInSeconds < 86400) {
		const hours = Math.floor(differenceInSeconds / 3600);
		return `${hours} hour${hours > 1 ? 's' : ''} ago`;
	} else {
		const days = Math.floor(differenceInSeconds / 86400);
		return `${days} day${days > 1 ? 's' : ''} ago`;
	}
};

const NotificationsPage: React.FC = () => {
	const { notifications, isLoading, error, fetchNotifications, markAsRead, deleteNotificationById } = useNotifications();
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

	const handleAccept = useCallback(async (item: Notification) => {
		console.log('Accept friend request:', item);
		try {
			const token = await SecureStore.getItemAsync("token");
			if (!token) {
				console.error('No token found');
				return;
			}
			
			const response = await addFriend(token, item.sentby);
			console.log('Friend request accepted:', response.message);
			
			// Remove the notification instead of marking it as read
			await deleteNotificationById(item.id);
			setHiddenIds(prev => new Set(prev).add(item.id));
		} catch (error) {
			console.error('Failed to accept friend request:', error);
			// Optionally, show an error message to the user
      setHiddenIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(item.id);
				return newSet;
			});
		}
	}, [deleteNotificationById]);

	const handleDecline = useCallback(async (item: Notification) => {
		console.log('Decline friend request:', item);
		setHiddenIds(prev => new Set(prev).add(item.id));
		try {
			await deleteNotificationById(item.id);
		} catch (error) {
			console.error('Failed to delete notification:', error);
			// If deletion fails, remove the id from hiddenIds
			setHiddenIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(item.id);
				return newSet;
			});
		}
	}, [deleteNotificationById]);

	const renderNotificationItem = useCallback(({ item }: { item: Notification }) => {
		if (hiddenIds.has(item.id)) return null;

		return (
			<TouchableOpacity 
				style={[styles.notificationItem, !item.isRead && styles.unreadNotification]}
				onPress={() => markAsRead(item.id)}
			>
				<View style={styles.notificationContent}>
					<Text style={[styles.notificationTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
					<Text style={[styles.notificationBody, !item.isRead && styles.unreadText]}>{item.body}</Text>
					<Text style={styles.notificationTime}>
						{getTimeDifference(item.timestamp)}
					</Text>
				</View>
				{item.title === 'Friend Request' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.acceptButton} onPress={() => handleAccept(item)}>
							<Text style={styles.buttonText}>Accept</Text>
						</TouchableOpacity>
						<TouchableOpacity style={styles.declineButton} onPress={() => handleDecline(item)}>
							<Text style={styles.buttonText}>Decline</Text>
						</TouchableOpacity>
					</View>
				)}
			</TouchableOpacity>
		);
	}, [hiddenIds, markAsRead, handleAccept, handleDecline]);

	if (isLoading) {
		return (
			<View style={styles.centerContainer}>
				<Text>Loading notifications...</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.centerContainer}>
				<Text>{error}</Text>
				<TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
					<Text style={styles.retryButtonText}>Retry</Text>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<Text style={styles.header}>Notifications</Text>
			{notifications.length === 0 ? (
				<Text style={styles.noNotifications}>No notifications</Text>
			) : (
				<FlatList
					data={notifications}
					renderItem={renderNotificationItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContainer}
					refreshing={isLoading}
					onRefresh={fetchNotifications}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	header: {
		fontSize: 24,
		fontWeight: 'bold',
		padding: 20,
		backgroundColor: '#fff',
	},
	listContainer: {
		padding: 10,
	},
	notificationItem: {
		backgroundColor: '#fff',
		borderRadius: 10,
		padding: 15,
		marginBottom: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.2,
		shadowRadius: 1,
		elevation: 2,
	},
	notificationContent: {
		marginBottom: 10,
	},
	notificationTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	notificationBody: {
		fontSize: 16,
		marginBottom: 5,
	},
	notificationTime: {
		fontSize: 12,
		color: '#888',
	},
	actionButtons: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		marginTop: 10,
	},
	acceptButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
	},
	declineButton: {
		backgroundColor: '#F44336',
		padding: 8,
		borderRadius: 5,
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	retryButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
		marginTop: 10,
	},
	retryButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	noNotifications: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 20,
	},
	unreadNotification: {
		backgroundColor: '#e6f7ff',
	},
	unreadText: {
		fontWeight: 'bold',
	},
});

export default NotificationsPage;
