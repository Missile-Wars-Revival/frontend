import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Modal, useColorScheme, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '../../../components/Notifications/useNotifications';
import * as SecureStore from "expo-secure-store";
import { addFriend } from '../../../api/friends';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { MissileLibrary } from '../../../components/Missile/missile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getlocActive } from '../../../api/locationOptions';
import { AnimatedEntrance } from '../../../components/ui/AnimatedEntrance';
import { PressableScale } from '../../../components/ui/PressableScale';
import { haptics } from '../../../components/ui/haptics';
import { getPalette, Gradients, Radius, Spacing, cardShadow } from '../../../components/ui/theme';

export interface Notification {
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
		return `${differenceInSeconds}s ago`;
	} else if (differenceInSeconds < 3600) {
		const minutes = Math.floor(differenceInSeconds / 60);
		return `${minutes}m ago`;
	} else if (differenceInSeconds < 86400) {
		const hours = Math.floor(differenceInSeconds / 3600);
		return `${hours}h ago`;
	} else {
		const days = Math.floor(differenceInSeconds / 86400);
		return `${days}d ago`;
	}
};

/** Maps a notification title to an icon + accent colour for its avatar chip. */
type GradientColors = readonly [string, string, ...string[]];

const getNotificationVisual = (title: string): { icon: any; colors: GradientColors } => {
	switch (title) {
		case 'Friend Request':
			return { icon: 'person-add', colors: ['#6D5BF8', '#9B5BF0'] };
		case 'Friend Accepted':
			return { icon: 'people', colors: Gradients.success };
		case 'Friendly Bot':
			return { icon: 'happy', colors: ['#38BDF8', '#0EA5E9'] };
		case 'Incoming Missile!':
		case 'Missile Alert!':
		case 'Missile Impact Alert!':
		case 'Missile Damage!':
			return { icon: 'rocket', colors: Gradients.fire };
		case 'Eliminated!':
			return { icon: 'skull', colors: ['#F5365C', '#B91C1C'] };
		case 'Landmine Nearby!':
		case 'Landmine Damage!':
			return { icon: 'warning', colors: Gradients.gold };
		case 'Loot Nearby!':
		case 'Loot Collected!':
		case 'Loot Within Reach!':
			return { icon: 'gift', colors: ['#F7B733', '#FC4A1A'] };
		case 'Kill Reward':
		case 'Elimination Reward':
			return { icon: 'trophy', colors: Gradients.gold };
		case 'Shield Destroyed!':
			return { icon: 'shield-half', colors: ['#94A3B8', '#475569'] };
		default:
			return { icon: 'notifications', colors: ['#6D5BF8', '#9B5BF0'] };
	}
};

const REWARD_TITLES = ['Missile Alert!', 'Missile Impact Alert!', 'Landmine Nearby!', 'Loot Nearby!', 'Loot Collected!', 'Loot Within Reach!', 'Kill Reward', 'Damaged!', 'Elimination Reward', 'Shield Destroyed!', 'Landmine Damage!', 'Missile Damage!', 'Airspace Alert!'];

const PrimaryBtn = ({ label, icon, colors, onPress }: { label?: string; icon?: any; colors: GradientColors; onPress: () => void }) => (
	<PressableScale haptic="none" onPress={onPress} style={styles.actionBtn}>
		<LinearGradient colors={colors} style={styles.actionBtnFill}>
			{icon && <Ionicons name={icon} size={16} color="#fff" />}
			{label && <Text style={styles.actionBtnText}>{label}</Text>}
		</LinearGradient>
	</PressableScale>
);

const GhostBtn = ({ label, onPress, c }: { label: string; onPress: () => void; c: ReturnType<typeof getPalette> }) => (
	<PressableScale haptic="select" onPress={onPress} style={[styles.ghostBtn, { backgroundColor: c.surfaceAlt }]}>
		<Text style={[styles.ghostBtnText, { color: c.textMuted }]}>{label}</Text>
	</PressableScale>
);

