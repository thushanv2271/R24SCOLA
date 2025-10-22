/**
 * Validation Utilities
 */

import { VALIDATION } from './constants';

// ============================================================================
// Email Validation
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return VALIDATION.EMAIL_REGEX.test(email.trim());
};

export const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

// ============================================================================
// Password Validation
// ============================================================================

export const isValidPassword = (password: string): boolean => {
  if (!password || typeof password !== 'string') {
    return false;
  }
  return password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
};

export const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`;
  }
  return undefined;
};

export const validatePasswordConfirmation = (
  password: string,
  confirmation: string
): string | undefined => {
  if (!confirmation) {
    return 'Please confirm your password';
  }
  if (password !== confirmation) {
    return 'Passwords do not match';
  }
  return undefined;
};

// ============================================================================
// Name Validation
// ============================================================================

export const isValidName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return (
    trimmed.length >= VALIDATION.NAME_MIN_LENGTH &&
    trimmed.length <= VALIDATION.NAME_MAX_LENGTH
  );
};

export const validateName = (name: string): string | undefined => {
  if (!name) {
    return 'Name is required';
  }
  if (!isValidName(name)) {
    return `Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`;
  }
  return undefined;
};

// ============================================================================
// Phone Validation
// ============================================================================

export const isValidPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  // Basic phone validation - can be customized based on requirements
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.trim());
};

export const validatePhone = (phone: string): string | undefined => {
  if (!phone) {
    return undefined; // Phone is optional
  }
  if (!isValidPhone(phone)) {
    return 'Please enter a valid phone number';
  }
  return undefined;
};

// ============================================================================
// Required Field Validation
// ============================================================================

export const validateRequired = (
  value: string | null | undefined,
  fieldName: string = 'This field'
): string | undefined => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return undefined;
};

// ============================================================================
// URL Validation
// ============================================================================

export const isValidURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateURL = (url: string): string | undefined => {
  if (!url) {
    return undefined; // URL is optional
  }
  if (!isValidURL(url)) {
    return 'Please enter a valid URL';
  }
  return undefined;
};

// ============================================================================
// Date Validation
// ============================================================================

export const isValidDate = (date: string | Date): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateFutureDate = (date: string | Date): string | undefined => {
  if (!date) {
    return 'Date is required';
  }
  if (!isValidDate(date)) {
    return 'Please enter a valid date';
  }
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (dateObj <= new Date()) {
    return 'Date must be in the future';
  }
  return undefined;
};

// ============================================================================
// Number Validation
// ============================================================================

export const isValidNumber = (value: string | number): boolean => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return !isNaN(num) && isFinite(num);
};

export const validateNumber = (
  value: string | number,
  fieldName: string = 'This field'
): string | undefined => {
  if (!value && value !== 0) {
    return `${fieldName} is required`;
  }
  if (!isValidNumber(value)) {
    return `${fieldName} must be a valid number`;
  }
  return undefined;
};

export const validateNumberRange = (
  value: string | number,
  min: number,
  max: number,
  fieldName: string = 'This field'
): string | undefined => {
  const numError = validateNumber(value, fieldName);
  if (numError) {
    return numError;
  }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num < min || num > max) {
    return `${fieldName} must be between ${min} and ${max}`;
  }
  return undefined;
};

export default {
  isValidEmail,
  validateEmail,
  isValidPassword,
  validatePassword,
  validatePasswordConfirmation,
  isValidName,
  validateName,
  isValidPhone,
  validatePhone,
  validateRequired,
  isValidURL,
  validateURL,
  isValidDate,
  validateFutureDate,
  isValidNumber,
  validateNumber,
  validateNumberRange,
};
