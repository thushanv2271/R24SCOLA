import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { IconSymbol } from './ui/IconSymbol';

interface GooeyIconProps {
  name: any;
  size: number;
  color: string;
  focused: boolean;
}

export function GooeyIcon({
  name,
  size,
  color,
  focused,
}: GooeyIconProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.3, {
        damping: 8,
        mass: 0.8,
        overshootClamping: false,
      });
      opacity.value = withSpring(1, {
        damping: 8,
        mass: 1,
      });
    } else {
      scale.value = withSpring(1, {
        damping: 8,
        mass: 0.8,
      });
      opacity.value = withSpring(0.7, {
        damping: 8,
        mass: 1,
      });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <IconSymbol size={size} name={name} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
