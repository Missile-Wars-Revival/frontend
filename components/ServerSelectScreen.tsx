import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ConnectingScreen } from './ConnectingScreen';
import { UnverifiedTag, UnverifiedWarningModal, VerifiedBadge, palette, playerCountLabel } from './ServerPicker';
import { useWebSocketContext } from '../util/Context/websocket';
import { waitForFirebaseUser } from '../api/account';
import {
  GameServer,
  ServerHistoryEntry,
  acknowledgeUnverified,
  confirmServerSession,
  fetchServersWithHistory,
  getSelectedServer,
  hasAcknowledgedUnverified,
  selectServer,
  selectServerViaCoordinator,
} from '../api/server-discovery';

// Phase 7 (backend/DISTRIBUTED_HOSTING_PLAN.md): the full-screen "where do you
// want to play" step shown after authentication and on every cold start with
// an existing session, before the websocket is allowed to connect. Shows the
// account's recent servers (coordinator-recorded history) with a quick
// Continue action, plus the full directory. Selecting a server mints the
// shard token through POST /auth/select-server, then this screen holds the
// ConnectingScreen until the first gameplay payload lands (or a timeout),
// so the map/death UI never flashes mid-connect.

const FIRST_DATA_TIMEOUT_MS = 15000;
const MAX_RECENT_ROWS = 5;

function lastPlayedLabel(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'Last played today';
  if (days === 1) return 'Last played yesterday';
  if (days < 30) return `Last played ${days} days ago`;
  return 'Last played a while ago';
}

interface ServerSelectScreenProps {
  onDone: () => void;
}

