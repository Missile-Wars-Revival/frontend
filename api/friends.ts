import {
  getDatabase, ref, get, set, remove, query, orderByChild, equalTo,
} from "firebase/database";
import { auth } from "../util/firebase/firebaseAuth";

// Phase 6 social cutover (backend/DISTRIBUTED_HOSTING_PLAN.md): friendships
// live in Firebase central as uid-keyed edges — /friends/<uid>/<friendUid> —
// written by the client under security rules, never by a game server. A
// one-sided edge is a pending request (an entry also lands in the target's
// /friendRequests inbox); edges both ways make a friendship.
//
// Game servers learn the list via the websocket `friendsDeclare` message
// (see hooks/websockets/websockets.ts) purely for gameplay: visibility,
// friendly-fire exemption, proximity alerts.

interface FriendResponse {
  message: string;
}

function requireUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("Not signed in to Firebase — friends need a Firebase session.");
  }
  return uid;
}

// Resolves a username to its Firebase uid via /profiles (indexed on username).
export async function lookupUidByUsername(username: string): Promise<string | null> {
  const db = getDatabase();
  const snap = await get(
    query(ref(db, "profiles"), orderByChild("username"), equalTo(username))
  );
  if (!snap.exists()) return null;
  const matches = Object.keys(snap.val());
  return matches[0] ?? null;
}

async function ownUsername(uid: string): Promise<string> {
  const snap = await get(ref(getDatabase(), `profiles/${uid}/username`));
  return snap.exists() ? String(snap.val()) : "";
}

// Signature kept from the REST era (token is unused now) so the four UI call
// sites don't change.
export async function addFriend(_token: string, friend: string): Promise<FriendResponse> {
  const uid = requireUid();
  const friendUid = await lookupUidByUsername(friend);
  if (!friendUid) {
    throw new Error("Friend not found");
  }
  if (friendUid === uid) {
    throw new Error("You cannot add yourself");
  }
  const db = getDatabase();

  const existing = await get(ref(db, `friends/${uid}/${friendUid}`));
  if (existing.exists()) {
    throw new Error("Friend already added");
  }

  await set(ref(db, `friends/${uid}/${friendUid}`), true);

  // Drop their pending request to me (if this add is an accept), and leave a
  // request entry in THEIR inbox so their client can surface it.
  await remove(ref(db, `friendRequests/${uid}/${friendUid}`)).catch(() => {});
  const username = await ownUsername(uid);
  await set(ref(db, `friendRequests/${friendUid}/${uid}`), {
    username,
    at: Date.now(),
  }).catch(() => {});

  return { message: "Friend added successfully" };
}

export async function removeFriend(_token: string, friend: string): Promise<FriendResponse> {
  const uid = requireUid();
  const friendUid = await lookupUidByUsername(friend);
  if (!friendUid) {
    throw new Error("Friend not found");
  }
  const db = getDatabase();
  await remove(ref(db, `friends/${uid}/${friendUid}`));
  // Withdraw the request entry I left in their inbox (sender may delete it).
  await remove(ref(db, `friendRequests/${friendUid}/${uid}`)).catch(() => {});
  return { message: "Friend removed successfully" };
}

export interface FriendEdge {
  uid: string;
  username: string;
  mutual: boolean;
}

// All my outgoing edges, with usernames resolved from /profiles and
// mutuality determined by whether the friend's edge back to me exists.
export async function getFriendEdges(): Promise<FriendEdge[]> {
  const uid = requireUid();
  const db = getDatabase();
  const snap = await get(ref(db, `friends/${uid}`));
  if (!snap.exists()) return [];
  const friendUids = Object.keys(snap.val() as Record<string, unknown>);

  return (
    await Promise.all(
      friendUids.map(async (friendUid) => {
        const [nameSnap, backEdge] = await Promise.all([
          get(ref(db, `profiles/${friendUid}/username`)),
          get(ref(db, `friends/${friendUid}/${uid}`)),
        ]);
        if (!nameSnap.exists()) return null;
        return {
          uid: friendUid,
          username: String(nameSnap.val()),
          mutual: backEdge.exists(),
        };
      })
    )
  ).filter((e): e is FriendEdge => e !== null);
}