const NotificationsPage: React.FC = () => {
	const { notifications, isLoading, error, fetchNotifications, markAsRead, markAllAsRead, deleteNotificationById } = useNotifications();
	const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
	const router = useRouter();
	const [isAlive, setIsAlive] = useState<boolean>(true);
	const [showMissileLibrary, setShowMissileLibrary] = useState(false);
	const [selectedPlayer, setSelectedPlayer] = useState("");
	const [locActive, setLocActive] = useState<boolean>(true);

	const colorScheme = useColorScheme();
	const isDarkMode = colorScheme === 'dark';
	const c = getPalette(isDarkMode);

	const goBack = useCallback(() => {
		if (router.canGoBack()) {
			router.back();
		} else {
			router.navigate('/friends');
		}
	}, [router]);

	useEffect(() => {
		const initializeApp = async () => {
			try {
				const isAliveStatusString = await AsyncStorage.getItem('isAlive');
				if (isAliveStatusString) {
					const isAliveStatus = JSON.parse(isAliveStatusString);
					setIsAlive(isAliveStatus.isAlive);
				} else {
					setIsAlive(true);
				}
			} catch (error) {
				console.error('Error initializing app:', error);
			}

			try {
				const status = await getlocActive();
				setLocActive(status);
			} catch (error) {
				console.error('Failed to fetch locActive status:', error);
			}
		};
		void initializeApp();
	}, []);

	const handleAccept = useCallback(async (item: Notification) => {
		try {
			const token = await SecureStore.getItemAsync("token");
			if (!token) {
				console.error('No token found');
				return;
			}
			const response = await addFriend(token, item.sentby);
			console.log('Friend request accepted:', response.message);
			haptics.success();
			await deleteNotificationById(item.id);
			setHiddenIds(prev => new Set(prev).add(item.id));
		} catch (error) {
			console.error('Failed to accept friend request:', error);
			haptics.error();
			setHiddenIds(prev => {
				const newSet = new Set(prev);
				newSet.delete(item.id);
				return newSet;
			});
		}
	}, [deleteNotificationById]);

	const handleDecline = useCallback(async (item: Notification) => {
		haptics.select();
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
			haptics.tap();
			setShowMissileLibrary(true);
			setSelectedPlayer(item.sentby);
		} catch (error) {
			console.error('Failed to fire missile:', error);
		}
	}, []);

	const dismissNotification = useCallback(async (item: Notification) => {
		try {
			haptics.select();
			await deleteNotificationById(item.id);
			setHiddenIds(prev => new Set(prev).add(item.id));
		} catch (error) {
			console.error('Failed to dismiss notification:', error);
		}
	}, [deleteNotificationById]);

	// Marking as read is non-destructive, so no confirmation dialog is needed.
	const handleMarkAllRead = useCallback(async () => {
		haptics.select();
		try {
			await markAllAsRead();
		} catch (error) {
			console.error('Failed to mark all notifications as read:', error);
		}
	}, [markAllAsRead]);

	const handleRetry = useCallback(() => {
		fetchNotifications(true);
	}, [fetchNotifications]);

	const renderNotificationItem = useCallback(({ item, index }: { item: Notification; index: number }) => {
		if (hiddenIds.has(item.id) || item.title === 'New Message') return null;

		const visual = getNotificationVisual(item.title);

		return (
			<AnimatedEntrance index={index}>
				<PressableScale
					haptic="select"
					onPress={() => markAsRead(item.id)}
					style={[
						styles.card,
						{ backgroundColor: c.surface },
						cardShadow(isDarkMode),
						!item.isRead && { borderColor: c.accent, borderWidth: 1.5 },
					]}
				>
					<View style={styles.cardTop}>
						<LinearGradient colors={visual.colors} style={styles.iconChip}>
							<Ionicons name={visual.icon} size={22} color="#fff" />
						</LinearGradient>
						<View style={styles.cardText}>
							<View style={styles.titleRow}>
								<Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={1}>
									{item.title}
								</Text>
								{!item.isRead && <View style={[styles.unreadDot, { backgroundColor: c.accent }]} />}
							</View>
							<Text style={[styles.cardBody, { color: c.textMuted }]} numberOfLines={2}>
								{item.body}
							</Text>
							<Text style={[styles.cardTime, { color: c.textFaint }]}>
								{getTimeDifference(item.timestamp)}
							</Text>
						</View>
					</View>

					{item.title === 'Friend Request' && (
						<View style={styles.actions}>
							<PrimaryBtn label="Accept" icon="checkmark" colors={Gradients.success} onPress={() => handleAccept(item)} />
							<GhostBtn label="Decline" onPress={() => handleDecline(item)} c={c} />
						</View>
					)}
					{item.title === 'Friend Accepted' && (
						<View style={styles.actions}>
							<PrimaryBtn label="View Friends" icon="people" colors={Gradients.brand} onPress={() => router.navigate('/friends')} />
						</View>
					)}
					{item.title === 'Friendly Bot' && (
						<View style={styles.actions}>
							<GhostBtn label="👋 Wave" onPress={() => dismissNotification(item)} c={c} />
							<PrimaryBtn label="Fire!" icon="rocket" colors={Gradients.fire} onPress={() => handleFireBack(item)} />
						</View>
					)}
					{['Incoming Missile!', 'Eliminated!'].includes(item.title) && (
						<View style={styles.actions}>
							{isAlive && locActive && (
								<PrimaryBtn label="Fire Back!" icon="rocket" colors={Gradients.fire} onPress={() => handleFireBack(item)} />
							)}
							<GhostBtn label="Dismiss" onPress={() => dismissNotification(item)} c={c} />
						</View>
					)}
					{REWARD_TITLES.includes(item.title) && (
						<View style={styles.actions}>
							<GhostBtn label="Dismiss" onPress={() => dismissNotification(item)} c={c} />
						</View>
					)}
				</PressableScale>
			</AnimatedEntrance>
		);
	}, [hiddenIds, markAsRead, handleAccept, handleDecline, handleFireBack, dismissNotification, isAlive, locActive, isDarkMode, c, router]);

	return (
		<View style={[styles.container, { backgroundColor: c.bg }]}>
			<LinearGradient
				colors={isDarkMode ? ['#241B45', '#15172B'] : Gradients.brand}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				style={styles.header}
			>
				<PressableScale haptic="select" onPress={goBack} style={styles.backBtn}>
					<Ionicons name="chevron-back" size={24} color="#fff" />
				</PressableScale>
				<Text style={styles.headerTitle}>Notifications</Text>
				<PressableScale haptic="select" onPress={handleMarkAllRead} style={styles.clearBtn}>
					<Text style={styles.clearText}>Mark all read</Text>
				</PressableScale>
			</LinearGradient>

			{isLoading ? (
				<View style={styles.centerContainer}>
					<ActivityIndicator size="large" color={c.accent} />
					<Text style={[styles.centerText, { color: c.textMuted, marginTop: Spacing.md }]}>
						Loading notifications...
					</Text>
				</View>
			) : error ? (
				<View style={styles.centerContainer}>
					<View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
						<Ionicons name="cloud-offline" size={36} color="#F5365C" />
					</View>
					<Text style={[styles.centerText, { color: c.text, marginTop: Spacing.lg }]}>{error}</Text>
					<PressableScale haptic="tap" onPress={handleRetry} style={styles.retryBtn}>
						<LinearGradient colors={Gradients.brand} style={styles.retryBtnFill}>
							<Ionicons name="refresh" size={18} color="#fff" />
							<Text style={styles.retryText}>Retry</Text>
						</LinearGradient>
					</PressableScale>
				</View>
			) : (
				<FlatList
					data={notifications}
					renderItem={renderNotificationItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={styles.listContainer}
					showsVerticalScrollIndicator={false}
					refreshing={isLoading}
					onRefresh={() => fetchNotifications(true)}
					ListEmptyComponent={
						<AnimatedEntrance style={styles.centerContainer}>
							<View style={[styles.emptyIcon, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}>
								<Ionicons name="notifications-off" size={36} color={c.accent} />
							</View>
							<Text style={[styles.centerText, { color: c.textMuted, marginTop: Spacing.lg }]}>
								{"You're all caught up"}
							</Text>
						</AnimatedEntrance>
					}
				/>
			)}

			<Modal
				animationType="slide"
				transparent
				visible={showMissileLibrary}
				onRequestClose={() => setShowMissileLibrary(false)}
			>
				<View style={styles.modalOverlay}>
					<View style={[styles.modalSheet, { backgroundColor: c.bg }]}>
						<LinearGradient colors={Gradients.fire} style={styles.modalHeader}>
							<Text style={styles.modalTitle}>Missile Library</Text>
							<PressableScale haptic="select" onPress={() => setShowMissileLibrary(false)} style={styles.doneBtn}>
								<Text style={styles.doneText}>Done</Text>
							</PressableScale>
						</LinearGradient>
						<MissileLibrary
							playerName={selectedPlayer}
							onMissileFired={() => {
								haptics.fire();
								setShowMissileLibrary(false);
							}}
							onClose={() => setShowMissileLibrary(false)}
						/>
					</View>
				</View>
			</Modal>
		</View>
	);
};

const styles = StyleSheet.create({
	container: { flex: 1 },
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingTop: 60,
		paddingHorizontal: Spacing.lg,
		paddingBottom: Spacing.lg,
		borderBottomLeftRadius: Radius.xl,
		borderBottomRightRadius: Radius.xl,
	},
	backBtn: {
		width: 44,
		height: 44,
		borderRadius: 22,
		backgroundColor: 'rgba(255,255,255,0.18)',
		justifyContent: 'center',
		alignItems: 'center',
	},
	headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
	clearBtn: {
		paddingHorizontal: Spacing.md,
		height: 44,
		borderRadius: Radius.pill,
		backgroundColor: 'rgba(255,255,255,0.18)',
		justifyContent: 'center',
	},
	clearText: { color: '#fff', fontWeight: '700', fontSize: 13 },
	listContainer: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.xxl * 2 },
	card: { borderRadius: Radius.lg, padding: Spacing.md },
	cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
	iconChip: {
		width: 46,
		height: 46,
		borderRadius: 23,
		justifyContent: 'center',
		alignItems: 'center',
		marginRight: Spacing.md,
	},
	cardText: { flex: 1 },
	titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
	cardTitle: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
	unreadDot: { width: 8, height: 8, borderRadius: 4 },
	cardBody: { fontSize: 14, marginTop: 3, lineHeight: 19 },
	cardTime: { fontSize: 12, marginTop: 6 },
	actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.md },
	actionBtn: { borderRadius: Radius.pill, overflow: 'hidden' },
	actionBtnFill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
	},
	actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
	ghostBtn: {
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
		borderRadius: Radius.pill,
		justifyContent: 'center',
	},
	ghostBtnText: { fontWeight: '700', fontSize: 14 },
	centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: Spacing.xxl * 3 },
	centerText: { fontSize: 16, textAlign: 'center' },
	emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
	retryBtn: { marginTop: Spacing.lg, borderRadius: Radius.pill, overflow: 'hidden' },
	retryBtnFill: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: Spacing.sm,
		paddingHorizontal: Spacing.xl,
		paddingVertical: Spacing.md,
	},
	retryText: { color: '#fff', fontWeight: '700', fontSize: 16 },
	modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
	modalSheet: {
		height: '90%',
		borderTopLeftRadius: Radius.xl,
		borderTopRightRadius: Radius.xl,
		overflow: 'hidden',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.md,
	},
	modalTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
	doneBtn: {
		backgroundColor: 'rgba(255,255,255,0.25)',
		paddingHorizontal: Spacing.lg,
		paddingVertical: Spacing.sm,
		borderRadius: Radius.pill,
	},
	doneText: { color: '#fff', fontWeight: '700' },
});

export default NotificationsPage;
