/**
 * Color Palette Constants
 * Centralized color definitions for design consistency
 * All blue shades are standardized to 2 primary colors
 */

export const COLORS = {
  // Primary Blues
  PRIMARY_DARK_BLUE: '#004aad',    // Main buttons, dark accents
  PRIMARY_BLUE: '#007bff',         // Links, secondary accents
  
  // Secondary Colors
  SUCCESS: '#10b981',               // Success states
  ERROR: '#ef4444',                 // Error states
  WARNING: '#f59e0b',               // Warning states
  
  // Neutral Colors
  WHITE: '#fff',
  BLACK: '#000',
  GRAY_LIGHT: '#f5f5f5',
  GRAY_MEDIUM: '#a5a4a4',
  GRAY_DARK: '#333',
  
  // Text Colors
  TEXT_PRIMARY: '#333',
  TEXT_SECONDARY: '#666',
  TEXT_TERTIARY: '#999',
  TEXT_MUTED: '#a5a4a4',
  
  // Background Colors
  BG_LIGHT: '#f5f5f5',
  BG_WHITE: '#fff',
  
  // Border Colors
  BORDER_LIGHT: '#e0e0e0',
  BORDER_MEDIUM: '#ddd',
  
  // Alert Colors
  ALERT_INFO_BG: '#dbeafe',
  ALERT_SUCCESS_BG: '#d1fae5',
  ALERT_ERROR_BG: '#fee2e2',
  ALERT_WARNING_BG: '#fef3c7',
};

// Legacy aliases for backward compatibility
export const BLUE_PRIMARY = COLORS.PRIMARY_DARK_BLUE;      // #004aad
export const BLUE_SECONDARY = COLORS.PRIMARY_BLUE;        // #007bff
export const BLUE_LOADING = COLORS.PRIMARY_BLUE;          // Changed from #0000ff to #007bff

export default COLORS;
