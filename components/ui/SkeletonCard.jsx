import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../ThemeContext";

// Pulsing placeholder matching the scholarship/job card silhouette —
// image banner, title line, subtitle line, tag pills.
const SkeletonCard = () => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity: pulse }]} />
      <View style={styles.body}>
        <Animated.View
          style={[styles.line, { width: "72%", opacity: pulse }]}
        />
        <Animated.View
          style={[styles.line, styles.lineThin, { width: "48%", opacity: pulse }]}
        />
        <View style={styles.pillRow}>
          <Animated.View style={[styles.pill, { opacity: pulse }]} />
          <Animated.View style={[styles.pill, { opacity: pulse }]} />
          <Animated.View style={[styles.pill, { opacity: pulse }]} />
        </View>
      </View>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  image: {
    width: "100%",
    height: 150,
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    padding: 16,
  },
  line: {
    height: 15,
    borderRadius: 7,
    backgroundColor: colors.surfaceAlt,
    marginBottom: 9,
  },
  lineThin: {
    height: 12,
  },
  pillRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  pill: {
    width: 68,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
});

export default SkeletonCard;
