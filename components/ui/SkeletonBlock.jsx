import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../ThemeContext";

// Pulsing placeholder rectangle. Holds still when reduced motion is on.
const SkeletonBlock = ({ style }) => {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const opacity = useSharedValue(0.55);

  useEffect(() => {
    if (reduce) {
      opacity.value = 0.7;
      return;
    }
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 750 }), withTiming(0.5, { duration: 750 })),
      -1,
    );
  }, [reduce, opacity]);

  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ backgroundColor: colors.surfaceAlt, borderRadius: 10 }, style, animated]} />;
};

export default SkeletonBlock;
