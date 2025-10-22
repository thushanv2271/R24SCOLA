/**
 * Unified Scholarship Service
 * Replaces 24 duplicate scholarship fetch services
 */

import { apiClient } from '@/utils/apiClient';
import { API_ENDPOINTS, MAJOR_MAPPINGS, type MajorKey } from '@/config/api';
import type { Scholarship, ScholarshipFilters, PaginatedResponse } from '@/types';

/**
 * Fetch all scholarships
 */
export const fetchAllScholarships = async (): Promise<Scholarship[]> => {
  try {
    const data = await apiClient.get<Scholarship[]>(API_ENDPOINTS.SCHOLARSHIPS);
    return data;
  } catch (error) {
    console.error('Error fetching scholarships:', error);
    throw new Error('Could not fetch scholarship data. Please try again later.');
  }
};

/**
 * Fetch scholarships by major
 */
export const fetchScholarshipsByMajor = async (
  major: MajorKey | string
): Promise<Scholarship[]> => {
  try {
    // Map major to API format
    const apiMajor = major in MAJOR_MAPPINGS
      ? MAJOR_MAPPINGS[major as MajorKey]
      : major.toLowerCase();

    const data = await apiClient.get<Scholarship[]>(
      API_ENDPOINTS.SCHOLARSHIPS_BY_MAJOR(apiMajor)
    );
    return data;
  } catch (error) {
    console.error(`Error fetching scholarships for major "${major}":`, error);
    throw new Error(
      `Could not fetch ${major} scholarships. Please try again later.`
    );
  }
};

/**
 * Fetch scholarship by ID
 */
export const fetchScholarshipById = async (
  id: string
): Promise<Scholarship> => {
  try {
    const data = await apiClient.get<Scholarship>(
      API_ENDPOINTS.SCHOLARSHIP_BY_ID(id)
    );
    return data;
  } catch (error) {
    console.error(`Error fetching scholarship ${id}:`, error);
    throw new Error('Could not fetch scholarship details. Please try again later.');
  }
};

/**
 * Filter scholarships locally (client-side filtering)
 */
export const filterScholarships = (
  scholarships: Scholarship[],
  filters: ScholarshipFilters
): Scholarship[] => {
  return scholarships.filter((scholarship) => {
    // Filter by level
    if (filters.level && filters.level.length > 0) {
      if (!filters.level.includes(scholarship.level)) {
        return false;
      }
    }

    // Filter by major
    if (filters.major && filters.major.length > 0) {
      if (!filters.major.includes(scholarship.major)) {
        return false;
      }
    }

    // Filter by country
    if (filters.country && filters.country.length > 0) {
      if (!filters.country.includes(scholarship.country)) {
        return false;
      }
    }

    // Filter by amount
    if (filters.minAmount && scholarship.amount) {
      if (scholarship.amount < filters.minAmount) {
        return false;
      }
    }

    if (filters.maxAmount && scholarship.amount) {
      if (scholarship.amount > filters.maxAmount) {
        return false;
      }
    }

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(scholarship.status)) {
        return false;
      }
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchableText = `${scholarship.title} ${scholarship.description} ${scholarship.university} ${scholarship.country}`.toLowerCase();
      if (!searchableText.includes(searchLower)) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Sort scholarships
 */
export const sortScholarships = (
  scholarships: Scholarship[],
  sortBy: 'deadline' | 'amount' | 'title' | 'createdAt',
  order: 'asc' | 'desc' = 'asc'
): Scholarship[] => {
  return [...scholarships].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'deadline':
        comparison =
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        break;
      case 'amount':
        comparison = (a.amount || 0) - (b.amount || 0);
        break;
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'createdAt':
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};

/**
 * Get featured scholarships
 */
export const getFeaturedScholarships = async (): Promise<Scholarship[]> => {
  try {
    const scholarships = await fetchAllScholarships();
    return scholarships.filter((s) => s.isFeatured);
  } catch (error) {
    console.error('Error fetching featured scholarships:', error);
    throw new Error('Could not fetch featured scholarships. Please try again later.');
  }
};

/**
 * Search scholarships
 */
export const searchScholarships = async (
  query: string
): Promise<Scholarship[]> => {
  try {
    const scholarships = await fetchAllScholarships();
    return filterScholarships(scholarships, { search: query });
  } catch (error) {
    console.error('Error searching scholarships:', error);
    throw new Error('Could not search scholarships. Please try again later.');
  }
};

// ============================================================================
// Legacy function exports for backward compatibility
// These maintain the old API while using the new unified service
// ============================================================================

/**
 * @deprecated Use fetchScholarshipsByMajor('Chemistry') instead
 */
export const fetchChemistryScholarships = () =>
  fetchScholarshipsByMajor('Chemistry');

/**
 * @deprecated Use fetchScholarshipsByMajor('Computer Science') instead
 */
export const fetchComputerScienceScholarships = () =>
  fetchScholarshipsByMajor('Computer Science');

/**
 * @deprecated Use fetchScholarshipsByMajor('Business') instead
 */
export const fetchBusinessScholarships = () =>
  fetchScholarshipsByMajor('Business');

/**
 * @deprecated Use fetchScholarshipsByMajor('Engineering') instead
 */
export const fetchEngineeringScholarships = () =>
  fetchScholarshipsByMajor('Engineering');

/**
 * @deprecated Use fetchScholarshipsByMajor('Health Science') instead
 */
export const fetchHealthScienceScholarships = () =>
  fetchScholarshipsByMajor('Health Science');

/**
 * @deprecated Use fetchScholarshipsByMajor('Natural Science') instead
 */
export const fetchNaturalScienceScholarships = () =>
  fetchScholarshipsByMajor('Natural Science');

/**
 * @deprecated Use fetchScholarshipsByMajor('Statistics') instead
 */
export const fetchStatisticsScholarships = () =>
  fetchScholarshipsByMajor('Statistics');

// Default export
export default {
  fetchAllScholarships,
  fetchScholarshipsByMajor,
  fetchScholarshipById,
  filterScholarships,
  sortScholarships,
  getFeaturedScholarships,
  searchScholarships,
};
