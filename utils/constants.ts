/**
 * Application Constants
 */

// ============================================================================
// Storage Keys
// ============================================================================

export const STORAGE_KEYS = {
  USER_DATA: '@scola:userData',
  AUTH_TOKEN: '@scola:authToken',
  THEME: '@scola:theme',
  LANGUAGE: '@scola:language',
  ONBOARDING_COMPLETED: '@scola:onboardingCompleted',
  FAVORITES: '@scola:favorites',
  SEARCH_HISTORY: '@scola:searchHistory',
} as const;

// ============================================================================
// App Configuration
// ============================================================================

export const APP_CONFIG = {
  NAME: 'Scola',
  VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@scola.app',
  TERMS_URL: 'https://scola.app/terms',
  PRIVACY_URL: 'https://scola.app/privacy',
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================================================
// Animation Durations
// ============================================================================

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// ============================================================================
// Validation Constants
// ============================================================================

export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
} as const;

// ============================================================================
// Date Formats
// ============================================================================

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  FULL: 'MMMM DD, YYYY',
  SHORT: 'MM/DD/YY',
  ISO: 'YYYY-MM-DD',
} as const;

// ============================================================================
// Scholarship Constants
// ============================================================================

export const SCHOLARSHIP_LEVELS = ['Bachelors', 'Masters', 'PhD'] as const;

export const SCHOLARSHIP_MAJORS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Chemistry',
  'Health Science',
  'Natural Science',
  'Statistics',
  'All',
] as const;

export const SCHOLARSHIP_STATUS = ['Open', 'Closed', 'Coming Soon'] as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  NETWORK: 'Unable to connect. Please check your internet connection.',
  GENERIC: 'Something went wrong. Please try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  LOGOUT: 'You have been logged out successfully.',
  REGISTRATION: 'Account created successfully!',
  UPDATE: 'Changes saved successfully!',
  FAVORITE_ADDED: 'Added to favorites!',
  FAVORITE_REMOVED: 'Removed from favorites.',
} as const;

export default {
  STORAGE_KEYS,
  APP_CONFIG,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  FONT_WEIGHTS,
  ANIMATION_DURATION,
  VALIDATION,
  DATE_FORMATS,
  SCHOLARSHIP_LEVELS,
  SCHOLARSHIP_MAJORS,
  SCHOLARSHIP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
