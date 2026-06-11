import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { updateNotificationToken } from "../../api/notifications";

export type PushRegistrationStatus =
  | "registered"        // token obtained and confirmed by the backend
  | "permission-denied" // notification permission not granted
  | "unsupported"       // simulator / not a physical device
  | "no-project-id"     // missing EAS project id in app config
  | "sync-failed";      // token obtained but the backend rejected/failed

export interface PushRegistrationResult {
  status: PushRegistrationStatus;
  token?: string;
}

/**
 * Obtains this device's Expo push token and registers it with the backend.
 *
 * Login also sends the token, but it frequently isn't available yet at that
 * point (permission granted later, or the async fetch hasn't resolved when
 * the user submits), so every signed-in session must be able to re-register.
 * Safe to call repeatedly — the backend upsert is idempotent.
 */
export async function registerAndSyncPushToken(
  { requestPermission = false }: { requestPermission?: boolean } = {},
): Promise<PushRegistrationResult> {
  if (!Device.isDevice) {
    return { status: "unsupported" };
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted" && requestPermission) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== "granted") {
    return { status: "permission-denied" };
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn("Unable to register for push notifications: missing EAS project ID.");
    return { status: "no-project-id" };
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const synced = await updateNotificationToken(token);
  return synced ? { status: "registered", token } : { status: "sync-failed", token };
}
