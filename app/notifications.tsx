import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, Modal } from 'react-native';
import { useNotifications } from '../components/Notifications/useNotifications';
import * as SecureStore from "expo-secure-store";
import { addFriend } from '../api/friends';
import { Ionicons } from '@expo/vector-icons'; // Make sure to import Ionicons
import { useRouter } from 'expo-router'; // Import useRouter
import { MissileLibrary } from '../components/Missile/missile';

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
	const router = useRouter(); // Initialize useRouter

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

	const [showMissileLibrary, setShowMissileLibrary] = useState(false);
	const [selectedPlayer, setSelectedPlayer] = useState("");

	const handleFireBack = useCallback(async (item: Notification) => {
		try {
			setShowMissileLibrary(true);
			setSelectedPlayer(item.sentby);

		} catch (error) {
			console.error('Failed to fire missile:', error);
		}
	}, []);

	const dismissNotification = useCallback(async (item: Notification) => {
		try {
			await deleteNotificationById(item.id);
			setHiddenIds(prev => new Set(prev).add(item.id));
		} catch (error) {
			console.error('Failed to dismiss notification:', error);
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
				{item.title === 'Friend Accepted' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.acceptButton} onPress={() => router.push('/friends')}>
							<Text style={styles.buttonText}>View Friends</Text>
						</TouchableOpacity>
					</View>
				)}
				{item.title === 'Friendly Bot' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.waveButton} onPress={() => dismissNotification(item)}>
							<Ionicons name="hand-left" size={24} color="#fff" />
						</TouchableOpacity>
						<TouchableOpacity style={styles.fireBackButton} onPress={() => handleFireBack(item)}>
							<Text style={styles.buttonText}>Fire!</Text>
						</TouchableOpacity>
					</View>
				)}
				{['Incoming Missile!', 'Eliminated!'].includes(item.title) && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.fireBackButton} onPress={() => handleFireBack(item)}>
							<Text style={styles.buttonText}>Fire Back!</Text>
						</TouchableOpacity>
					</View>
				)}
				{['Missile Alert!', 'Missile Impact Alert!', 'Landmine Nearby!', 'Loot Nearby!', 'Loot Within Reach!', 'Kill Reward'].includes(item.title) && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={styles.dismissButton} onPress={() => dismissNotification(item)}>
							<Text style={styles.buttonText}>Dismiss</Text>
						</TouchableOpacity>
					</View>
				)}
			</TouchableOpacity>
		);
	}, [hiddenIds, markAsRead, handleAccept, handleDecline, handleFireBack, dismissNotification]);

	return (
		<SafeAreaView style={styles.safeArea}>
			<View style={styles.container}>
				<View style={styles.header}>
					<TouchableOpacity onPress={() => router.push('/friends')} style={styles.backButton}>
						<Ionicons name="arrow-back" size={24} color="#fff" />
					</TouchableOpacity>
					<Text style={styles.headerText}>Notifications</Text>
				</View>
				{isLoading ? (
					<View style={styles.centerContainer}>
						<Text>Loading notifications...</Text>
					</View>
				) : error ? (
					<View style={styles.centerContainer}>
						<Text>{error}</Text>
						<TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
							<Text style={styles.retryButtonText}>Retry</Text>
						</TouchableOpacity>
					</View>
				) : (
					<FlatList
						data={notifications}
						renderItem={renderNotificationItem}
						keyExtractor={(item) => item.id}
						contentContainerStyle={styles.listContainer}
						refreshing={isLoading}
						onRefresh={fetchNotifications}
						ListEmptyComponent={
							<Text style={styles.noNotifications}>No notifications</Text>
						}
					/>
				)}
			</View>
			<Modal
				animationType="slide"
				transparent={true}
				visible={showMissileLibrary}
				onRequestClose={() => setShowMissileLibrary(false)}
			>
				<View className="flex-1 justify-end">
					<View className="h-[90%] bg-white rounded-t-3xl overflow-hidden">
						<View className="flex-row justify-between items-center p-4 bg-gray-100">
							<Text className="text-xl font-bold">Missile Library</Text>
							<TouchableOpacity
								className="bg-blue-500 px-4 py-2 rounded-lg"
								onPress={() => setShowMissileLibrary(false)}
							>
								<Text className="text-white font-bold">Done</Text>
							</TouchableOpacity>
						</View>
						<MissileLibrary
							playerName={selectedPlayer}
							onMissileFired={() => {
								// Handle missile fired event
								setShowMissileLibrary(false);
							}}
							onClose={() => setShowMissileLibrary(false)}
						/>
					</View>
				</View>
			</Modal>
		</SafeAreaView>

	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#4a5568',
	},
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#4a5568',
		paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
	},
	backButton: {
		padding: 8,
		marginRight: 16,
	},
	headerText: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#ffffff',
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
	fireBackButton: {
		backgroundColor: '#FF0000',
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
	},
	waveButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	dismissButton: {
		backgroundColor: '#718096', // A gray color that matches the header
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
	},
});

export default NotificationsPage;
