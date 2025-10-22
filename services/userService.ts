/**
 * User Service - Refactored with TypeScript and better error handling
 */

import { apiClient } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import type { User } from '@/types';

/**
 * Fetch user by email
 */
export const fetchUserByEmail = async (email: string): Promise<User> => {
  try {
    const data = await apiClient.get<User>(API_ENDPOINTS.USER_BY_EMAIL(email));
    return data;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    throw new Error('Could not fetch user data. Please try again later.');
  }
};

/**
 * Fetch user by ID
 */
export const fetchUserById = async (userId: string): Promise<User> => {
  try {
    const data = await apiClient.get<User>(API_ENDPOINTS.USER_BY_ID(userId));
    return data;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw new Error('Could not fetch user data. Please try again later.');
  }
};

/**
 * Update user data
 */
export const updateUser = async (
  userId: string,
  userData: Partial<User>,
  token?: string
): Promise<User> => {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const data = await apiClient.put<User>(
      API_ENDPOINTS.USER_BY_ID(userId),
      userData,
      { headers }
    );

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Could not update user data. Please try again later.');
  }
};

/**
 * Add scholarship to favorites
 */
export const addToFavorites = async (
  userId: string,
  scholarshipId: string
): Promise<User> => {
  try {
    // Fetch current user data
    const user = await fetchUserById(userId);

    // Add scholarship to favorites if not already there
    const favoriteScholarships = user.favoriteScholarships || [];
    if (!favoriteScholarships.includes(scholarshipId)) {
      favoriteScholarships.push(scholarshipId);
    }

    // Update user
    return await updateUser(userId, { favoriteScholarships });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw new Error('Could not add scholarship to favorites. Please try again later.');
  }
};

/**
 * Remove scholarship from favorites
 */
export const removeFromFavorites = async (
  userId: string,
  scholarshipId: string
): Promise<User> => {
  try {
    // Fetch current user data
    const user = await fetchUserById(userId);

    // Remove scholarship from favorites
    const favoriteScholarships = (user.favoriteScholarships || []).filter(
      (id) => id !== scholarshipId
    );

    // Update user
    return await updateUser(userId, { favoriteScholarships });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    throw new Error('Could not remove scholarship from favorites. Please try again later.');
  }
};

/**
 * Mark scholarship as applied
 */
export const markAsApplied = async (
  userId: string,
  scholarshipId: string
): Promise<User> => {
  try {
    // Fetch current user data
    const user = await fetchUserById(userId);

    // Add scholarship to applied list if not already there
    const appliedScholarships = user.appliedScholarships || [];
    if (!appliedScholarships.includes(scholarshipId)) {
      appliedScholarships.push(scholarshipId);
    }

    // Update user
    return await updateUser(userId, { appliedScholarships });
  } catch (error) {
    console.error('Error marking scholarship as applied:', error);
    throw new Error('Could not mark scholarship as applied. Please try again later.');
  }
};

/**
 * Check if user has applied to scholarship
 */
export const hasAppliedToScholarship = (
  user: User,
  scholarshipId: string
): boolean => {
  return (user.appliedScholarships || []).includes(scholarshipId);
};

/**
 * Check if scholarship is in favorites
 */
export const isScholarshipFavorite = (
  user: User,
  scholarshipId: string
): boolean => {
  return (user.favoriteScholarships || []).includes(scholarshipId);
};

// Default export
export default {
  fetchUserByEmail,
  fetchUserById,
  updateUser,
  addToFavorites,
  removeFromFavorites,
  markAsApplied,
  hasAppliedToScholarship,
  isScholarshipFavorite,
};
