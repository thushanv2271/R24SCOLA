import React, { useCallback, useEffect, useState } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { isHapticsEnabled } from "../../utils/feedback";

// Shared motion kit. Everything runs on the UI thread (Reanimated) and honours
// the system "reduce motion" setting.

let Haptics = null;
try {
  Haptics = require("expo-haptics");
} catch (e) {
  Haptics = null;
}

export const SPRING = { damping: 18, stiffness: 240, mass: 0.8 };
export const SPRING_SOFT = { damping: 16, stiffness: 160, mass: 0.9 };
// No-overshoot press feedback, for screens that want calm motion.
const SMOOTH_PRESS = { duration: 140, easing: Easing.out(Easing.quad) };

export const haptic = (kind = "light") => {
  if (!Haptics || !isHapticsEnabled()) return;
  try {
    let result;
    if (kind === "success") result = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (kind === "error") result = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (kind === "select") result = Haptics.selectionAsync();
    else result = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Builds made before expo-haptics was added reject here; that is fine.
    result?.catch?.(() => {});
  } catch (e) {
    // Haptics are a nicety; never let them break an action.
  }
};

// Pressable that springs down on touch.
export const PressableScale = ({
  scaleTo = 0.94,
  smooth = false,
  feedback = false,
  onPress,
  onPressIn,
  onPressOut,
  style,
  containerStyle,
  children,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      {...rest}
      style={containerStyle}
      onPressIn={(e) => {
        if (!reduce) scale.value = smooth ? withTiming(scaleTo, SMOOTH_PRESS) : withSpring(scaleTo, SPRING);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = smooth ? withTiming(1, SMOOTH_PRESS) : withSpring(1, SPRING);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (feedback) haptic("light");
        onPress?.(e);
      }}
    >
      <Animated.View style={[style, animated]}>{children}</Animated.View>
    </Pressable>
  );
};

// Quick scale "pop" whenever `trigger` changes (badge counts, hearts, ...).
export const Pop = ({ trigger, style, children, from = 1.2 }) => {
  const scale = useSharedValue(1);
  const reduce = useReducedMotion();
  const first = React.useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    scale.value = from;
    scale.value = withSpring(1, { damping: 14, stiffness: 260, mass: 0.7 });
  }, [trigger]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
};

// Horizontal shake for invalid input. `const { shakeStyle, shake } = useShake()`.
export const useShake = () => {
  const x = useSharedValue(0);
  const reduce = useReducedMotion();
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const shake = useCallback(() => {
    haptic("error");
    if (reduce) return;
    x.value = withSequence(
      withTiming(-6, { duration: 60 }),
      withTiming(6, { duration: 100 }),
      withTiming(-4, { duration: 90 }),
      withTiming(4, { duration: 80 }),
      withTiming(0, { duration: 55 }),
    );
  }, [reduce]);
  return { shakeStyle, shake };
};

// Counts from the previous value up (or down) to `target`.
export const useCountUp = (target, duration = 700) => {
  const [value, setValue] = useState(Number.isFinite(target) ? target : 0);
  const from = React.useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const to = Number.isFinite(target) ? target : 0;
    if (reduce || from.current === to) {
      from.current = to;
      setValue(to);
      return;
    }
    const start = from.current;
    const t0 = Date.now();
    let raf;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setValue(Math.round(start + (to - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = to;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

// Scroll handler that slides a header away as a list scrolls down and brings it
// back on scroll up (like diffClamp, but on the UI thread and with a snap to
// fully shown/hidden when the finger lifts).
export const useCollapseScroll = (collapse, collapseMax) => {
  const lastY = useSharedValue(0);
  return useAnimatedScrollHandler({
    onScroll: (e) => {
      const y = Math.max(0, e.contentOffset.y);
      if (collapse) {
        const next = collapse.value + (y - lastY.value);
        collapse.value = Math.min(Math.max(next, 0), collapseMax.value);
      }
      lastY.value = y;
    },
    onEndDrag: (e) => {
      if (collapse && e.contentOffset.y > collapseMax.value) {
        collapse.value = withTiming(collapse.value > collapseMax.value / 2 ? collapseMax.value : 0, { duration: 180 });
      }
    },
    onMomentumEnd: (e) => {
      if (collapse && e.contentOffset.y > collapseMax.value) {
        collapse.value = withTiming(collapse.value > collapseMax.value / 2 ? collapseMax.value : 0, { duration: 180 });
      }
    },
  });
};
