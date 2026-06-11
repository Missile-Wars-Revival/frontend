import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  OAuthProvider,
  GoogleAuthProvider,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0] as FirebaseApp;
}

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { signInWithEmailAndPassword, createUserWithEmailAndPassword };

export type OAuthUser = {
  uid: string;
  email: string;
  displayName: string;
  idToken: string;
};

export async function signInWithApple(identityToken: string, displayName: string): Promise<OAuthUser> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: identityToken });
  const { user } = await signInWithCredential(auth, credential);
  await SecureStore.setItemAsync('firebaseUID', user.uid);
  const idToken = await user.getIdToken();
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName || displayName,
    idToken,
  };
}

export async function signInWithGoogle(googleIdToken: string): Promise<OAuthUser> {
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const { user } = await signInWithCredential(auth, credential);
  await SecureStore.setItemAsync('firebaseUID', user.uid);
  const idToken = await user.getIdToken();
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    idToken,
  };
}
