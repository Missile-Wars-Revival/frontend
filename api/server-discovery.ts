import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Phase 6 of backend/DISTRIBUTED_HOSTING_PLAN.md: the app no longer bakes in
// a single backend URL. Only the COORDINATOR url is baked into the build; the
// coordinator lists community-hosted game servers ("shards") and the player's
// choice is persisted here. EXPO_PUBLIC_BACKEND_URL / _WEBSOCKET_URL remain as
// fallbacks so existing dev setups and solo/self-hosted servers keep working
// without a coordinator.
//
// Phase 7 adds the explicit post-login flow: server selection is confirmed
// once per app session (the "session confirmation" below gates the websocket),
// the coordinator's /servers response carries the user's server history, and
// POST /auth/select-server is the authoritative way to obtain a shard token
// for the chosen server.

const COORDINATOR_URL = (process.env.EXPO_PUBLIC_COORDINATOR_URL || "").replace(/\/$/, "");

const SELECTED_SERVER_KEY = "selectedServer";
const UNVERIFIED_ACK_KEY_PREFIX = "unverifiedServerAck:";

export interface GameServer {
  id: string;
  name: string;
  description?: string;
  region: string;
  publicHttpUrl: string;
  publicWsUrl: string;
  verified: boolean;
  playerCount: number;
  totalPlayerCount?: number;
  version?: string;
  lastHeartbeatAt?: number;
}

// Coordinator-recorded "where has this account played" entry. The lastServer*
// fields are snapshots taken at the last token mint, so a server that has
// since gone offline (available: false) can still be rendered by name.
export interface ServerHistoryEntry {
  shardId: string;
  firstUsedAt: number;
  lastUsedAt: number;
  useCount: number;
  lastServerName: string;
  lastRegion: string;
  lastVerified: boolean;
  available: boolean;
}

// In-memory mirror of the persisted selection so URL lookups stay synchronous
// (axios interceptor and websocket connect both need them without awaiting).
let selectedServer: GameServer | null = null;
let hydrated = false;

export function coordinatorConfigured(): boolean {
  return COORDINATOR_URL.length > 0;
}

// Called once at startup (before the providers mount) so getBackendUrl() /
// getWsUrl() reflect the persisted choice from the first request onwards.
export async function hydrateSelectedServer(): Promise<GameServer | null> {
  try {
    const raw = await AsyncStorage.getItem(SELECTED_SERVER_KEY);
    selectedServer = raw ? (JSON.parse(raw) as GameServer) : null;
  } catch (error) {
    console.error("Failed to hydrate selected server:", error);
    selectedServer = null;
  }
  hydrated = true;
  return selectedServer;
}

export function isHydrated(): boolean {
  return hydrated;
}

export function getSelectedServer(): GameServer | null {
  return selectedServer;
}

export async function selectServer(server: GameServer): Promise<void> {
  selectedServer = server;
  await AsyncStorage.setItem(SELECTED_SERVER_KEY, JSON.stringify(server));
}

export async function clearSelectedServer(): Promise<void> {
  selectedServer = null;
  await AsyncStorage.removeItem(SELECTED_SERVER_KEY);
}

