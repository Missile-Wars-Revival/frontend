import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, Modal, useColorScheme, Alert } from 'react-native';
import { useNotifications } from '../components/Notifications/useNotifications';
import * as SecureStore from "expo-secure-store";
import { addFriend } from '../api/friends';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MissileLibrary } from '../components/Missile/missile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getlocActive } from '../api/locActive';

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
	const { notifications, isLoading, error, fetchNotifications, markAsRead, deleteNotificationById, clearAllNotifications } = useNotifications();
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
	const router = useRouter();
	const [isAlive, setIsAlive] = useState<boolean>(true);
	const [showMissileLibrary, setShowMissileLibrary] = useState(false);
	const [selectedPlayer, setSelectedPlayer] = useState("");
	const [locActive, setLocActive] = useState<boolean>(true);

	const colorScheme = useColorScheme();
	const isDarkMode = colorScheme === 'dark';

	useEffect(() => {
		const initializeApp = async () => {
		  try {
			const isAliveStatusString = await AsyncStorage.getItem('isAlive');
			if (isAliveStatusString) {
			  const isAliveStatus = JSON.parse(isAliveStatusString);
	
			  setIsAlive(isAliveStatus.isAlive);
			} else {
				setIsAlive(true); // Default to true if no status is found
			}
		  } catch (error) {
			console.error('Error initializing app:', error);
		  }
		};

		initializeApp();
		fetchLocActiveStatus();

	  }, []);

	  const fetchLocActiveStatus = async () => {
		try {
		  const status = await getlocActive();
		  setLocActive(status);
		} catch (error) {
		  console.error("Failed to fetch locActive status:", error);
		} finally {
		}
	  };

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

			await deleteNotificationById(item.id);
			setHiddenIds(prev => new Set(prev).add(item.id));
		} catch (error) {
			console.error('Failed to accept friend request:', error);
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
			setHiddenIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(item.id);
				return newSet;
			});
		}
	}, [deleteNotificationById]);

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

	const handleClearAll = useCallback(async () => {
		Alert.alert(
		  "Clear All Notifications",
		  "Are you sure you want to clear all notifications?",
		  [
			{
			  text: "Cancel",
			  style: "cancel"
			},
			{
			  text: "Clear",
			  onPress: async () => {
				try {
				  await clearAllNotifications();
				  setHiddenIds(new Set(notifications.map(n => n.id)));
				} catch (error) {
				  console.error('Failed to clear all notifications:', error);
				}
			  }
			}
		  ]
		);
	  }, [notifications, clearAllNotifications]);

	const renderNotificationItem = useCallback(({ item }: { item: Notification }) => {
		if (hiddenIds.has(item.id) || item.title === 'New Message') return null;

		return (
			<TouchableOpacity
				style={[
					styles.notificationItem,
					!item.isRead && styles.unreadNotification,
					isDarkMode && styles.notificationItemDark,
					!item.isRead && isDarkMode && styles.unreadNotificationDark
				]}
				onPress={() => markAsRead(item.id)}
			>
				<View style={styles.notificationContent}>
					<Text style={[
						styles.notificationTitle,
						!item.isRead && styles.unreadText,
						isDarkMode && styles.notificationTitleDark
					]}>{item.title}</Text>
					<Text style={[
						styles.notificationBody, 
						!item.isRead && styles.unreadText,
						isDarkMode && styles.notificationBodyDark
					]}>{item.body}</Text>
					<Text style={[
						styles.notificationTime,
						isDarkMode && styles.notificationTimeDark
					]}>
						{getTimeDifference(item.timestamp)}
					</Text>
				</View>
				{item.title === 'Friend Request' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={[styles.acceptButton, isDarkMode && styles.acceptButtonDark]} onPress={() => handleAccept(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Accept</Text>
						</TouchableOpacity>
						<TouchableOpacity style={[styles.declineButton, isDarkMode && styles.declineButtonDark]} onPress={() => handleDecline(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.declineButtonDark]}>Decline</Text>
						</TouchableOpacity>
					</View>
				)}
				{item.title === 'Friend Accepted' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={[styles.acceptButton, isDarkMode && styles.acceptButtonDark]} onPress={() => router.navigate('/friends')}>
							<Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>View Friends</Text>
						</TouchableOpacity>
					</View>
				)}
				{item.title === 'Friendly Bot' && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={[styles.waveButton, isDarkMode && styles.waveButtonDark]} onPress={() => dismissNotification(item)}>
							<Ionicons name="hand-left" size={24} color={isDarkMode ? "#4CAF50" : "white"} />
						</TouchableOpacity>
						<TouchableOpacity style={[styles.fireBackButton, isDarkMode && styles.fireBackButtonDark]} onPress={() => handleFireBack(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Fire!</Text>
						</TouchableOpacity>
					</View>
				)}
				{['Incoming Missile!', 'Eliminated!'].includes(item.title) && (
					<View style={styles.actionButtons}>
						{isAlive && locActive && (
						<TouchableOpacity style={[styles.fireBackButton, isDarkMode && styles.fireBackButtonDark]} onPress={() => handleFireBack(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.buttonTextDark]}>Fire Back!</Text>
						</TouchableOpacity>
						)}
						<TouchableOpacity style={[styles.dismissButton, isDarkMode && styles.dismissButtonDark]} onPress={() => dismissNotification(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.dismissTextDark]}>Dismiss</Text>
						</TouchableOpacity>
					</View>
				)}
				{['Missile Alert!', 'Missile Impact Alert!', 'Landmine Nearby!', 'Loot Nearby!', 'Loot Collected!', 'Loot Within Reach!', 'Kill Reward', `Damaged!`, `Elimination Reward`, `Shield Destroyed!`, `Landmine Damage!`, `Missile Damage!`].includes(item.title) && (
					<View style={styles.actionButtons}>
						<TouchableOpacity style={[styles.dismissButton, isDarkMode && styles.dismissButtonDark]} onPress={() => dismissNotification(item)}>
							<Text style={[styles.buttonText, isDarkMode && styles.dismissTextDark]}>Dismiss</Text>
						</TouchableOpacity>
					</View>
				)}
			</TouchableOpacity>
		);
	}, [hiddenIds, markAsRead, handleAccept, handleDecline, handleFireBack, dismissNotification, isAlive, isDarkMode]);

	return (
		<SafeAreaView style={[styles.safeArea, isDarkMode && styles.safeAreaDark]}>
			<View style={[styles.container, isDarkMode && styles.containerDark]}>
				<View style={[styles.header, isDarkMode && styles.headerDark]}>
					<TouchableOpacity onPress={() => router.navigate('/friends')} style={styles.backButton}>
						<Ionicons name="arrow-back" size={24} color={isDarkMode ? "white" : "white"} />
					</TouchableOpacity>
					<Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>Notifications</Text>
					<TouchableOpacity onPress={handleClearAll} style={styles.clearAllButton}>
						<Text style={[styles.clearAllText, isDarkMode && styles.clearAllTextDark]}>Clear All</Text>
					</TouchableOpacity>
				</View>
				{isLoading ? (
					<View style={styles.centerContainer}>
						<Text style={[styles.loadingText, isDarkMode && styles.loadingTextDark]}>Loading notifications...</Text>
					</View>
				) : error ? (
					<View style={styles.centerContainer}>
						<Text style={[styles.errorText, isDarkMode && styles.errorTextDark]}>{error}</Text>
						<TouchableOpacity style={[styles.retryButton, isDarkMode && styles.retryButtonDark]} onPress={fetchNotifications}>
							<Text style={[styles.retryButtonText, isDarkMode && styles.retryButtonTextDark]}>Retry</Text>
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
							<Text style={[styles.noNotifications, isDarkMode && styles.noNotificationsDark]}>No notifications</Text>
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
				<View style={[styles.modalContainer, isDarkMode && styles.modalContainerDark]}>
					<View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
						<View style={[styles.modalHeader, isDarkMode && styles.modalHeaderDark]}>
							<Text style={[styles.modalTitle, isDarkMode && styles.modalTitleDark]}>Missile Library</Text>
							<TouchableOpacity
								style={[styles.modalCloseButton, isDarkMode && styles.modalCloseButtonDark]}
								onPress={() => setShowMissileLibrary(false)}
							>
								<Text style={[styles.modalCloseButtonText, isDarkMode && styles.modalCloseButtonTextDark]}>Done</Text>
							</TouchableOpacity>
						</View>
						<MissileLibrary
							playerName={selectedPlayer}
							onMissileFired={() => {
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
		backgroundColor: '#f5f5f5',
	},
	safeAreaDark: {
		backgroundColor: '#1E1E1E',
	},
	container: {
		flex: 1,
		backgroundColor: '#f5f5f5',
	},
	containerDark: {
		backgroundColor: '#1E1E1E',
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: 16,
		backgroundColor: '#4a5568',
		paddingTop: 20,
	},
	headerDark: {
		backgroundColor: '#2C2C2C',
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
	headerTextDark: {
		color: '#FFF',
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
	notificationItemDark: {
		backgroundColor: '#2C2C2C',
	},
	notificationContent: {
		marginBottom: 10,
	},
	notificationTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 5,
		color: '#2d3748',
	},
	notificationTitleDark: {
		color: '#FFF',
	},
	notificationBody: {
		fontSize: 16,
		marginBottom: 5,
		color: '#4a5568',
	},
	notificationBodyDark: {
		color: '#B0B0B0',
	},
	notificationTime: {
		fontSize: 12,
		color: '#888',
	},
	notificationTimeDark: {
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
	acceptButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	declineButton: {
		backgroundColor: '#F44336',
		padding: 8,
		borderRadius: 5,
	},
	declineButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	buttonText: {
		color: '#fff',
		fontWeight: 'bold',
	  },
	buttonTextDark: {
		color: '#4CAF50',
	},
	centerContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	loadingText: {
		fontSize: 18,
		color: '#2d3748',
	},
	loadingTextDark: {
		color: '#B0B0B0',
	},
	errorText: {
		fontSize: 18,
		color: '#F44336',
		textAlign: 'center',
	},
	errorTextDark: {
		color: '#FF6B6B',
	},
	retryButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
		marginTop: 10,
	},
	retryButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	retryButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	retryButtonTextDark: {
		color: '#4CAF50',
	},
	noNotifications: {
		fontSize: 16,
		textAlign: 'center',
		marginTop: 20,
		color: '#4a5568',
	},
	noNotificationsDark: {
		color: '#B0B0B0',
	},
	unreadNotification: {
		backgroundColor: '#e6f7ff',
	},
	unreadNotificationDark: {
		backgroundColor: '#1a3d2a', // Dark green for unread notifications in dark mode
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
	fireBackButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	waveButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
		justifyContent: 'center',
		alignItems: 'center',
	},
	waveButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	dismissButton: {
		backgroundColor: '#4a5568',
		padding: 8,
		borderRadius: 5,
		marginRight: 10,
	},
	dismissButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	dismissTextDark: {
		color: '#FF4136',
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'flex-end',
		backgroundColor: 'rgba(0, 0, 0, 0.5)',
	},
	modalContainerDark: {
		backgroundColor: 'rgba(0, 0, 0, 0.7)',
	},
	modalContent: {
		height: '90%',
		backgroundColor: '#fff',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		overflow: 'hidden',
	},
	modalContentDark: {
		backgroundColor: '#1E1E1E',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: 16,
		backgroundColor: '#f0f2f5',
	},
	modalHeaderDark: {
		backgroundColor: '#2C2C2C',
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#2d3748',
	},
	modalTitleDark: {
		color: '#FFF',
	},
	modalCloseButton: {
		backgroundColor: '#4CAF50',
		padding: 8,
		borderRadius: 5,
	},
	modalCloseButtonDark: {
		backgroundColor: '#3D3D3D',
	},
	modalCloseButtonText: {
		color: '#fff',
		fontWeight: 'bold',
	},
	modalCloseButtonTextDark: {
		color: '#4CAF50',
	},
	clearAllButton: {
		padding: 8,
	},
	clearAllText: {
		color: '#ffffff',
		fontWeight: 'bold',
	},
	clearAllTextDark: {
		color: '#4CAF50',
	},
});

export default NotificationsPage;
