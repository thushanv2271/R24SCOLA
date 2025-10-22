/**
 * Error Message Component
 * Displays user-friendly error messages
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  type ViewStyle,
} from 'react';

// ============================================================================
// Types
// ============================================================================

interface ErrorMessageProps {
  error: string | Error;
  onRetry?: () => void;
  retryText?: string;
  style?: ViewStyle;
  variant?: 'inline' | 'card' | 'banner';
}

// ============================================================================
// Component
// ============================================================================

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  retryText = 'Try Again',
  style,
  variant = 'card',
}) => {
  const errorMessage = typeof error === 'string' ? error : error.message;

  const containerStyle = [
    styles.container,
    variant === 'inline' && styles.inline,
    variant === 'card' && styles.card,
    variant === 'banner' && styles.banner,
    style,
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{errorMessage}</Text>
      </View>

      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  inline: {
    backgroundColor: 'transparent',
    padding: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  banner: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: '#d32f2f',
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#f44336',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ErrorMessage;