// REST base for the current shard. Selection wins; env vars keep legacy and
// solo-hosting setups working; localhost matches the old default.
export function getBackendUrl(): string {
  if (selectedServer?.publicHttpUrl) return selectedServer.publicHttpUrl.replace(/\/$/, "");
  return (process.env.EXPO_PUBLIC_BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function getWsUrl(): string {
  if (selectedServer?.publicWsUrl) return selectedServer.publicWsUrl.replace(/\/$/, "");
  if (process.env.EXPO_PUBLIC_WEBSOCKET_URL) {
    return process.env.EXPO_PUBLIC_WEBSOCKET_URL.replace(/\/$/, "");
  }
  // Derive from the http url as a last resort (http -> ws, https -> wss).
  return getBackendUrl().replace(/^http/, "ws");
}

// ---------------------------------------------------------------------------
// Phase 7 session confirmation: in distributed mode the websocket must not
// connect until the player has confirmed which server to play on this app
// session (fresh login OR cold start with an existing session). Module state,
// not persisted — a cold start always re-asks; a background-resume within the
// same JS session does not.

let sessionConfirmed = false;
const sessionListeners = new Set<() => void>();

export function isServerSessionConfirmed(): boolean {
  // Without a coordinator there is no selector — the legacy direct-URL flow
  // is always "confirmed" so solo hosting and dev setups are untouched.
  if (!coordinatorConfigured()) return true;
  return sessionConfirmed;
}

export function confirmServerSession(): void {
  sessionConfirmed = true;
  sessionListeners.forEach((listener) => listener());
}

// Called on sign-out so the next account doesn't inherit the confirmation.
export function resetServerSession(): void {
  sessionConfirmed = false;
  sessionListeners.forEach((listener) => listener());
}

export function subscribeServerSession(listener: () => void): () => void {
  sessionListeners.add(listener);
  return () => sessionListeners.delete(listener);
}

// ---------------------------------------------------------------------------

export async function fetchServers(): Promise<GameServer[]> {
  if (!coordinatorConfigured()) return [];
  const { data } = await axios.get(`${COORDINATOR_URL}/servers`, { timeout: 10000 });
  return (data?.data?.servers ?? []) as GameServer[];
}

// Same directory call, but authenticated: the coordinator then includes this
// account's server history so the selector can show a "recent servers" /
// continue section. An invalid/expired idToken degrades to an empty history.
export async function fetchServersWithHistory(
  idToken?: string | null
): Promise<{ servers: GameServer[]; history: ServerHistoryEntry[] }> {
  if (!coordinatorConfigured()) return { servers: [], history: [] };
  const { data } = await axios.get(`${COORDINATOR_URL}/servers`, {
    timeout: 10000,
    headers: idToken ? { Authorization: `Bearer ${idToken}` } : undefined,
  });
  return {
    servers: (data?.data?.servers ?? []) as GameServer[],
    history: (data?.data?.history ?? []) as ServerHistoryEntry[],
  };
}

// The authoritative Phase 7 selection path: the coordinator verifies the
// Firebase ID token, confirms the shard is listable, mints the shard-scoped
// session token, and records server history. On success the new token is the
// active session token and the selection is persisted.
export async function selectServerViaCoordinator(server: GameServer, idToken: string): Promise<void> {
  const { data } = await axios.post(
    `${COORDINATOR_URL}/auth/select-server`,
    { serverId: server.id },
    { headers: { Authorization: `Bearer ${idToken}` }, timeout: 15000 }
  );
  const token = data?.data?.token as string | undefined;
  if (!token) throw new Error("Coordinator returned no token");
  await SecureStore.setItemAsync("token", token);
  // Phase 8: login is by email, so the coordinator's record of the game
  // username (read from /profiles at mint time) is the authoritative one.
  const username = data?.data?.username as string | undefined;
  if (username) await SecureStore.setItemAsync("username", username);
  // Prefer the coordinator's own record of the server (fresh URLs/verified
  // flag) over the possibly stale list entry the user tapped.
  const fresh = data?.data?.server as Partial<GameServer> | undefined;
  await selectServer({ ...server, ...fresh });
}

// Coordinator picks the nearest (or least-loaded) shard. Coordinates are
// optional — without them it falls back to verified-first + lowest load.
export async function fetchBestServer(lat?: number, lon?: number): Promise<GameServer | null> {
  if (!coordinatorConfigured()) return null;
  try {
    const params = lat !== undefined && lon !== undefined ? { lat, lon } : {};
    const { data } = await axios.get(`${COORDINATOR_URL}/servers/best`, { params, timeout: 10000 });
    return (data?.data?.server ?? null) as GameServer | null;
  } catch {
    // 404 NO_SERVERS or network trouble — caller decides what to show.
    return null;
  }
}

// Unverified-server acknowledgment: the blocking warning modal records the
// player's explicit accept per server id, so they aren't re-warned every
// launch but ARE re-warned if they switch to a different unverified shard.
export async function hasAcknowledgedUnverified(serverId: string): Promise<boolean> {
  return (await AsyncStorage.getItem(`${UNVERIFIED_ACK_KEY_PREFIX}${serverId}`)) === "true";
}

export async function acknowledgeUnverified(serverId: string): Promise<void> {
  await AsyncStorage.setItem(`${UNVERIFIED_ACK_KEY_PREFIX}${serverId}`, "true");
}
