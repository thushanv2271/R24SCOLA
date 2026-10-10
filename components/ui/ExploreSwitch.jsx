import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../ThemeContext";
import { SPRING, haptic } from "./motion";

const SIZE = 38;

// Universities | Jobs: two separate round buttons. The selected one fills with
// the accent color and lifts slightly; the other stays an outlined circle.
// This is the one switch used on every screen (Explore, Favourites, Custom
// Mail, Home, Categories) so it looks and behaves the same everywhere.
const Circle = ({ icon, selected, onPress, label, colors, onDark }) => {
  const reduce = useReducedMotion();
  const sel = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    sel.value = reduce ? withTiming(target, { duration: 0 }) : withSpring(target, SPRING);
  }, [selected, reduce, sel]);

  // On a dark/brand background the selected circle turns white and the idle
  // ones become translucent outlines.
  const rest = onDark ? "rgba(255,255,255,0.14)" : colors.surface;
  const restBorder = onDark ? "rgba(255,255,255,0.4)" : colors.border;
  const on = onDark ? "#ffffff" : colors.accent;

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [rest, on]),
    borderColor: interpolateColor(sel.value, [0, 1], [restBorder, on]),
    transform: [{ scale: 1 + sel.value * 0.06 }],
  }));

  const iconColor = selected ? (onDark ? colors.tabBarAccent : "#fff") : onDark ? "#fff" : colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
    >
      <Animated.View style={[styles.circle, animatedStyle]}>
        <Ionicons name={icon} size={19} color={iconColor} />
      </Animated.View>
    </Pressable>
  );
};

// `sides` names the two values (default Explore's scholarships/jobs; Home and
// Categories use universities/companies). `caption` shows the chosen name on
// the left of the row, the way Explore's title does.
const ExploreSwitch = ({
  value,
  onChange,
  labels,
  sides = ["scholarships", "jobs"],
  onDark = false,
  caption,
  style,
}) => {
  const { colors } = useTheme();
  const [first, second] = sides;
  const isSecond = value === second;

  const select = (side) => {
    if (side === value) return;
    haptic("light");
    onChange(side);
  };

  const circles = (
    <View style={styles.row} accessibilityRole="radiogroup">
      <Circle
        icon="school"
        selected={!isSecond}
        label={labels[first]}
        colors={colors}
        onDark={onDark}
        onPress={() => select(first)}
      />
      <Circle
        icon="briefcase"
        selected={isSecond}
        label={labels[second]}
        colors={colors}
        onDark={onDark}
        onPress={() => select(second)}
      />
    </View>
  );

  if (caption == null) return style ? <View style={style}>{circles}</View> : circles;

  return (
    <View style={[styles.captionRow, style]}>
      <Text
        style={[styles.caption, { color: onDark ? "#fff" : colors.textPrimary }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.3}
      >
        {caption}
      </Text>
      {circles}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  captionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  caption: { flex: 1, fontSize: 18, lineHeight: 26, fontWeight: "800" },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default ExploreSwitch;
