import { useContext, useEffect, useRef } from "react";
import { Linking, Platform } from "react-native";
import { router } from "expo-router";
import { AuthContext } from "./AuthContext";
import { getNotifications, syncPushRegistration } from "../services/pushNotifications";

const PLAY_STORE_APP_URL = "market://details?id=com.thusha2271.scholarships";
const PLAY_STORE_WEB_URL = "https://play.google.com/store/apps/details?id=com.thusha2271.scholarships";

const openStoreListing = async () => {
  try {
    await Linking.openURL(PLAY_STORE_APP_URL);
  } catch {
    Linking.openURL(PLAY_STORE_WEB_URL).catch(() => {});
  }
};

// Expo's last-response hook calls native APIs that are unavailable on web.
const Notifications = Platform.OS === "web" ? null : getNotifications();
const useLastResponse = Notifications?.useLastNotificationResponse ?? (() => null);

// Renders nothing. Keeps this device's push token registered for the signed-in
// user and opens the right screen when a notification is tapped (including
// when the tap is what launched the app).
export default function PushNotificationHandler() {
  const { user } = useContext(AuthContext);
  const username = user?.username;
  const handledId = useRef(null);
  const lastResponse = useLastResponse();

  useEffect(() => {
    if (username && Notifications) syncPushRegistration(username);
  }, [username]);

  useEffect(() => {
    if (!username || !Notifications) return undefined;
    try {
      const sub = Notifications.addPushTokenListener(() => syncPushRegistration(username));
      return () => sub.remove();
    } catch (error) {
      console.warn("Push token listener failed:", error?.message);
      return undefined;
    }
  }, [username]);

  useEffect(() => {
    if (!Notifications || !lastResponse) return undefined;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return undefined;
    const id = lastResponse.notification.request.identifier;
    if (handledId.current === id) return undefined;
    handledId.current = id;

    const data = lastResponse.notification.request.content.data || {};
    // On a cold start the app is still deciding which screen to show first,
    // so wait a beat before pushing on top of it.
    const timer = setTimeout(() => {
      if (data.type === "update") {
        openStoreListing();
      } else if (!username) {
        // Chat and comment screens need a signed-in user.
      } else if (data.type === "chat" && data.username) {
        router.push({ pathname: "/Chat", params: { username: String(data.username) } });
      } else if (data.type === "comment" && data.postId) {
        router.push({ pathname: "/CommunityPostDetail", params: { id: String(data.postId) } });
      }
      Notifications.clearLastNotificationResponse?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [lastResponse, username]);

  return null;
}
