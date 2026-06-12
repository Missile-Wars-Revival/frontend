import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Pressable, StyleSheet, Text, View, useColorScheme,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GameServer,
  acknowledgeUnverified,
  coordinatorConfigured,
  fetchBestServer,
  fetchServers,
  getSelectedServer,
  hasAcknowledgedUnverified,
  selectServer,
} from '../api/server-discovery';

// Phase 6 server picker (backend/DISTRIBUTED_HOSTING_PLAN.md): lists the
// community servers the coordinator knows about, auto-picks the nearest
// VERIFIED one when nothing is selected yet, and gates unverified servers
// behind a blocking acknowledgment — the host of an unverified server can see
// the live locations and traffic of players connected to it.
//
// Renders nothing when no coordinator is baked into the build
// (EXPO_PUBLIC_COORDINATOR_URL unset) so legacy/env-URL setups are untouched.

interface ServerPickerProps {
  onSelected?: (server: GameServer) => void;
}

async function lastKnownCoords(): Promise<{ lat: number; lon: number } | null> {
  try {
    const raw = await AsyncStorage.getItem('regionlocation');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const lat = Number(parsed?.latitude);
    const lon = Number(parsed?.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
  } catch {
    return null;
  }
}

export default function ServerPicker({ onSelected }: ServerPickerProps) {
  const isDark = useColorScheme() === 'dark';
  const c = palette(isDark);

  const [selected, setSelected] = useState<GameServer | null>(getSelectedServer());
  const [listVisible, setListVisible] = useState(false);
  const [servers, setServers] = useState<GameServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [pendingUnverified, setPendingUnverified] = useState<GameServer | null>(null);

  const applySelection = useCallback(async (server: GameServer) => {
    await selectServer(server);
    setSelected(server);
    setListVisible(false);
    setPendingUnverified(null);
    onSelected?.(server);
  }, [onSelected]);

  // First launch: nothing persisted yet — ask the coordinator for the nearest
  // server and take it silently only if it's verified. Unverified picks must
  // always go through the explicit warning below.
  useEffect(() => {
    if (!coordinatorConfigured() || getSelectedServer()) return;
    (async () => {
      const coords = await lastKnownCoords();
      const best = await fetchBestServer(coords?.lat, coords?.lon);
      if (best?.verified && !getSelectedServer()) {
        await selectServer(best);
        setSelected(best);
        onSelected?.(best);
      }
    })();
  }, [onSelected]);

  const openList = useCallback(async () => {
    setListVisible(true);
    setLoading(true);
    setLoadError('');
    try {
      setServers(await fetchServers());
    } catch {
      setLoadError('Could not reach the server directory. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onPickServer = useCallback(async (server: GameServer) => {
    if (!server.verified && !(await hasAcknowledgedUnverified(server.id))) {
      setPendingUnverified(server);
      return;
    }
    await applySelection(server);
  }, [applySelection]);

  if (!coordinatorConfigured()) return null;

  return (
    <View>
      {/* Current selection row — the entry point shown on the login screen. */}
      <Pressable
        onPress={openList}
        style={[styles.row, { backgroundColor: c.card, borderColor: c.border }]}
        accessibilityRole="button"
        accessibilityLabel="Choose game server"
      >
        <Text style={[styles.rowLabel, { color: c.subtle }]}>Server</Text>
        <View style={styles.rowMain}>
          <Text style={[styles.rowName, { color: c.text }]} numberOfLines={1}>
            {selected ? selected.name : 'Select a server…'}
          </Text>
          {selected?.verified ? <VerifiedBadge /> : selected ? <UnverifiedTag /> : null}
        </View>
        <Text style={[styles.chevron, { color: c.subtle }]}>›</Text>
      </Pressable>

      {/* Server list */}
      <Modal visible={listVisible} animationType="slide" transparent onRequestClose={() => setListVisible(false)}>
        <View style={styles.backdrop}>
          <View style={[styles.sheet, { backgroundColor: c.bg }]}>
            <Text style={[styles.title, { color: c.text }]}>Choose a server</Text>
            <Text style={[styles.subtitle, { color: c.subtle }]}>
              Community-hosted servers. Your account and friends work on any of them.
            </Text>

            {loading ? (
              <ActivityIndicator style={styles.spinner} />
            ) : loadError ? (
              <Text style={[styles.error, { color: '#f55' }]}>{loadError}</Text>
            ) : servers.length === 0 ? (
              <Text style={[styles.error, { color: c.subtle }]}>No servers are online right now.</Text>
            ) : (
              <FlatList
                data={servers}
                keyExtractor={(s) => s.id}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => onPickServer(item)}
                    style={[styles.serverRow, { borderColor: c.border }, item.id === selected?.id && { backgroundColor: c.card }]}
                  >
                    <View style={styles.serverHead}>
                      <Text style={[styles.serverName, { color: c.text }]} numberOfLines={1}>{item.name}</Text>
                      {item.verified ? <VerifiedBadge /> : <UnverifiedTag />}
                    </View>
                    <Text style={[styles.serverMeta, { color: c.subtle }]}>
                      {item.region} · {item.playerCount} online{item.version ? ` · v${item.version}` : ''}
                    </Text>
                    {item.description ? (
                      <Text style={[styles.serverMeta, { color: c.subtle }]} numberOfLines={2}>{item.description}</Text>
                    ) : null}
                  </Pressable>
                )}
              />
            )}

            <Pressable onPress={() => setListVisible(false)} style={[styles.button, { backgroundColor: c.card }]}>
              <Text style={[styles.buttonText, { color: c.text }]}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Blocking unverified-server acknowledgment */}
      <UnverifiedWarningModal
        server={pendingUnverified}
        onConfirm={async () => {
          if (!pendingUnverified) return;
          await acknowledgeUnverified(pendingUnverified.id);
          await applySelection(pendingUnverified);
        }}
        onCancel={() => setPendingUnverified(null)}
      />
    </View>
  );
}

