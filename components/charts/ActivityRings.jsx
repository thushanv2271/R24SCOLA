import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);


// Each metric keeps its caption below the circle. The grid uses fewer columns
// on narrow screens or with larger text so values and labels have room to wrap.
const Ring = ({ size, strokeWidth, percent, color, trackColor, delay = 0 }) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, percent || 0));
  const reduce = useReducedMotion();
  const sweep = useSharedValue(reduce ? 1 : 0);

  // The arc grows from empty to its value on mount and whenever it changes.
  useEffect(() => {
    sweep.value = reduce ? 1 : 0;
    if (!reduce) sweep.value = withDelay(delay, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [clamped, reduce, delay, sweep]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - (clamped / 100) * sweep.value),
  }));

  return (
    <Svg width={size} height={size}>
      <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
      {clamped > 0 && (
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={[circumference, circumference]}
          animatedProps={animatedProps}
          rotation={-90}
          origin={`${center}, ${center}`}
          fill="none"
        />
      )}
    </Svg>
  );
};

const ActivityRings = ({
  rings = [],
  size = 54,
  strokeWidth = 6,
  trackColor = "rgba(255,255,255,0.28)",
  textColor = "#fff",
  subTextColor = "rgba(255,255,255,0.75)",
  style,
}) => {
  const [availableWidth, setAvailableWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const columns = fontScale > 1.6 ? 1 : availableWidth >= 360 && fontScale <= 1.2 ? 4 : 2;
  const itemWidth = availableWidth ? (availableWidth - (columns - 1) * 12) / columns : "47%";
  return (
  <View style={[styles.row, style]} onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}>
    {rings.map((ring, index) => (
      <TouchableOpacity
        key={ring.key ?? index}
        style={[styles.item, { width: itemWidth }]}
        activeOpacity={0.8}
        disabled={!ring.onPress}
        onPress={ring.onPress}
        accessibilityRole={ring.onPress ? "button" : "text"}
        accessibilityLabel={`${ring.label}: ${ring.valueText}`}
      >
        {ring.icon ? (
          <View style={[styles.metricIcon, { width: size, height: size, backgroundColor: ring.trackColor || trackColor }]}>
            <Ionicons name={ring.icon} size={24} color={ring.color} />
          </View>
        ) : <Ring
          size={size}
          strokeWidth={strokeWidth}
          percent={ring.percent}
          color={ring.color}
          trackColor={ring.trackColor || trackColor}
          delay={index * 120}
        />}
        <Text
          style={[styles.value, { color: textColor }]}
        >
          {ring.valueText}
        </Text>
        <Text style={[styles.label, { color: subTextColor }]}>
          {ring.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  item: {
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",

    marginTop: 2,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",

  },
  metricIcon: { borderRadius: 27, alignItems: "center", justifyContent: "center" },
});

export default ActivityRings;
