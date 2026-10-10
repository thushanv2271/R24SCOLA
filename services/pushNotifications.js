import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { authAPI } from "./apiService";

// expo-notifications is loaded defensively: if its native side is missing or
// fails to initialise, push simply stays off instead of taking the app down.
let Notifications = null;
try {
  Notifications = require("expo-notifications");
} catch (error) {
  console.warn("expo-notifications unavailable:", error?.message);
}
export const getNotifications = () => Notifications;

const TOKEN_KEY = "pushToken";
const SYNC_RETRY_DELAY_MS = 60 * 1000;

// Guards syncPushRegistration: one run at a time, no re-sending a token the
// server already has, and a pause after a failure so a rejected request
// (e.g. an expired session) can't turn into a retry loop.
let syncInFlight = false;
let lastSyncedKey = null;
let syncBlockedUntil = 0;
let syncBlockedUser = null;
const enabledKey = (username) => `pushEnabled_${username}`;

// While the app is open the tab-bar badge already shows new messages, so the
// system banner is only used when the app is in the background or closed.
// The exception is notifications the app raises itself (the bell-icon ones,
// e.g. "Login Successful"): those are flagged `showInForeground` and always
// appear as a device notification, even with the app open.
try {
  Notifications?.setNotificationHandler({
    handleNotification: async (notification) => {
      const show = notification?.request?.content?.data?.showInForeground === true;
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    },
  });
} catch (error) {
  console.warn("Could not set notification handler:", error?.message);
}

const ensureAndroidChannel = async () => {
  if (Platform.OS !== "android" || !Notifications) return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "Messages & replies",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 200, 250],
    lightColor: "#004AAD",
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
};

const fetchExpoToken = async () => {
  await ensureAndroidChannel();
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  return data;
};

const LOCAL_PROMPTED_KEY = "localNotificationsPrompted";
const NOTIFICATION_PREF_KEY = "@onboarding_notifications";

// First-launch setup asks "turn on notifications?" before anyone has an
// account. This asks the system for permission right then and remembers the
// answer; applyNotificationPreference() carries it onto the account at login.
// Returns true when notifications are allowed.
export const requestNotificationPermission = async () => {
  let granted = false;
  if (Notifications && Platform.OS !== "web") {
    try {
      await ensureAndroidChannel();
      let permission = await Notifications.getPermissionsAsync();
      if (!permission.granted && permission.canAskAgain !== false) {
        permission = await Notifications.requestPermissionsAsync();
      }
      granted = !!permission.granted;
    } catch (error) {
      console.warn("Notification permission request failed:", error?.message);
    }
  }
  await AsyncStorage.setItem(NOTIFICATION_PREF_KEY, granted ? "1" : "0").catch(() => {});
  return granted;
};

export const declineNotifications = () =>
  AsyncStorage.setItem(NOTIFICATION_PREF_KEY, "0").catch(() => {});

// At login: if this account has never chosen, use the answer given during
// first-launch setup (on = register this device, off = keep it quiet).
export const applyNotificationPreference = async (username) => {
  if (!username) return;
  try {
    const [pref, current] = await Promise.all([
      AsyncStorage.getItem(NOTIFICATION_PREF_KEY),
      AsyncStorage.getItem(enabledKey(username)),
    ]);
    if (current != null || pref == null) return;
    if (pref === "1") await enablePush(username);
    else await AsyncStorage.setItem(enabledKey(username), "0");
  } catch (error) {
    console.warn("Could not apply notification preference:", error?.message);
  }
};

