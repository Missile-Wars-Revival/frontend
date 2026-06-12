import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Phase 6 of backend/DISTRIBUTED_HOSTING_PLAN.md: the app no longer bakes in
// a single backend URL. Only the COORDINATOR url is baked into the build; the
// coordinator lists community-hosted game servers ("shards") and the player's
// choice is persisted here. EXPO_PUBLIC_BACKEND_URL / _WEBSOCKET_URL remain as
// fallbacks so existing dev setups and solo/self-hosted servers keep working
// without a coordinator.

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
  version?: string;
  lastHeartbeatAt?: number;
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

export async function fetchServers(): Promise<GameServer[]> {
  if (!coordinatorConfigured()) return [];
  const { data } = await axios.get(`${COORDINATOR_URL}/servers`, { timeout: 10000 });
  return (data?.data?.servers ?? []) as GameServer[];
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
