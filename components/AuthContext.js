import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0);

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
    } catch (error) {
      console.error("Error during login:", error);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem("userData");
    } catch (error) {
      console.error("Error during logout:", error);
    }
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
    }),
    [user, loading, refreshFavorites, favoritesRefreshTrigger],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
