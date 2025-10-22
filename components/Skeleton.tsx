/**
 * Skeleton Loading Component
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  type ViewStyle,
} from 'react-native';

// ============================================================================
// Types
// ============================================================================

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  variant?: 'text' | 'rect' | 'circle';
}

// ============================================================================
// Component
// ============================================================================

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  variant = 'rect',
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [opacity]);

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'text':
        return { height: 16, borderRadius: 4 };
      case 'circle':
        return {
          width: typeof width === 'number' ? width : 50,
          height: typeof height === 'number' ? height : 50,
          borderRadius:
            (typeof width === 'number' ? width : 50) / 2,
        };
      case 'rect':
      default:
        return { borderRadius };
    }
  };

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, opacity },
        getVariantStyle(),
        style,
      ]}
    />
  );
};

// ============================================================================
// Pre-built Skeleton Components
// ============================================================================

export const SkeletonText: React.FC<{ lines?: number; style?: ViewStyle }> = ({
  lines = 3,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: lines }).map((_, index) => (
      <Skeleton
        key={index}
        variant="text"
        width={index === lines - 1 ? '60%' : '100%'}
        style={{ marginBottom: 8 }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => (
  <View style={[styles.card, style]}>
    <Skeleton width="100%" height={200} style={{ marginBottom: 12 }} />
    <Skeleton width="80%" height={24} style={{ marginBottom: 8 }} />
    <Skeleton width="100%" height={16} style={{ marginBottom: 8 }} />
    <Skeleton width="60%" height={16} />
  </View>
);

export const SkeletonList: React.FC<{ count?: number; style?: ViewStyle }> = ({
  count = 3,
  style,
}) => (
  <View style={style}>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonCard key={index} style={{ marginBottom: 16 }} />
    ))}
  </View>
);

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e0e0e0',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Skeleton;
