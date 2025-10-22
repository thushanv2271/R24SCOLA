/**
 * API Configuration and Constants
 */

// Base API URL - should be moved to environment variables in production
export const API_CONFIG = {
  BASE_URL:
    process.env.EXPO_PUBLIC_API_URL ||
    'https://webapplication2-old-pond-3577.fly.dev/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Scholarships
  SCHOLARSHIPS: '/Scholarships',
  SCHOLARSHIPS_BY_MAJOR: (major: string) => `/Scholarships/filterByMajor/${major}`,
  SCHOLARSHIP_BY_ID: (id: string) => `/Scholarships/${id}`,

  // Users
  USERS: '/Users',
  USER_BY_EMAIL: (email: string) => `/Users/${email}`,
  USER_BY_ID: (id: string) => `/Users/${id}`,

  // Jobs
  JOBS: '/Jobs',
  JOB_BY_ID: (id: string) => `/Jobs/${id}`,

  // Email
  SEND_EMAIL: '/Email/send',
} as const;

// Major mappings for scholarships
export const MAJOR_MAPPINGS = {
  Chemistry: 'chemistry',
  'Computer Science': 'software engineering',
  Business: 'business',
  Engineering: 'engineering',
  'Health Science': 'health science',
  'Natural Science': 'natural science',
  Statistics: 'statistics',
} as const;

export type MajorKey = keyof typeof MAJOR_MAPPINGS;
