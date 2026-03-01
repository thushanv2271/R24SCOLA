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

interface AnimatedTabIconProps {
  name: any;
  size: number;
  color: string;
  focused: boolean;
}

export function AnimatedTabIcon({
  name,
  size,
  color,
  focused,
}: AnimatedTabIconProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.2, {
        damping: 8,
        mass: 1,
        overshootClamping: false,
      });
      rotation.value = withSpring(12, {
        damping: 8,
        mass: 1,
      });
    } else {
      scale.value = withSpring(1, {
        damping: 8,
        mass: 1,
      });
      rotation.value = withSpring(0, {
        damping: 8,
        mass: 1,
      });
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
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
