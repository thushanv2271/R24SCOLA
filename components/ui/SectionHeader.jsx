import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";

// Extracted from both Profile screens' identical sectionHeader/sectionTitle.
// Optionally renders a right-aligned "See all"-style action, and accepts a
// style override for screens whose containers already provide the indent.
const SectionHeader = ({ icon, title, actionLabel, onActionPress, style }) => {
  const { colors } = useTheme() || {};
  const { width, fontScale } = useWindowDimensions();
  const stacked = !!actionLabel && (fontScale > 1.4 || (width < 360 && (title.length > 24 || actionLabel.length > 9)));
  const actionColor = colors?.tabIconSelected || colors?.accent || "#004aad";
  return (
    <View style={[styles.row, stacked && styles.stacked, style]}>
      <View style={styles.heading}>
        {icon}
        <Text accessibilityRole="header" style={[styles.title, icon && styles.titleWithIcon, colors && { color: colors.textPrimary }]}>
          {title}
        </Text>
      </View>
      {actionLabel && onActionPress ? (
        <TouchableOpacity
          style={[styles.action, stacked && { alignSelf: "flex-end" }]}
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={`${actionLabel} ${title}`}
        >
          <Text style={[styles.actionText, { color: actionColor }]}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color={actionColor} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",

    color: "#111827",
  },
  heading: { flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 },
  stacked: { flexDirection: "column", alignItems: "stretch" },
  titleWithIcon: { marginLeft: 12 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 48,
    paddingLeft: 12,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",

    color: "#004aad",
  },
});

export default SectionHeader;
