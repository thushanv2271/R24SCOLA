import React from "react";
import { View, StyleSheet } from "react-native";

// Icon-in-colored-circle wrapper. Accepts a pre-rendered icon element as
// `children` so it stays agnostic of which icon library the caller uses.
const IconBadge = ({ children, size = 56, backgroundColor = "#f0f9ff" }) => {
  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default IconBadge;
