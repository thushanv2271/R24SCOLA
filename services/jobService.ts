/**
 * Job Service - New unified service for IT jobs
 */

import { apiClient } from '@/utils/apiClient';
import { API_ENDPOINTS } from '@/config/api';
import type { Job } from '@/types';

/**
 * Fetch all jobs
 */
export const fetchAllJobs = async (): Promise<Job[]> => {
  try {
    const data = await apiClient.get<Job[]>(API_ENDPOINTS.JOBS);
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    throw new Error('Could not fetch job listings. Please try again later.');
  }
};

/**
 * Fetch job by ID
 */
export const fetchJobById = async (id: string): Promise<Job> => {
  try {
    const data = await apiClient.get<Job>(API_ENDPOINTS.JOB_BY_ID(id));
    return data;
  } catch (error) {
    console.error(`Error fetching job ${id}:`, error);
    throw new Error('Could not fetch job details. Please try again later.');
  }
};

/**
 * Filter jobs by type
 */
export const filterJobsByType = (
  jobs: Job[],
  type: Job['type']
): Job[] => {
  return jobs.filter((job) => job.type === type);
};

/**
 * Search jobs
 */
export const searchJobs = (jobs: Job[], query: string): Job[] => {
  const searchLower = query.toLowerCase();
  return jobs.filter((job) => {
    const searchableText = `${job.title} ${job.company} ${job.location} ${job.description}`.toLowerCase();
    return searchableText.includes(searchLower);
  });
};

// Default export
export default {
  fetchAllJobs,
  fetchJobById,
  filterJobsByType,
  searchJobs,
};