// Shows an in-app notification (the ones behind the bell icon) as a real device
// notification too. Respects the account's notifications switch in Profile
// (turned off there = nothing is shown), and asks for the system permission
// once, the first time one is needed. Never throws: the in-app list is the
// source of truth and this is a best-effort extra.
export const showLocalNotification = async (username, { title, body, data } = {}) => {
  if (!Notifications || Platform.OS === "web" || !title) return;
  try {
    if (username && (await AsyncStorage.getItem(enabledKey(username))) === "0") return;

    await ensureAndroidChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted && permission.canAskAgain !== false) {
      const prompted = await AsyncStorage.getItem(LOCAL_PROMPTED_KEY);
      if (prompted) return;
      await AsyncStorage.setItem(LOCAL_PROMPTED_KEY, "1");
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: body || "",
        data: { ...(data || {}), showInForeground: true },
        ...(Platform.OS === "android" ? { color: "#004AAD" } : {}),
      },
      trigger: Platform.OS === "android" ? { channelId: "default" } : null,
    });
  } catch (error) {
    console.warn("Could not show device notification:", error?.message);
  }
};

export const getPermissionState = async () => {
  if (!Notifications) return { granted: false, canAskAgain: true };
  const permission = await Notifications.getPermissionsAsync();
  return { granted: !!permission.granted, canAskAgain: permission.canAskAgain !== false };
};

export const isPushEnabled = async (username) => {
  if (!username) return false;
  const [flag, permission] = await Promise.all([
    AsyncStorage.getItem(enabledKey(username)),
    getPermissionState(),
  ]);
  return flag === "1" && permission.granted;
};

// Result: { ok: true } or { ok: false, reason: "unavailable" | "denied" | "failed" }.
export const enablePush = async (username) => {
  if (!username) return { ok: false, reason: "failed" };
  // Expo Go can't receive push notifications on Android; they need the real app build.
  if (!Notifications || Constants.appOwnership === "expo") return { ok: false, reason: "unavailable" };
  try {
    await ensureAndroidChannel();
    let permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (!permission.granted) return { ok: false, reason: "denied" };

    const token = await fetchExpoToken();
    await authAPI.registerPushToken(username, token);
    await AsyncStorage.multiSet([[TOKEN_KEY, token], [enabledKey(username), "1"]]);
    lastSyncedKey = `${username}:${token}`;
    return { ok: true };
  } catch (error) {
    console.error("Error enabling push notifications:", error);
    return { ok: false, reason: "failed" };
  }
};

const removeTokenFromServer = async (username) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token && username) {
    await authAPI.unregisterPushToken(username, token);
  }
};

export const disablePush = async (username) => {
  if (!username) return;
  lastSyncedKey = null;
  try {
    await removeTokenFromServer(username);
  } catch (error) {
    console.error("Error removing push token:", error);
  }
  await AsyncStorage.setItem(enabledKey(username), "0");
};

// Stops this device receiving the account's notifications after sign-out while
// remembering the user's choice for the next login.
export const unregisterPushOnLogout = async (username) => {
  lastSyncedKey = null;
  try {
    await Promise.race([
      removeTokenFromServer(username),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (error) {
    console.error("Error removing push token on logout:", error);
  }
};

// Called on login / app start: Expo tokens can change, so a user who has
// notifications on gets this device's current token (re-)registered.
export const syncPushRegistration = async (username) => {
  if (!username || !Notifications || syncInFlight) return;
  if (syncBlockedUser === username && Date.now() < syncBlockedUntil) return;
  syncInFlight = true;
  try {
    if (!(await isPushEnabled(username))) return;
    const token = await fetchExpoToken();
    const key = `${username}:${token}`;
    if (key === lastSyncedKey) return;
    await authAPI.registerPushToken(username, token);
    await AsyncStorage.setItem(TOKEN_KEY, token);
    lastSyncedKey = key;
  } catch (error) {
    syncBlockedUntil = Date.now() + SYNC_RETRY_DELAY_MS;
    syncBlockedUser = username;
    // A 401 means the session expired; the app signs the user out on its own.
    if (error?.status === 401) {
      console.warn("Push registration skipped: session expired");
    } else {
      console.error("Error syncing push registration:", error);
    }
  } finally {
    syncInFlight = false;
  }
};
