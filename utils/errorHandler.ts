/**
 * Error Handling Utilities
 */

import { Alert } from 'react-native';
import { ApiClientError } from './apiClient';

// ============================================================================
// Error Types
// ============================================================================

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN',
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK]:
    'Unable to connect to the server. Please check your internet connection.',
  [ErrorType.VALIDATION]:
    'The information provided is invalid. Please check your input.',
  [ErrorType.AUTHENTICATION]: 'Please log in to continue.',
  [ErrorType.AUTHORIZATION]: "You don't have permission to perform this action.",
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.SERVER]:
    'A server error occurred. Please try again later.',
  [ErrorType.UNKNOWN]: 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// Error Classification
// ============================================================================

/**
 * Classify error based on status code or error type
 */
export const classifyError = (error: unknown): ErrorType => {
  if (error instanceof ApiClientError) {
    const { statusCode } = error;

    if (statusCode === 401) {
      return ErrorType.AUTHENTICATION;
    }
    if (statusCode === 403) {
      return ErrorType.AUTHORIZATION;
    }
    if (statusCode === 404) {
      return ErrorType.NOT_FOUND;
    }
    if (statusCode === 422) {
      return ErrorType.VALIDATION;
    }
    if (statusCode >= 500) {
      return ErrorType.SERVER;
    }
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('connection')
    ) {
      return ErrorType.NETWORK;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
  }

  return ErrorType.UNKNOWN;
};

/**
 * Get user-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  // If error is already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If error has a message property, use it
  if (error instanceof Error) {
    // For ApiClientError, we might have a better message from the server
    if (error instanceof ApiClientError) {
      return error.message;
    }

    // Otherwise, classify the error and get appropriate message
    const errorType = classifyError(error);
    return ERROR_MESSAGES[errorType] || error.message;
  }

  // Default fallback
  return ERROR_MESSAGES[ErrorType.UNKNOWN];
};

/**
 * Show error alert to user
 */
export const showErrorAlert = (
  error: unknown,
  title: string = 'Error',
  onDismiss?: () => void
): void => {
  const message = getUserFriendlyErrorMessage(error);

  Alert.alert(title, message, [
    {
      text: 'OK',
      onPress: onDismiss,
    },
  ]);
};

/**
 * Log error for debugging
 */
export const logError = (
  error: unknown,
  context?: string,
  additionalData?: Record<string, unknown>
): void => {
  const errorType = classifyError(error);
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error('Error occurred:', {
    type: errorType,
    message,
    context,
    stack,
    ...additionalData,
  });

  // In production, you might want to send this to an error tracking service
  // e.g., Sentry, Bugsnag, etc.
};

/**
 * Handle error with logging and user notification
 */
export const handleError = (
  error: unknown,
  options: {
    context?: string;
    showAlert?: boolean;
    alertTitle?: string;
    onDismiss?: () => void;
    additionalData?: Record<string, unknown>;
  } = {}
): void => {
  const {
    context,
    showAlert = true,
    alertTitle = 'Error',
    onDismiss,
    additionalData,
  } = options;

  // Log the error
  logError(error, context, additionalData);

  // Show alert to user if requested
  if (showAlert) {
    showErrorAlert(error, alertTitle, onDismiss);
  }
};

/**
 * Retry function with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = Math.min(initialDelay * Math.pow(2, attempt), maxDelay);

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

export default {
  classifyError,
  getUserFriendlyErrorMessage,
  showErrorAlert,
  logError,
  handleError,
  retryWithBackoff,
};
