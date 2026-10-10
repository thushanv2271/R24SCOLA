import React from "react";
import { View, Text, StyleSheet } from "react-native";

// Simple horizontal magnitude bar chart. data: { label, value }[]
// Single sequential hue for all bars — this is one series (a count) across
// categories, not multiple series, so no categorical palette is needed.
const BarChart = ({ data = [], color = "#004aad" }) => {
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <View style={styles.wrap}>
      {data.map((item, index) => (
        // Labels may repeat (e.g. two calculator runs on the same date),
        // so the key must include the index to stay unique.
        <View style={styles.row} key={`${item.label ?? "bar"}-${index}`}>
          <Text style={styles.label} numberOfLines={1}>
            {item.label}
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max((item.value / maxValue) * 100, 4)}%`,
                  backgroundColor: color,
                },
              ]}
            />
          </View>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  label: {
    width: 96,
    fontSize: 12,
    fontFamily: "Roboto",
    color: "#52514e",
  },
  track: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#e1e0d9",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 5,
  },
  value: {
    width: 24,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#0b0b0b",
  },
});

export default BarChart;
