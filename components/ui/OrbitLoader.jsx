import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../ThemeContext";

const W = 168;
const H = 120;
const TILE = 42;
const RX = 62;
const RY = 20;
const TWO_PI = Math.PI * 2;

const ITEMS = [
  { icon: "school", tint: "accent" },
  { icon: "document-text", tint: "#f59e0b" },
  { icon: "briefcase", tint: "success" },
  { icon: "paper-plane", tint: "#a855f7" },
];

// Fake-3D carousel: each tile rides a tilted ellipse around a glowing hub.
// Tiles at the front are larger/opaque, tiles at the back are smaller/faded,
// so the scene reads as a ring of scholarship + job items turning in depth.
// Only transform/opacity are animated (no zIndex, shadows or elevation) so the
// whole thing stays on the UI thread and texture-cached. The tiles never
// overlap on the ellipse, so depth ordering is not needed.
const OrbitTile = ({ item, index, angle, colors }) => {
  const tint = item.tint === "accent" ? colors.accent : item.tint === "success" ? colors.success : item.tint;
  const offset = (index / ITEMS.length) * TWO_PI;

  const style = useAnimatedStyle(() => {
    const a = angle.value + offset;
    const depth = (Math.cos(a) + 1) / 2;
    return {
      opacity: 0.4 + 0.6 * depth,
      transform: [
        { translateX: Math.sin(a) * RX },
        { translateY: Math.cos(a) * RY },
        { scale: 0.62 + 0.5 * depth },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.tile,
        { backgroundColor: colors.surface, borderColor: tint },
        style,
      ]}
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
    >
      <Ionicons name={item.icon} size={21} color={tint} />
    </Animated.View>
  );
};

const OrbitLoader = () => {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const angle = useSharedValue(0.6);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduce) return undefined;
    angle.value = withRepeat(withTiming(TWO_PI + 0.6, { duration: 5200, easing: Easing.linear }), -1);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1100, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return undefined;
  }, [reduce, angle, pulse]);

  const hubStyle = useAnimatedStyle(() => ({
    opacity: 0.22 - pulse.value * 0.1,
    transform: [{ scale: 0.9 + pulse.value * 0.35 }],
  }));

  return (
    <View style={styles.stage} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={[styles.hub, { backgroundColor: colors.accent }, hubStyle]}
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
      />
      <View style={[styles.orbit, { borderColor: colors.border }]} />
      {ITEMS.map((item, i) => (
        <OrbitTile key={item.icon} item={item} index={i} angle={angle} colors={colors} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  stage: {
    width: W,
    height: H,
    alignItems: "center",
    justifyContent: "center",
  },
  hub: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  orbit: {
    position: "absolute",
    width: RX * 2,
    height: RX * 2,
    borderRadius: RX,
    borderWidth: 1.5,
    opacity: 0.6,
    transform: [{ scaleY: RY / RX }],
  },
  tile: {
    position: "absolute",
    width: TILE,
    height: TILE,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default OrbitLoader;
