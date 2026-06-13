import React, { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@react-native-vector-icons/ionicons';
import { router } from 'expo-router';
import useFetchFriends from '../hooks/websockets/friendshook';
import useFetchPlayerlocations from '../hooks/websockets/playerlochook';
import { getTimeDifference } from '../util/get-time-difference';
import { addFriend } from '../api/friends';
import { getSecureItemSafely } from '../util/secure-store';
import { getPalette, Gradients, Radius, Spacing, Type, cardShadow } from './ui/theme';
import { PressableScale } from './ui/PressableScale';
import { Avatar } from './ui/Avatar';
import { haptics } from './ui/haptics';

// Marker taps happen inside MapView, but react-native-maps never presents
// modals mounted under it, so player markers report up to MapComp which emits
// through this event bus; PlayerDetailsHost — a sibling of the MapView — owns
// the actual modal. Mirrors missile-details.tsx.

export type PlayerDetails = {
  username: string;
  profileImageUrl?: string | null;
  updatedAt: string;
  health: number;
  transportStatus: string;
  randomlocation: boolean;
  locationPrecision?: "precise" | "diffused";
};

type Listener = (details: PlayerDetails) => void;
const listeners = new Set<Listener>();

export function showPlayerDetails(details: PlayerDetails) {
  listeners.forEach((listener) => listener(details));
}

const TRANSPORT_INFO: Record<string, { label: string; icon: string }> = {
  walking: { label: 'On foot', icon: 'walk' },
  bicycle: { label: 'Cycling', icon: 'bicycle' },
  car: { label: 'Driving', icon: 'car' },
  highspeed: { label: 'High-speed rail', icon: 'train' },
  plane: { label: 'Flying', icon: 'airplane' },
  boat: { label: 'On a boat', icon: 'boat' },
  ship: { label: 'On a ship', icon: 'boat' },
};
const DEFAULT_TRANSPORT_INFO = { label: 'On foot', icon: 'walk' };

const getHealthBarColor = (health: number) => {
  const red = Math.round((255 * (100 - health)) / 100);
  const green = Math.round((128 * health) / 100);
  return `rgb(${red}, ${green}, 0)`;
};

export function PlayerDetailsHost({ onFireMissile }: { onFireMissile?: (username: string) => void }) {
  const [details, setDetails] = useState<PlayerDetails | null>(null);
  const [visible, setVisible] = useState(false);
  const friends = useFetchFriends();
  const livePlayers = useFetchPlayerlocations();

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const c = getPalette(isDarkMode);

  useEffect(() => {
    const listener: Listener = (incoming) => {
      setDetails(incoming);
      setVisible(true);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // Re-render every second while open so "last seen" stays live instead of
  // freezing at the moment the marker was tapped.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const intervalId = setInterval(() => setTick((tick) => tick + 1), 1000);
    return () => clearInterval(intervalId);
  }, [visible]);

  if (!details) {
    return null;
  }

  // Prefer the live websocket copy so health/transport track the player
  // while the modal is open.
  const live = livePlayers.find((p) => p.username === details.username);
  const player: PlayerDetails = live ? { ...details, ...live } : details;

  const isFriend = friends.some((friend) => friend.username === player.username);
  const lastSeen = getTimeDifference(player.updatedAt).text;
  const transport = TRANSPORT_INFO[player.transportStatus] ?? DEFAULT_TRANSPORT_INFO;
  const health = Math.max(0, Math.min(100, player.health));

  const close = () => setVisible(false);

  const handleEngage = () => {
    const username = player.username;
    close();
    onFireMissile?.(username);
  };

  const handleRecruit = async () => {
    const token = await getSecureItemSafely('token');
    if (!token) return;
    try {
      const result = await addFriend(token, player.username);
      if (result.message === 'Friend added successfully') {
        haptics.success();
        Alert.alert('Success', `${player.username} has been recruited!`);
      } else {
        Alert.alert('Error', result.message || 'Failed to add friend.');
      }
    } catch (error) {
      console.warn('Error adding friend:', error);
      Alert.alert('This player is already your friend!');
    }
  };

  const handleViewProfile = () => {
    const username = player.username;
    close();
    router.navigate({ pathname: '/profile/user-profile', params: { username } });
  };

  const renderStatRow = (label: string, value: string, icon?: string) => (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
      <View style={styles.statValueRow}>
        {icon ? <Ionicons name={icon as any} size={14} color={c.text} /> : null}
        <Text style={[styles.statValue, { color: c.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      statusBarTranslucent
      visible={visible}
      onRequestClose={close}
    >
      <Pressable style={[styles.modalOverlay, { backgroundColor: c.overlay }]} onPress={close}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.modalCard, { backgroundColor: c.surface }, cardShadow(isDarkMode)]}
        >
          <View style={styles.modalHeader}>
            <Avatar uri={player.profileImageUrl} style={styles.avatar} />
            <View style={styles.modalTitleContainer}>
              <PressableScale haptic="select" onPress={handleViewProfile} style={{ alignSelf: 'flex-start' }}>
                <Text style={[styles.modalTitle, { color: c.text }]} numberOfLines={1}>
                  {player.username}
                </Text>
              </PressableScale>
              <View
                style={[
                  styles.statusChip,
                  { backgroundColor: isFriend ? c.successSoft : c.warningSoft },
                ]}
              >
                <Text style={[styles.statusChipText, { color: isFriend ? c.success : c.warning }]}>
                  {isFriend ? 'ALLY' : 'UNKNOWN'}
                </Text>
              </View>
            </View>
            <Pressable
              style={[styles.closeButton, { backgroundColor: c.surfaceAlt }]}
              onPress={close}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color={c.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.statsContainer, { backgroundColor: c.surfaceAlt }]}>
            {renderStatRow('Last active', lastSeen.replace('Last seen: ', ''))}
            {renderStatRow('Transport', transport.label, transport.icon)}
            {(() => {
              // Phase 11A: trust the server's precision flag; fall back to
              // randomlocation for old servers that do not send the flag.
              const approximate = player.locationPrecision
                ? player.locationPrecision === 'diffused'
                : player.randomlocation;
              return renderStatRow(
                'Location',
                approximate ? 'Approximate' : 'Precise',
                approximate ? 'help-circle-outline' : 'locate-outline'
              );
            })()}
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: c.textMuted }]}>Health</Text>
              <View style={styles.healthValue}>
                <View style={[styles.healthBarTrack, { backgroundColor: c.border }]}>
                  <View
                    style={[
                      styles.healthBarFill,
                      { width: `${health}%`, backgroundColor: getHealthBarColor(health) },
                    ]}
                  />
                </View>
                <Text style={[styles.statValue, { color: c.text }]}>{health}</Text>
              </View>
            </View>
          </View>

          <PressableScale haptic="tap" onPress={handleEngage}>
            <LinearGradient
              colors={Gradients.fire}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.engageButton}
            >
              <Ionicons name="rocket" size={16} color="#FFFFFF" />
              <Text style={styles.engageButtonText}>Engage</Text>
            </LinearGradient>
          </PressableScale>

          {!isFriend && (
            <View style={styles.secondaryRow}>
              <PressableScale haptic="tap" style={styles.secondaryFlex} onPress={handleRecruit}>
                <LinearGradient
                  colors={Gradients.success}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.secondaryButton}
                >
                  <Ionicons name="person-add" size={14} color="#FFFFFF" />
                  <Text style={styles.secondaryButtonText}>Recruit</Text>
                </LinearGradient>
              </PressableScale>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  modalTitleContainer: {
    flex: 1,
    gap: Spacing.xs,
  },
  modalTitle: {
    ...Type.title,
  },
  statusChip: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  statusChipText: {
    ...Type.micro,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  statsContainer: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statLabel: {
    ...Type.caption,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  statValue: {
    ...Type.body,
    flexShrink: 1,
    textAlign: 'right',
  },
  healthValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    justifyContent: 'flex-end',
  },
  healthBarTrack: {
    width: 90,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  engageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  engageButtonText: {
    ...Type.button,
    color: '#FFFFFF',
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  secondaryFlex: {
    flex: 1,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
  },
  profileButton: {
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...Type.caption,
    color: '#FFFFFF',
  },
});
