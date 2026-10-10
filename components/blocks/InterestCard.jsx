import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../ThemeContext";
import { PressableScale } from "../ui/motion";

const SMOOTH = { duration: 240, easing: Easing.out(Easing.cubic) };

// One option in the "Universities / Companies / Both" choice, used by the
// first-launch screen and the Settings picker. Selecting fills the card with
// the brand colour, lifts it, and pops a check badge in.
const ICONS = {
  universities: ["school"],
  companies: ["briefcase"],
  both: ["school", "briefcase"],
};

const InterestCard = ({ value, title, description, selected, onPress, index = 0, animateIn = true }) => {
  const { colors } = useTheme();
  const reduce = useReducedMotion();
  const sel = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    sel.value = reduce ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, SMOOTH);
  }, [selected, reduce, sel]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.surface, colors.tabBarAccent]),
    borderColor: interpolateColor(sel.value, [0, 1], [colors.border, colors.tabBarAccent]),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textPrimary, "#ffffff"]),
  }));
  const descStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textSecondary, "rgba(255,255,255,0.85)"]),
  }));
  const iconWrapStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.accentLight, "rgba(255,255,255,0.2)"]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: sel.value,
    transform: [{ scale: 0.7 + 0.3 * sel.value }],
  }));

  const icons = ICONS[value] || ICONS.both;

  return (
    <Animated.View
      entering={reduce || !animateIn ? undefined : FadeInDown.delay(200 + index * 110).duration(360)}
    >
      <PressableScale
        scaleTo={0.98}
        smooth
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${title}. ${description}`}
      >
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.View style={[styles.iconWrap, iconWrapStyle]}>
            {icons.map((name) => (
              <Ionicons
                key={name}
                name={name}
                size={icons.length > 1 ? 18 : 26}
                color={selected ? "#ffffff" : colors.accent}
                style={icons.length > 1 ? styles.pairIcon : undefined}
              />
            ))}
          </Animated.View>
          <View style={styles.text}>
            <Animated.Text style={[styles.title, titleStyle]}>{title}</Animated.Text>
            <Animated.Text style={[styles.description, descStyle]}>{description}</Animated.Text>
          </View>
          <Animated.View style={[styles.check, checkStyle]}>
            <Ionicons name="checkmark" size={16} color={colors.tabBarAccent} />
          </Animated.View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 84,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  pairIcon: { marginHorizontal: 1 },
  text: { flex: 1, marginHorizontal: 14 },
  title: { fontSize: 18, lineHeight: 24, fontWeight: "800" },
  description: { marginTop: 2, fontSize: 13, lineHeight: 18 },
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
});

export default InterestCard;
