import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import notificationService from "@/services/NotificationService";
import {
  unregisterPushOnLogout,
  showLocalNotification,
  applyNotificationPreference,
} from "@/services/pushNotifications";
import { authAPI, walletAPI, chatAPI, setAuthToken, setUnauthorizedHandler, avatarPhotoUrl } from "@/services/apiService";
import { favoritesStore, useFavorites } from "@/services/favoritesStore";
import { normalizeListings } from "@/constants/categories";
import { secureSetItem, secureGetItem, secureRemoveItem } from "@/services/secureStorage";

const UNREAD_POLL_INTERVAL_MS = 20000;
const USER_DATA_KEY = "userData";

// The profile blob (name, email, phone, ...) is personal data, so it lives in
// the OS keychain/keystore next to the token rather than in plain AsyncStorage.
const readStoredProfile = async () => {
  const secureRaw = await secureGetItem(USER_DATA_KEY);
  if (secureRaw) return JSON.parse(secureRaw);

  // One-time move of a profile saved by an earlier app version.
  const legacyRaw = await AsyncStorage.getItem(USER_DATA_KEY);
  if (!legacyRaw) return null;
  const legacyProfile = JSON.parse(legacyRaw);
  const { token: _dropped, ...profileOnly } = legacyProfile;
  await secureSetItem(USER_DATA_KEY, JSON.stringify(profileOnly));
  await AsyncStorage.removeItem(USER_DATA_KEY);
  return profileOnly;
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const favorites = useFavorites();
  const favoritesCount = (favorites.scholarships?.length || 0) + (favorites.jobs?.length || 0);
  const [avatarIcon, setAvatarIcon] = useState(null);
  const [avatarPhotoVersion, setAvatarPhotoVersion] = useState(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  // The Scola Coin wallet: balance, USD valuation, live pricing, and the
  // server-tracked set of scholarship/job ids already requested — the single
  // source of truth every screen checks before letting a user tap "Request"
  // again, so the same item can never be paid for (or emailed) twice.
  const [wallet, setWallet] = useState(null);
  const [walletRefreshTrigger, setWalletRefreshTrigger] = useState(0);

  const loadAvatarIcon = async (username) => {
    if (!username) return;
    try {
      const stored = await AsyncStorage.getItem(`avatarIcon_${username}`);
      setAvatarIcon(stored ? JSON.parse(stored) : null);
    } catch (error) {
      console.error("Error loading avatar icon:", error);
    }
  };

  const loadAvatarPhotoVersion = async (username) => {
    if (!username) return;
    try {
      const stored = await AsyncStorage.getItem(`avatarPhotoVer_${username}`);
      setAvatarPhotoVersion(stored ? Number(stored) : null);
    } catch (error) {
      console.error("Error loading avatar photo:", error);
    }
  };

  const storeAvatarPhotoVersion = async (username, version) => {
    setAvatarPhotoVersion(version || null);
    try {
      if (version) {
        await AsyncStorage.setItem(`avatarPhotoVer_${username}`, String(version));
      } else {
        await AsyncStorage.removeItem(`avatarPhotoVer_${username}`);
      }
    } catch (error) {
      console.error("Error caching avatar photo:", error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Plaintext copies left by older versions are never read again.
        await AsyncStorage.multiRemove(["userToken", "password"]);
        const profile = await readStoredProfile();
        const token = await secureGetItem("userToken");
        if (profile && token) {
          setUser(profile);
          setAuthToken(token);
          await loadAvatarIcon(profile.username);
          await loadAvatarPhotoVersion(profile.username);
        } else if (profile) {
          // A profile without a token is a stale session — drop it.
          await secureRemoveItem(USER_DATA_KEY);
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  // If any authenticated request comes back 401 (e.g. an expired token),
  // the stored session is stale — clear it and send the user back to login
  // instead of leaving the app in a "logged in" state where every call fails.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout({ skipPushUnregister: true });
      router.replace("/login");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = async (userData) => {
    try {
      // Token and profile both go to SecureStore; the profile blob never
      // contains the token, so it has exactly one home on disk.
      const { token, ...profileOnly } = userData || {};
      setUser(profileOnly);
      setAuthToken(token);
      await secureSetItem(USER_DATA_KEY, JSON.stringify(profileOnly));
      if (token) {
        await secureSetItem("userToken", token);
      }
      // The server is now the source of truth for the avatar (so other users
      // can see it too) — seed from the login response when it has one
      // (e.g. first login on a new device), otherwise fall back to whatever
      // was last cached locally on this device.
      if (userData?.avatarIcon) {
        const next = { icon: userData.avatarIcon, color: userData.avatarColor };
        setAvatarIcon(next);
        await AsyncStorage.setItem(
          `avatarIcon_${userData.username}`,
          JSON.stringify(next),
        );
      } else {
        await loadAvatarIcon(userData?.username);
      }
      if (userData?.username) {
        await storeAvatarPhotoVersion(userData.username, userData.avatarPhotoVersion);
      }

      // Carry the first-launch "notifications?" answer onto this account.
      // Awaited so a "no" is recorded before the login notification below.
      await Promise.race([
        applyNotificationPreference(userData?.username),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);

      // Add to notification history
      addNotification(
        {
          type: "login",
          title: "Login Successful",
          description: `You logged in on ${new Date().toLocaleString()}`,
          timestamp: new Date(),
        },
        { username: userData?.username },
      );
    } catch (error) {
      console.error("Error during login:", error);
      notificationService.error(
        "Login Failed",
        "An error occurred during login",
      );
    }
  };

  const logout = async (options = {}) => {
    try {
      // Needs the auth token, so it has to happen before it is cleared. An
      // expired session (401) skips it — the call could only fail again.
      if (!options?.skipPushUnregister && user?.username) {
        await unregisterPushOnLogout(user.username);
      }
      setUser(null);
      setAuthToken(null);
      setAvatarIcon(null);
      setAvatarPhotoVersion(null);
      await secureRemoveItem("userToken");
      await secureRemoveItem(USER_DATA_KEY);
      await AsyncStorage.multiRemove(["isLoggedIn", "userID"]);
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Update (or clear, when icon is null) the current user's preset avatar icon
  const updateAvatarIcon = async (icon, color) => {
    if (!user?.username) return;
    try {
      const next = icon ? { icon, color } : null;
      setAvatarIcon(next);
      // Choosing a preset (or the initial) replaces the gallery photo.
      storeAvatarPhotoVersion(user.username, null);
      if (next) {
        await AsyncStorage.setItem(
          `avatarIcon_${user.username}`,
          JSON.stringify(next),
        );
      } else {
        await AsyncStorage.removeItem(`avatarIcon_${user.username}`);
      }
      // Local cache is updated first (above) so the picker feels instant
      // regardless of network — this sync is what makes the choice visible
      // to other users (e.g. in their inbox), not required for it to work
      // on this device.
      await authAPI.updateAvatar(user.username, icon || null, color || null);
    } catch (error) {
      console.error("Error updating avatar icon:", error);
    }
  };

  // Uploads a gallery photo (base64 JPEG, already resized by the caller).
  // Throws on failure so the UI can tell the user instead of silently keeping
  // the old picture.
  const updateAvatarPhoto = async (imageBase64) => {
    if (!user?.username) return;
    const data = await authAPI.updateAvatarPhoto(user.username, imageBase64);
    await storeAvatarPhotoVersion(user.username, data?.avatarPhotoVersion);
  };

  const removeAvatarPhoto = async () => {
    if (!user?.username) return;
    await authAPI.removeAvatarPhoto(user.username);
    await storeAvatarPhotoVersion(user.username, null);
  };

  const avatarPhotoUri = avatarPhotoUrl(user?.username, avatarPhotoVersion);

  const updateCreatorMode = async (creatorModeEnabled, creatorRole) => {
    if (!user?.username) return false;
    try {
      const data = await authAPI.updateCreatorMode(
        user.username,
        creatorModeEnabled,
        creatorRole || user?.creatorRole || "companyOwner",
      );
      const nextCreatorModeEnabled = !!data?.creatorModeEnabled;
      const nextCreatorRole = data?.creatorRole || creatorRole || user?.creatorRole || "companyOwner";

      setUser((prev) => ({
        ...(prev || {}),
        creatorModeEnabled: nextCreatorModeEnabled,
        creatorRole: nextCreatorRole,
      }));

      const rawUser = await secureGetItem(USER_DATA_KEY);
      const persisted = rawUser ? JSON.parse(rawUser) : {};
      const nextUser = {
        ...persisted,
        creatorModeEnabled: nextCreatorModeEnabled,
        creatorRole: nextCreatorRole,
      };
      await secureSetItem(USER_DATA_KEY, JSON.stringify(nextUser));
      return true;
    } catch (error) {
      console.error("Error updating creator mode:", error);
      return false;
    }
  };

  // Merges freshly saved profile fields into the in-memory user and the stored
  // copy, so screens that read `user` (Home progress, Top Picks) update at once.
  const updateProfile = async (fields) => {
    if (!fields) return;
    setUser((prev) => (prev ? { ...prev, ...fields } : prev));
    try {
      const rawUser = await secureGetItem(USER_DATA_KEY);
      const persisted = rawUser ? JSON.parse(rawUser) : {};
      await secureSetItem(USER_DATA_KEY, JSON.stringify({ ...persisted, ...fields }));
    } catch (error) {
      console.error("Error persisting profile:", error);
    }
  };

  // Add notification to history (the bell icon) and also raise it as a real
  // device notification. `options.username` covers the login case, where the
  // signed-in user isn't in state yet; `options.device: false` keeps one
  // in-app only.
  const addNotification = (notification, options = {}) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    if (options.device !== false) {
      showLocalNotification(options.username ?? user?.username, {
        title: notification.title,
        body: notification.description,
        data: { type: notification.type },
      });
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Remove a single notification from history
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Memoized refresh function to trigger favorite refetches
  const refreshFavorites = useCallback(() => {
    setFavoritesRefreshTrigger((prev) => prev + 1);
  }, []);

  // Loads the favourites into the shared store at sign-in and whenever one
  // is added/removed (refreshFavorites). The tab-bar count, the lists and the
  // hearts all read the store, so they never disagree.
  useEffect(() => {
    if (!user?.username) {
      favoritesStore.reset();
      return;
    }

    let cancelled = false;
    const load = async (kind, fetchFn) => {
      const startedAt = favoritesStore.mark();
      try {
        const data = await fetchFn(user.username);
        if (!cancelled && Array.isArray(data)) {
          favoritesStore.setItems(kind, normalizeListings(data), startedAt);
        }
      } catch (error) {
        // A 401 means the saved session expired — apiService's
        // unauthorizedHandler already logs out and redirects.
        if (error?.status !== 401) {
          console.error("Error fetching favorites:", error);
        }
      }
    };
    load("scholarships", authAPI.getFavorites);
    load("jobs", authAPI.getJobFavorites);

    return () => {
      cancelled = true;
    };
  }, [user?.username, favoritesRefreshTrigger]);

  const refreshWallet = useCallback(() => {
    setWalletRefreshTrigger((prev) => prev + 1);
  }, []);

  // Keep the wallet (balance, valuation, pricing, requested-id sets, recent
  // history) in sync with the server — the server is the single source of
  // truth for the economy, the app just displays and reacts to it.
  useEffect(() => {
    if (!user?.username) {
      setWallet(null);
      return;
    }

    let cancelled = false;
    const loadWallet = async () => {
      try {
        const data = await walletAPI.getWallet(user.username);
        if (!cancelled) setWallet(data);
      } catch (error) {
        if (error?.status !== 401) {
          console.error("Error fetching wallet:", error);
        }
      }
    };

    loadWallet();
    return () => {
      cancelled = true;
    };
  }, [user, walletRefreshTrigger]);

  // Total unread direct-message count, shown as a badge on the Inbox tab —
  // polled rather than pushed, same tradeoff as the chat screen itself.
  useEffect(() => {
    if (!user?.username) {
      setUnreadMessageCount(0);
      return undefined;
    }

    let cancelled = false;
    const loadUnreadCount = async () => {
      try {
        const data = await chatAPI.getConversations();
        if (cancelled) return;
        const total = (data?.conversations || []).reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0,
        );
        setUnreadMessageCount(total);
      } catch (error) {
        if (error?.status !== 401) {
          console.error("Error fetching unread message count:", error);
        }
      }
    };

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, UNREAD_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  // Merges a server response's wallet-shaped fields into local state so the
  // balance/requested-id sets update instantly without a full re-fetch.
  const mergeWalletUpdate = (data) => {
    if (!data) return;
    setWallet((prev) => ({
      ...(prev || {}),
      coins: data.coins ?? prev?.coins,
      valueUsd:
        data.coins != null && prev?.coinValueUsd != null
          ? data.coins * prev.coinValueUsd
          : prev?.valueUsd,
      requestedScholarshipIds:
        data.requestedScholarshipIds ?? prev?.requestedScholarshipIds ?? [],
      requestedJobIds: data.requestedJobIds ?? prev?.requestedJobIds ?? [],
      recentTransactions: data.transaction
        ? [data.transaction, ...(prev?.recentTransactions || [])].slice(0, 10)
        : prev?.recentTransactions,
    }));
  };

  // True if this scholarship/job id has already been paid for and sent —
  // checked before every "Request" tap, on every screen, so the same item
  // can never be charged (or emailed) twice.
  const isRequested = (itemId, isJob) => {
    const ids = isJob
      ? wallet?.requestedJobIds
      : wallet?.requestedScholarshipIds;
    return Array.isArray(ids) && ids.includes(itemId);
  };

  // Charges the cost of one scholarship/job request and marks it requested,
  // atomically, server-side. Returns a result the caller can branch on
  // directly: { success, coins, alreadyRequested, insufficientCoins, spent,
  // shortfall, message }.
  const chargeForRequest = async (requestType, itemId, itemTitle) => {
    if (!user?.username) return { success: false };
    try {
      const data = await walletAPI.chargeRequest(
        user.username,
        requestType,
        itemId,
        itemTitle,
      );
      mergeWalletUpdate(data);
      return { success: true, coins: data?.coins, spent: data?.spent };
    } catch (error) {
      const code = error?.data?.code;
      if (code === "ALREADY_REQUESTED") {
        // Reconcile locally in case another device/session already spent
        // this — no need to wait for the next poll to reflect it here too.
        setWallet((prev) =>
          prev
            ? {
                ...prev,
                coins: error.data.coins ?? prev.coins,
                [requestType === "job"
                  ? "requestedJobIds"
                  : "requestedScholarshipIds"]: Array.from(
                  new Set([
                    ...(prev[
                      requestType === "job"
                        ? "requestedJobIds"
                        : "requestedScholarshipIds"
                    ] || []),
                    itemId,
                  ]),
                ),
              }
            : prev,
        );
        return { success: false, alreadyRequested: true, message: error.message };
      }
      if (code === "INSUFFICIENT_COINS") {
        return {
          success: false,
          insufficientCoins: true,
          coins: error.data.coins,
          required: error.data.required,
          shortfall: error.data.shortfall,
          message: error.message,
        };
      }
      console.error("Error charging wallet:", error);
      return { success: false, error, message: error?.message };
    }
  };

  // Charges one flat bulk fee covering every id in itemIds not already
  // requested. Returns { success, coins, chargedIds, skippedIds, ... }.
  const chargeForBulkRequest = async (requestType, itemIds) => {
    if (!user?.username) return { success: false };
    try {
      const data = await walletAPI.chargeBulkRequest(
        user.username,
        requestType,
        itemIds,
      );
      mergeWalletUpdate(data);
      return {
        success: true,
        coins: data?.coins,
        spent: data?.spent,
        chargedIds: data?.chargedIds || [],
        skippedIds: data?.skippedIds || [],
      };
    } catch (error) {
      const code = error?.data?.code;
      if (code === "ALREADY_REQUESTED") {
        return { success: false, alreadyRequested: true, message: error.message };
      }
      if (code === "INSUFFICIENT_COINS") {
        return {
          success: false,
          insufficientCoins: true,
          coins: error.data.coins,
          required: error.data.required,
          shortfall: error.data.shortfall,
          message: error.message,
        };
      }
      console.error("Error charging wallet (bulk):", error);
      return { success: false, error, message: error?.message };
    }
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      login,
      setUser,
      updateProfile,
      logout,
      loading,
      refreshFavorites,
      favoritesRefreshTrigger,
      favoritesCount,
      notifications,
      addNotification,
      clearNotifications,
      removeNotification,
      avatarIcon,
      updateAvatarIcon,
      avatarPhotoUri,
      updateAvatarPhoto,
      removeAvatarPhoto,
      updateCreatorMode,
      wallet,
      refreshWallet,
      chargeForRequest,
      chargeForBulkRequest,
      isRequested,
      unreadMessageCount,
    }),
    [
      user,
      loading,
      refreshFavorites,
      favoritesRefreshTrigger,
      favoritesCount,
      notifications,
      avatarIcon,
      avatarPhotoVersion,
      updateCreatorMode,
      wallet,
      refreshWallet,
      unreadMessageCount,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
