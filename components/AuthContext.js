import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import notificationService from "@/services/NotificationService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const login = async (userData) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));

      // Show success notification
      notificationService.success(
        "Login Successful",
        `Welcome back, ${userData.username || "User"}! 👋`,
      );

      // Add to notification history
      addNotification({
        type: "login",
        title: "Login Successful",
        description: `You logged in on ${new Date().toLocaleString()}`,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error during login:", error);
      notificationService.error(
        "Login Failed",
        "An error occurred during login",
      );
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.multiRemove([
        "userData",
        "userToken",
        "isLoggedIn",
        "userID",
      ]);
      notificationService.info("Logged Out", "You have been logged out");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Add notification to history
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification,
      timestamp: notification.timestamp || new Date(),
    };
    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  // Memoized refresh function to trigger favorite refetches
  const refreshFavorites = useCallback(() => {
    setFavoritesRefreshTrigger((prev) => prev + 1);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user,
      login,
      setUser,
      logout,
      loading,
      refreshFavorites,
      favoritesRefreshTrigger,
      notifications,
      addNotification,
      clearNotifications,
    }),
    [user, loading, refreshFavorites, favoritesRefreshTrigger, notifications],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
