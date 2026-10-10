import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { CARD as CARD_SHADOW } from "../tokens/shadows";
import { useTheme } from "../ThemeContext";

// Extracted from both Profile screens' identical
// infoCard/infoRow/label/value/divider.
export const InfoRow = ({ label, value }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      {typeof value === "string" || typeof value === "number" ? (
        <Text
          style={[styles.value, { color: colors.textPrimary }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {value}
        </Text>
      ) : (
        value
      )}
    </View>
  );
};

const InfoCard = ({ rows = [] }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      {rows.map((row, index) => (
        <React.Fragment key={row.label}>
          {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          <InfoRow label={row.label} value={row.value} />
        </React.Fragment>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    ...CARD_SHADOW,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    fontFamily: "Roboto",
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#111827",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 2,
  },
});

export default InfoCard;
