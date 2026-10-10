import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

const GAP_DEGREES = 6;

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
};

// Arc path for a ring segment (stroked, not filled) from startAngle to
// endAngle degrees, measured clockwise from 12 o'clock.
const describeArc = (cx, cy, r, startAngle, endAngle) => {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
};

// Small categorical donut chart. No overlaid center label (that absolute-
// positioning trick was rendering unreliably across screens) — the total
// is shown as a plain line of text under the ring instead.
// data: { label, value, color }[]
const DonutChart = ({ data = [], size = 120, strokeWidth = 18 }) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  let cumulativeDegrees = 0;

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {total === 0 ? (
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#e1e0d9"
            strokeWidth={strokeWidth}
            fill="none"
          />
        ) : (
          data
            .filter((segment) => segment.value > 0)
            .map((segment, index) => {
              const segmentDegrees = (segment.value / total) * 360;
              const startAngle = cumulativeDegrees;
              const endAngle =
                cumulativeDegrees + Math.max(segmentDegrees - GAP_DEGREES, 1);
              cumulativeDegrees += segmentDegrees;

              return (
                <Path
                  key={`${segment.label ?? "segment"}-${index}`}
                  d={describeArc(center, center, radius, startAngle, endAngle)}
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  fill="none"
                />
              );
            })
        )}
      </Svg>

      <Text style={styles.totalText}>{total} total saved</Text>

      <View style={styles.legend}>
        {data.map((segment, index) => (
          <View style={styles.legendItem} key={`${segment.label ?? "legend"}-${index}`}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>
              {segment.label}
            </Text>
            <Text style={styles.legendValue}>{segment.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
  },
  totalText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#52514e",
    marginTop: 10,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: "Roboto",
    color: "#52514e",
  },
  legendValue: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#0b0b0b",
  },
});

export default DonutChart;
