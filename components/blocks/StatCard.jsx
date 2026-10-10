import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CARD as CARD_SHADOW } from "../tokens/shadows";
import { useTheme } from "../ThemeContext";
import IconBadge from "../ui/IconBadge";

// Extracted from both Profile screens' identical
// statCard/statIcon/statContent/statLabel/statValue.
const StatCard = ({ icon, label, value, iconBackgroundColor = "#f0f9ff" }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <IconBadge size={56} backgroundColor={iconBackgroundColor}>
        {icon}
      </IconBadge>
      <View style={styles.content}>
        <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.value, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    ...CARD_SHADOW,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
  },
  content: {
    flex: 1,
    marginLeft: 12,
  },
  label: {
    fontSize: 13,
    fontFamily: "Roboto",
    color: "#666",
    fontWeight: "500",
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    marginTop: 2,
  },
});

export default StatCard;
