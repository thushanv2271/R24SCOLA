import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BADGE_TONES } from "../tokens/colors";
import { useTheme } from "../ThemeContext";

// Extracted from both Profile screens' identical badge/badgeText pill.
const Badge = ({ label, tone = "neutral" }) => {
  const { colors: theme } = useTheme();
  const colors =
    BADGE_TONES[tone] || { bg: theme.surfaceAlt, text: theme.textSecondary };

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text numberOfLines={1} style={[styles.text, { color: colors.text }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
});

export default Badge;
