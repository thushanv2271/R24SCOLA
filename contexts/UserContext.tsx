/**
 * User Context - For user-specific data and preferences
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import type { Scholarship } from '@/types';

// ============================================================================
// Types
// ============================================================================

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
}

interface UserContextValue {
  favorites: string[];
  appliedScholarships: string[];
  preferences: UserPreferences;
  addFavorite: (scholarshipId: string) => void;
  removeFavorite: (scholarshipId: string) => void;
  isFavorite: (scholarshipId: string) => boolean;
  markAsApplied: (scholarshipId: string) => void;
  hasApplied: (scholarshipId: string) => boolean;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
}

// ============================================================================
// Default Values
// ============================================================================

const defaultPreferences: UserPreferences = {
  theme: 'auto',
  notifications: true,
  emailUpdates: true,
  language: 'en',
};

// ============================================================================
// Context
// ============================================================================

const UserContext = createContext<UserContextValue | undefined>(undefined);

// ============================================================================
// Provider Props
// ============================================================================

interface UserProviderProps {
  children: ReactNode;
}

// ============================================================================
// Provider Component
// ============================================================================

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { user, updateUser } = useAuth();

  const [preferences, setPreferences] = useState<UserPreferences>(
    defaultPreferences
  );

  /**
   * Get favorites from user or empty array
   */
  const favorites = useMemo(() => user?.favoriteScholarships || [], [user]);

  /**
   * Get applied scholarships from user or empty array
   */
  const appliedScholarships = useMemo(
    () => user?.appliedScholarships || [],
    [user]
  );

  /**
   * Add scholarship to favorites
   */
  const addFavorite = useCallback(
    (scholarshipId: string) => {
      if (!user) {
        console.warn('Cannot add favorite: No user logged in');
        return;
      }

      const currentFavorites = user.favoriteScholarships || [];

      if (!currentFavorites.includes(scholarshipId)) {
        const newFavorites = [...currentFavorites, scholarshipId];
        updateUser({ favoriteScholarships: newFavorites });
      }
    },
    [user, updateUser]
  );

  /**
   * Remove scholarship from favorites
   */
  const removeFavorite = useCallback(
    (scholarshipId: string) => {
      if (!user) {
        console.warn('Cannot remove favorite: No user logged in');
        return;
      }

      const currentFavorites = user.favoriteScholarships || [];
      const newFavorites = currentFavorites.filter((id) => id !== scholarshipId);

      updateUser({ favoriteScholarships: newFavorites });
    },
    [user, updateUser]
  );

  /**
   * Check if scholarship is in favorites
   */
  const isFavorite = useCallback(
    (scholarshipId: string): boolean => {
      return favorites.includes(scholarshipId);
    },
    [favorites]
  );

  /**
   * Mark scholarship as applied
   */
  const markAsApplied = useCallback(
    (scholarshipId: string) => {
      if (!user) {
        console.warn('Cannot mark as applied: No user logged in');
        return;
      }

      const currentApplied = user.appliedScholarships || [];

      if (!currentApplied.includes(scholarshipId)) {
        const newApplied = [...currentApplied, scholarshipId];
        updateUser({ appliedScholarships: newApplied });
      }
    },
    [user, updateUser]
  );

  /**
   * Check if user has applied to scholarship
   */
  const hasApplied = useCallback(
    (scholarshipId: string): boolean => {
      return appliedScholarships.includes(scholarshipId);
    },
    [appliedScholarships]
  );

  /**
   * Update user preferences
   */
  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setPreferences((current) => ({ ...current, ...prefs }));
  }, []);

  /**
   * Memoized context value
   */
  const value = useMemo(
    () => ({
      favorites,
      appliedScholarships,
      preferences,
      addFavorite,
      removeFavorite,
      isFavorite,
      markAsApplied,
      hasApplied,
      updatePreferences,
    }),
    [
      favorites,
      appliedScholarships,
      preferences,
      addFavorite,
      removeFavorite,
      isFavorite,
      markAsApplied,
      hasApplied,
      updatePreferences,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

/**
 * Custom hook to use user context
 * @throws Error if used outside of UserProvider
 */
export const useUser = (): UserContextValue => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return context;
};

// Export context for advanced use cases
export { UserContext };
