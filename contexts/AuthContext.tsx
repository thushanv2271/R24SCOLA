/**
 * Authentication Context - Refactored with TypeScript and Best Practices
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, AuthState } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface AuthContextValue extends AuthState {
  login: (userData: User, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ============================================================================
// Constants
// ============================================================================

const USER_DATA_KEY = '@scola:userData';
const AUTH_TOKEN_KEY = '@scola:authToken';

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load user data from AsyncStorage on mount
   */
  useEffect(() => {
    loadUserData();
  }, []);

  /**
   * Load user data from storage
   */
  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const storedUser = await AsyncStorage.getItem(USER_DATA_KEY);

      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load user data';
      console.error('Error loading user data:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login user and store data
   */
  const login = useCallback(
    async (userData: User, rememberMe: boolean = true) => {
      try {
        setError(null);
        setUser(userData);

        if (rememberMe) {
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Login failed';
        console.error('Error during login:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    []
  );

  /**
   * Logout user and clear data
   */
  const logout = useCallback(async () => {
    try {
      setError(null);
      setUser(null);

      // Clear all auth-related data
      await Promise.all([
        AsyncStorage.removeItem(USER_DATA_KEY),
        AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      console.error('Error during logout:', err);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Update user data
   */
  const updateUser = useCallback(
    async (userData: Partial<User>) => {
      try {
        setError(null);

        if (!user) {
          throw new Error('No user logged in');
        }

        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);

        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Update failed';
        console.error('Error updating user:', err);
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [user]
  );

  /**
   * Refresh user data (reload from storage)
   */
  const refreshUser = useCallback(async () => {
    await loadUserData();
  }, [loadUserData]);

  /**
   * Memoized context value to prevent unnecessary re-renders
   */
  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, isLoading, error, login, logout, updateUser, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to use auth context
 * @throws Error if used outside of AuthProvider
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// Export context for advanced use cases
export { AuthContext };
