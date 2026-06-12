import axios, { isAxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import { getDatabase, ref, get } from "firebase/database";
import { sendPasswordResetEmail, type User } from "firebase/auth";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../util/firebase/firebaseAuth";
import { setBackgroundAccessibleItem } from "../util/secure-store";

// Phase 8 (backend/DISTRIBUTED_HOSTING_PLAN.md): in distributed mode the app
// authenticates with Firebase + the coordinator ONLY — no shard is contacted
// until the player has picked one. Game usernames are allocated centrally via
// the coordinator's claim endpoint and live in /profiles/<uid>; the shard
// creates its local rows on first websocket connect (Phase 7 provisioning).
//
// Solo/no-coordinator builds keep the legacy shard login in api/login.ts and
// api/register.ts — nothing here is used there.

const COORDINATOR_URL = (process.env.EXPO_PUBLIC_COORDINATOR_URL || "").replace(/\/$/, "");

// Firebase restores the session asynchronously on cold start; give it a
// moment before concluding there is no signed-in Firebase user.
export function waitForFirebaseUser(timeoutMs = 5000): Promise<User | null> {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        clearTimeout(timer);
        unsubscribe();
        resolve(user);
      }
    });
  });
}

// The account's game username, from Firebase central. Null means either "no
// Firebase session" or "username never claimed" — callers that care about the
// difference should check waitForFirebaseUser() first.
export async function getMyProfileUsername(): Promise<string | null> {
  const user = await waitForFirebaseUser();
  if (!user) return null;
  const snap = await get(ref(getDatabase(), `profiles/${user.uid}/username`));
  return snap.exists() && typeof snap.val() === "string" ? snap.val() : null;
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const { data } = await axios.get(`${COORDINATOR_URL}/auth/username-available`, {
    params: { username },
    timeout: 10000,
  });
  return data?.data?.available === true;
}

// Claims the username for the current Firebase account (central uniqueness,
// transactional on the coordinator). Throws Error("USERNAME_TAKEN") when the
// name was grabbed between the availability check and the claim.
export async function claimUsername(username: string): Promise<string> {
  const user = await waitForFirebaseUser();
  if (!user) throw new Error("Not signed in");
  try {
    const { data } = await axios.post(
      `${COORDINATOR_URL}/auth/claim-username`,
      { username },
      { headers: { Authorization: `Bearer ${await user.getIdToken()}` }, timeout: 15000 }
    );
    const claimed: string = data?.data?.username ?? username;
    await SecureStore.setItemAsync("username", claimed);
    return claimed;
  } catch (error) {
    if (isAxiosError(error)) {
      throw new Error(error.response?.data?.error?.code ?? "CLAIM_FAILED");
    }
    throw error;
  }
}

export async function loginWithFirebase(email: string, password: string): Promise<void> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await setBackgroundAccessibleItem("firebaseUID", credential.user.uid);
}

export async function registerWithFirebase(email: string, password: string): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await setBackgroundAccessibleItem("firebaseUID", credential.user.uid);
}

// Firebase emails a reset link itself — no shard, no coordinator, no code
// entry in the app (unlike the legacy shard reset-code flow).
export async function requestFirebasePasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