export default function ServerSelectScreen({ onDone }: ServerSelectScreenProps) {
  const isDark = useColorScheme() === 'dark';
  const c = palette(isDark);
  const { healthdata } = useWebSocketContext();

  const [servers, setServers] = useState<GameServer[]>([]);
  const [history, setHistory] = useState<ServerHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [connectError, setConnectError] = useState('');
  const [pendingUnverified, setPendingUnverified] = useState<GameServer | null>(null);
  const [connecting, setConnecting] = useState(false);
  // Set once the shard token is minted and the websocket may connect; from
  // then on we only wait for the first gameplay payload (or the timeout).
  const [awaitingFirstData, setAwaitingFirstData] = useState(false);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  // Awaits before any setState, so the state updates are asynchronous and
  // safe to trigger from the mount effect (loading/loadError already start in
  // their "fetching" values).
  const fetchDirectory = useCallback(async () => {
    try {
      const user = await waitForFirebaseUser();
      const idToken = user ? await user.getIdToken() : null;
      const result = await fetchServersWithHistory(idToken);
      setServers(result.servers);
      setHistory(result.history);
      setLoadError('');
    } catch {
      setLoadError('Could not reach the server directory. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDirectory = useCallback(() => {
    setLoading(true);
    setLoadError('');
    fetchDirectory();
  }, [fetchDirectory]);

  useEffect(() => {
    // fetchDirectory awaits the Firebase session and the network before any
    // setState, so the updates are async (no synchronous cascading render) —
    // same pattern as OnboardingGate in app/_layout.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDirectory();
  }, [fetchDirectory]);

  // First gameplay payload after the mint — reveal the app.
  useEffect(() => {
    if (awaitingFirstData && healthdata !== null && healthdata !== undefined) {
      finish();
    }
  }, [awaitingFirstData, healthdata, finish]);

  // Safety valve: a slow/failing shard must not trap the player here. The map
  // tab shows its own connecting state while the socket keeps retrying.
  useEffect(() => {
    if (!awaitingFirstData) return;
    const timer = setTimeout(finish, FIRST_DATA_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [awaitingFirstData, finish]);

  const liveById = useMemo(() => new Map(servers.map((s) => [s.id, s])), [servers]);

  const allRecentRows = useMemo(
    () =>
      history.map((entry) => ({
        entry,
        live: liveById.get(entry.shardId) ?? null,
      })),
    [history, liveById]
  );

  // Quick continue targets the most recent still-listable VERIFIED server;
  // unverified servers are never suggested, only picked explicitly below.
  const continueTarget = useMemo(
    () => allRecentRows.find((row) => row.live?.verified)?.live ?? null,
    [allRecentRows]
  );

  // Each server appears in exactly one section: the Continue card swallows
  // its own history row, "Recent" holds the rest of the history, and the
  // directory section lists only what hasn't been shown yet — a lone server
  // shows once, not three times.
  const recentRows = useMemo(
    () =>
      allRecentRows
        .filter((row) => row.entry.shardId !== continueTarget?.id)
        .slice(0, MAX_RECENT_ROWS),
    [allRecentRows, continueTarget]
  );

  const otherServers = useMemo(() => {
    const shown = new Set<string>(
      [continueTarget?.id, ...recentRows.map((row) => row.live?.id)].filter(
        (id): id is string => !!id
      )
    );
    return servers.filter((server) => !shown.has(server.id));
  }, [servers, continueTarget, recentRows]);

  const connectTo = useCallback(
    async (server: GameServer) => {
      setConnecting(true);
      setConnectError('');
      try {
        const user = await waitForFirebaseUser();
        if (!user) throw new Error('No Firebase session');
        await selectServerViaCoordinator(server, await user.getIdToken());
        confirmServerSession();
        setAwaitingFirstData(true);
      } catch {
        // Coordinator unreachable (or no Firebase session): the shard token
        // from login still works on the server it was minted for, so let the
        // player continue there rather than locking them out.
        const current = getSelectedServer();
        const existingToken = await SecureStore.getItemAsync('token').catch(() => null);
        if (current?.id === server.id && existingToken) {
          await selectServer(server).catch(() => {});
          confirmServerSession();
          setAwaitingFirstData(true);
          return;
        }
        setConnecting(false);
        setConnectError(`Could not connect to “${server.name}”. Check your connection and try again.`);
      }
    },
    []
  );

  const onPick = useCallback(
    async (server: GameServer) => {
      if (!server.verified && !(await hasAcknowledgedUnverified(server.id))) {
        setPendingUnverified(server);
        return;
      }
      await connectTo(server);
    },
    [connectTo]
  );

  if (connecting) {
    return <ConnectingScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: c.text }]}>Choose your server</Text>
        <Text style={[styles.subtitle, { color: c.subtle }]}>
          Your account, friends and chat work on every server. Inventory and in-game progress
          belong to the world of each server. Unverified server operators can see your live
          location while you play there, but personal account details stay in the central database.
        </Text>

        {!!connectError && <Text style={styles.error}>{connectError}</Text>}

        {loading ? (
          <ActivityIndicator style={styles.spinner} />
        ) : loadError ? (
          <View>
            <Text style={[styles.error]}>{loadError}</Text>
            <Pressable onPress={loadDirectory} style={[styles.button, { backgroundColor: c.card }]}>
              <Text style={[styles.buttonText, { color: c.text }]}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {continueTarget && (
              <View style={[styles.continueCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.serverHead}>
                  <Text style={[styles.serverName, { color: c.text }]} numberOfLines={1}>
                    {continueTarget.name}
                  </Text>
                  <VerifiedBadge />
                </View>
                <Text style={[styles.serverMeta, { color: c.subtle }]}>
                  {continueTarget.region} · {playerCountLabel(continueTarget)}
                  {(() => {
                    const lastUsedAt = allRecentRows.find(
                      (row) => row.live?.id === continueTarget.id
                    )?.entry.lastUsedAt;
                    return lastUsedAt ? ` · ${lastPlayedLabel(lastUsedAt)}` : '';
                  })()}
                </Text>
                <Pressable onPress={() => onPick(continueTarget)} style={[styles.button, styles.continueButton]}>
                  <Text style={[styles.buttonText, { color: '#fff' }]}>Continue</Text>
                </Pressable>
              </View>
            )}

            {recentRows.length > 0 && (
              <>
                <Text style={[styles.sectionHeader, { color: c.subtle }]}>Recent servers</Text>
                {recentRows.map(({ entry, live }) =>
                  live ? (
                    <Pressable
                      key={entry.shardId}
                      onPress={() => onPick(live)}
                      style={[styles.serverRow, { borderColor: c.border }]}
                    >
                      <View style={styles.serverHead}>
                        <Text style={[styles.serverName, { color: c.text }]} numberOfLines={1}>{live.name}</Text>
                        {live.verified ? <VerifiedBadge /> : <UnverifiedTag />}
                      </View>
                      <Text style={[styles.serverMeta, { color: c.subtle }]}>
                        {live.region} · {playerCountLabel(live)} · {lastPlayedLabel(entry.lastUsedAt)}
                      </Text>
                    </Pressable>
                  ) : (
                    // Known from history but not currently listable — shown for
                    // continuity, never connectable (select-server refuses too).
                    <View key={entry.shardId} style={[styles.serverRow, styles.unavailableRow, { borderColor: c.border }]}>
                      <View style={styles.serverHead}>
                        <Text style={[styles.serverName, { color: c.subtle }]} numberOfLines={1}>
                          {entry.lastServerName}
                        </Text>
                        <View style={styles.offlineBadge}>
                          <Text style={styles.offlineBadgeText}>Unavailable</Text>
                        </View>
                      </View>
                      <Text style={[styles.serverMeta, { color: c.subtle }]}>
                        {entry.lastRegion} · {lastPlayedLabel(entry.lastUsedAt)}
                      </Text>
                    </View>
                  )
                )}
              </>
            )}

            {servers.length === 0 ? (
              <Text style={[styles.error, { color: c.subtle }]}>No servers are online right now.</Text>
            ) : otherServers.length > 0 ? (
              <>
                <Text style={[styles.sectionHeader, { color: c.subtle }]}>
                  {continueTarget || recentRows.length > 0 ? 'Other servers' : 'All servers'}
                </Text>
                {otherServers.map((server) => (
                  <Pressable
                    key={server.id}
                    onPress={() => onPick(server)}
                    style={[styles.serverRow, { borderColor: c.border }]}
                  >
                    <View style={styles.serverHead}>
                      <Text style={[styles.serverName, { color: c.text }]} numberOfLines={1}>{server.name}</Text>
                      {server.verified ? <VerifiedBadge /> : <UnverifiedTag />}
                    </View>
                    <Text style={[styles.serverMeta, { color: c.subtle }]}>
                      {server.region} · {playerCountLabel(server)}{server.version ? ` · v${server.version}` : ''}
                    </Text>
                    {server.description ? (
                      <Text style={[styles.serverMeta, { color: c.subtle }]} numberOfLines={2}>
                        {server.description}
                      </Text>
                    ) : null}
                  </Pressable>
                ))}
              </>
            ) : null}

            <Pressable onPress={loadDirectory} style={[styles.button, { backgroundColor: c.card }]}>
              <Text style={[styles.buttonText, { color: c.text }]}>Refresh</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <UnverifiedWarningModal
        server={pendingUnverified}
        onConfirm={async () => {
          const server = pendingUnverified;
          if (!server) return;
          await acknowledgeUnverified(server.id);
          setPendingUnverified(null);
          await connectTo(server);
        }}
        onCancel={() => setPendingUnverified(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 8 },
  subtitle: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  spinner: { marginVertical: 48 },
  error: { color: '#e74c3c', fontSize: 14, marginVertical: 12, textAlign: 'center' },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 18,
    marginBottom: 8,
  },
  continueCard: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 6 },
  continueButton: { backgroundColor: '#1f7a36' },
  serverRow: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8 },
  unavailableRow: { opacity: 0.55 },
  serverHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  serverName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  serverMeta: { fontSize: 12, marginTop: 3 },
  offlineBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, backgroundColor: '#555' },
  offlineBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  button: { borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  buttonText: { fontSize: 15, fontWeight: '600' },
});
