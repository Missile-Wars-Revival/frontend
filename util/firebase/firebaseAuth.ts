import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User, initializeAuth, getReactNativePersistence } from "firebase/auth";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { startGetSelfProfile } from "../../api/getprofile";
import { ApiResponse } from "../../app/profile";

// Initialize Firebase app
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0] as FirebaseApp;
}

// Initialize Firebase Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export async function signInWithFirebase(password: string, token: string): Promise<User | null> {
  console.log("Starting Firebase sign-in process");
  try {
    console.log("Firebase auth object obtained");

    const response = await startGetSelfProfile(token) as ApiResponse;
    if (response.success && response.userProfile) {
      const email = response.userProfile.email;

      try {
        console.log("Attempting to sign in with email and password");
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("User signed in with Firebase:", userCredential.user.uid);
        // Alert.alert("Firebase Sign-In Successful", `UID: ${userCredential.user.uid}`);
        
        await SecureStore.setItemAsync("firebaseUID", userCredential.user.uid);
        console.log("Firebase UID stored in SecureStore");
        
        return userCredential.user;
      } catch (signInError: any) {
        if (signInError.code === 'auth/invalid-credential') {
          console.log("Invalid credentials. Attempting to register...");
          const registeredUser = await registerWithFirebase(email, password);
          if (registeredUser) {
            console.log("User registered successfully:", registeredUser.uid);
            return registeredUser;
          } else {
            console.error("Registration failed");
            return null;
          }
        } else {
          console.error("Unexpected sign-in error:", signInError);
          throw signInError;
        }
      }
    } else {
      console.error('Failed to fetch user profile: Invalid response structure');
      return null;
    }
  } catch (error) {
    console.error("Error in Firebase authentication:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
    //   Alert.alert(
    //     "Firebase Authentication Error",
    //     `Name: ${error.name}\nMessage: ${error.message}`
    //   );
    } else {
    //   Alert.alert("Firebase Authentication Error", "An unknown error occurred");
    }
    return null;
  }
}

export async function registerWithFirebase(email: string, password: string): Promise<User | null> {
  console.log("Starting Firebase registration process");
  try {
    console.log("Firebase auth object obtained for registration");

    console.log("Attempting to create user with email and password");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("User registered with Firebase:", userCredential.user.uid);
    // Alert.alert("Firebase Registration Successful", `UID: ${userCredential.user.uid}`);
    
    // Store the Firebase UID
    await SecureStore.setItemAsync("firebaseUID", userCredential.user.uid);
    console.log("Firebase UID stored in SecureStore after registration");
    
    return userCredential.user;
  } catch (error) {
    console.error("Error registering with Firebase:", error);
    if (error instanceof Error) {
      console.error("Registration error name:", error.name);
      console.error("Registration error message:", error.message);
      console.error("Registration error stack:", error.stack);
      
    //   Alert.alert(
    //     "Firebase Registration Error",
    //     `Name: ${error.name}\nMessage: ${error.message}`
    //   );
    } else {
    //   Alert.alert("Firebase Registration Error", "An unknown error occurred during registration");
    }
    return null;
  }
}
