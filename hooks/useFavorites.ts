/**
 * Custom Hook for Favorites Management
 */

import { useState, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { addToFavorites, removeFromFavorites } from '@/services/userService';

interface UseFavoritesReturn {
  favorites: string[];
  isFavorite: (scholarshipId: string) => boolean;
  addFavorite: (scholarshipId: string) => Promise<void>;
  removeFavorite: (scholarshipId: string) => Promise<void>;
  toggleFavorite: (scholarshipId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for managing scholarship favorites
 */
export const useFavorites = (): UseFavoritesReturn => {
  const { user, updateUser } = useAuth();
  const { favorites, isFavorite: checkFavorite } = useUser();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Add scholarship to favorites
   */
  const addFavorite = useCallback(
    async (scholarshipId: string) => {
      if (!user) {
        throw new Error('User must be logged in to add favorites');
      }

      try {
        setLoading(true);
        setError(null);

        await addToFavorites(user.id, scholarshipId);

        // Update local state
        const newFavorites = [...favorites, scholarshipId];
        await updateUser({ favoriteScholarships: newFavorites });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to add favorite';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, favorites, updateUser]
  );

  /**
   * Remove scholarship from favorites
   */
  const removeFavorite = useCallback(
    async (scholarshipId: string) => {
      if (!user) {
        throw new Error('User must be logged in to remove favorites');
      }

      try {
        setLoading(true);
        setError(null);

        await removeFromFavorites(user.id, scholarshipId);

        // Update local state
        const newFavorites = favorites.filter((id) => id !== scholarshipId);
        await updateUser({ favoriteScholarships: newFavorites });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to remove favorite';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, favorites, updateUser]
  );

  /**
   * Toggle favorite status
   */
  const toggleFavorite = useCallback(
    async (scholarshipId: string) => {
      if (checkFavorite(scholarshipId)) {
        await removeFavorite(scholarshipId);
      } else {
        await addFavorite(scholarshipId);
      }
    },
    [checkFavorite, addFavorite, removeFavorite]
  );

  return {
    favorites,
    isFavorite: checkFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    loading,
    error,
  };
};

export default useFavorites;
