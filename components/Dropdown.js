import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Dropdown = ({ title, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <View>
      <TouchableOpacity
        style={styles.dropdownToggle}
        onPress={() => setIsVisible(!isVisible)}
      >
        <Text style={styles.dropdownToggleText}>{title}</Text>
        <Ionicons
          name={isVisible ? "chevron-up" : "chevron-down"}
          size={20}
          color="gray"
        />
      </TouchableOpacity>
      {isVisible && <View style={styles.dropdownContent}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dropdownToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  dropdownContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 2,
  },
});

export default Dropdown;