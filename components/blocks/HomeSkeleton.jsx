import React from "react";
import { View, StyleSheet } from "react-native";
import SkeletonBlock from "../ui/SkeletonBlock";
import { useTheme } from "../ThemeContext";

// Placeholder for the data-driven Home sections (next step, progress) while
// the first load finishes.
const HomeSkeleton = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.block} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SkeletonBlock style={styles.title} />
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <SkeletonBlock style={styles.line} />
        <SkeletonBlock style={[styles.line, { width: "45%" }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  block: { marginTop: 24 },
  title: { width: 170, height: 22, marginBottom: 14 },
  card: { borderRadius: 20, padding: 16 },
  line: { height: 14, width: "75%", marginBottom: 10 },
});

export default HomeSkeleton;
