/**
 * Custom Hook for Scholarship Operations
 */

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllScholarships,
  fetchScholarshipsByMajor,
  fetchScholarshipById,
  filterScholarships,
  sortScholarships,
  getFeaturedScholarships,
} from '@/services/scholarshipService';
import type {
  Scholarship,
  ScholarshipFilters,
  ScholarshipMajor,
  LoadingState,
} from '@/types';

interface UseScholarshipsOptions {
  major?: ScholarshipMajor | string;
  filters?: ScholarshipFilters;
  autoFetch?: boolean;
}

interface UseScholarshipsReturn {
  scholarships: Scholarship[];
  filteredScholarships: Scholarship[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  applyFilters: (filters: ScholarshipFilters) => void;
  clearFilters: () => void;
  sort: (
    sortBy: 'deadline' | 'amount' | 'title' | 'createdAt',
    order?: 'asc' | 'desc'
  ) => void;
}

/**
 * Hook for fetching and managing scholarships
 */
export const useScholarships = (
  options: UseScholarshipsOptions = {}
): UseScholarshipsReturn => {
  const { major, filters: initialFilters, autoFetch = true } = options;

  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [filteredScholarships, setFilteredScholarships] = useState<Scholarship[]>(
    []
  );
  const [filters, setFilters] = useState<ScholarshipFilters>(
    initialFilters || {}
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch scholarships
   */
  const fetchScholarships = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = major
        ? await fetchScholarshipsByMajor(major)
        : await fetchAllScholarships();

      setScholarships(data);
      setFilteredScholarships(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch scholarships';
      setError(errorMessage);
      console.error('Error fetching scholarships:', err);
    } finally {
      setLoading(false);
    }
  }, [major]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      fetchScholarships();
    }
  }, [autoFetch, fetchScholarships]);

  /**
   * Apply filters whenever they change
   */
  useEffect(() => {
    if (scholarships.length > 0) {
      const filtered = filterScholarships(scholarships, filters);
      setFilteredScholarships(filtered);
    }
  }, [scholarships, filters]);

  /**
   * Apply filters
   */
  const applyFilters = useCallback((newFilters: ScholarshipFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  /**
   * Sort scholarships
   */
  const sort = useCallback(
    (
      sortBy: 'deadline' | 'amount' | 'title' | 'createdAt',
      order: 'asc' | 'desc' = 'asc'
    ) => {
      const sorted = sortScholarships(filteredScholarships, sortBy, order);
      setFilteredScholarships(sorted);
    },
    [filteredScholarships]
  );

  /**
   * Refresh scholarships
   */
  const refresh = useCallback(async () => {
    await fetchScholarships();
  }, [fetchScholarships]);

  return {
    scholarships,
    filteredScholarships,
    loading,
    error,
    refresh,
    applyFilters,
    clearFilters,
    sort,
  };
};

/**
 * Hook for fetching a single scholarship
 */
export const useScholarship = (id: string) => {
  const [scholarship, setScholarship] = useState<Scholarship | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScholarship = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const data = await fetchScholarshipById(id);
      setScholarship(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch scholarship';
      setError(errorMessage);
      console.error('Error fetching scholarship:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchScholarship();
  }, [fetchScholarship]);

  return {
    scholarship,
    loading,
    error,
    refresh: fetchScholarship,
  };
};

/**
 * Hook for featured scholarships
 */
export const useFeaturedScholarships = () => {
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatured = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getFeaturedScholarships();
      setScholarships(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch featured scholarships';
      setError(errorMessage);
      console.error('Error fetching featured scholarships:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  return {
    scholarships,
    loading,
    error,
    refresh: fetchFeatured,
  };
};

export default useScholarships;
