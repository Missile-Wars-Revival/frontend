import { getDatabase, ref, get, query, orderByChild, equalTo, limitToFirst } from "firebase/database";

// Phase 10 (backend/DISTRIBUTED_HOSTING_PLAN.md): identity badges (staff /
// early access / founder / debug) are account-level and live in central
// Firebase at /profiles/<uid>/identityBadges/<Badge> = true, so they follow the
// player across shards. League badges stay per-shard in the gameplay
// Statistics. Clients READ these directly (writes are admin-SDK-only, set via
// the coordinator admin portal). Kept in sync with the coordinator's
// KNOWN_IDENTITY_BADGES.
export const IDENTITY_BADGES = ["Founder", "Staff", "Early", "Debug"] as const;

// True when a (legacy shard-stat) badge name is really an identity badge, so
// the profile screen can strip it from the gameplay-badge list and show the
// central copy instead — substring match mirrors the renderBadge logic.
export function isIdentityBadge(badge: string): boolean {
  const lower = badge.toLowerCase();
  return IDENTITY_BADGES.some((b) => lower.includes(b.toLowerCase()));
}

function badgesFromSet(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([, granted]) => granted === true)
    .map(([badge]) => badge);
}

// Own profile: the caller has its firebaseUID in SecureStore.
export async function getIdentityBadges(uid: string): Promise<string[]> {
  try {
    const snap = await get(ref(getDatabase(), `profiles/${uid}/identityBadges`));
    return snap.exists() ? badgesFromSet(snap.val()) : [];
  } catch (error) {
    console.error("Failed to read identity badges:", error);
    return [];
  }
}

// Other players: resolve uid from the username-indexed /profiles tree, then
// read their badge set. Non-fatal — a missing profile just yields no badges.
export async function getIdentityBadgesByUsername(username: string): Promise<string[]> {
  try {
    const snap = await get(
      query(ref(getDatabase(), "profiles"), orderByChild("username"), equalTo(username), limitToFirst(1))
    );
    if (!snap.exists()) return [];
    const profile = Object.values(snap.val() as Record<string, { identityBadges?: unknown }>)[0];
    return badgesFromSet(profile?.identityBadges);
  } catch (error) {
    console.error("Failed to read identity badges by username:", error);
    return [];
  }
}