// Shared with the Phase 7 post-login server selector — one copy of the
// warning wording, one set of badge visuals.
export function UnverifiedWarningModal({
  server,
  onConfirm,
  onCancel,
}: {
  server: GameServer | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const c = palette(useColorScheme() === 'dark');
  return (
    <Modal visible={!!server} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.warnCard, { backgroundColor: c.bg }]}>
          <Text style={[styles.warnTitle, { color: c.text }]}>Unverified server</Text>
          <Text style={[styles.warnBody, { color: c.text }]}>
            “{server?.name}” is run by a community member and has NOT been verified
            by the Missile Wars team.
          </Text>
          <Text style={[styles.warnBody, { color: c.text }]}>
            Whoever operates this server can see data you send while playing on it — including
            your <Text style={styles.warnEmph}>live location</Text>, username, and in-game
            activity. Your password and payment details are never shared with game servers.
          </Text>
          <Text style={[styles.warnBody, { color: c.subtle }]}>
            Only continue if you trust whoever runs this server.
          </Text>
          <Pressable onPress={onConfirm} style={[styles.button, styles.warnAccept]}>
            <Text style={[styles.buttonText, { color: '#fff' }]}>I understand the risk — connect</Text>
          </Pressable>
          <Pressable onPress={onCancel} style={[styles.button, { backgroundColor: c.card }]}>
            <Text style={[styles.buttonText, { color: c.text }]}>Go back</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function VerifiedBadge() {
  return (
    <View style={[styles.badge, styles.badgeVerified]}>
      <Text style={styles.badgeText}>✓ Verified</Text>
    </View>
  );
}

export function UnverifiedTag() {
  return (
    <View style={[styles.badge, styles.badgeUnverified]}>
      <Text style={styles.badgeText}>Unverified</Text>
    </View>
  );
}

export function palette(isDark: boolean) {
  return {
    bg: isDark ? '#16181d' : '#ffffff',
    card: isDark ? '#23262e' : '#f1f1f4',
    border: isDark ? '#33363f' : '#dddde2',
    text: isDark ? '#f2f2f5' : '#17171b',
    subtle: isDark ? '#9aa0ab' : '#6a6a72',
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  rowLabel: { fontSize: 13, fontWeight: '600' },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  chevron: { fontSize: 22, fontWeight: '300' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, marginBottom: 12 },
  spinner: { marginVertical: 32 },
  error: { fontSize: 14, marginVertical: 24, textAlign: 'center' },
  list: { flexGrow: 0 },
  serverRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  serverHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  serverName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  serverMeta: { fontSize: 12, marginTop: 3 },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeVerified: { backgroundColor: '#1f7a36' },
  badgeUnverified: { backgroundColor: '#9a6b00' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  button: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 10 },
  buttonText: { fontSize: 15, fontWeight: '600' },
  warnCard: { margin: 24, borderRadius: 16, padding: 20, alignSelf: 'center', maxWidth: 420 },
  warnTitle: { fontSize: 19, fontWeight: '700', marginBottom: 10 },
  warnBody: { fontSize: 14, lineHeight: 20, marginBottom: 10 },
  warnEmph: { fontWeight: '700' },
  warnAccept: { backgroundColor: '#b3261e' },
});
