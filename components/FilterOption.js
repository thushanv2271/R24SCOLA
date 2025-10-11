import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const FilterOption = ({ label, isSelected, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.filterOption, isSelected && styles.filterOptionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterOptionText, isSelected && styles.filterOptionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  filterOption: {
    backgroundColor: "#e0e0e0",
    padding: 8,
    height: 42,
    marginRight: 8,
    borderRadius: 18,
  },
  filterOptionSelected: {
    backgroundColor: "#007bff",
  },
  filterOptionText: {
    color: "black",
  },
  filterOptionTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default FilterOption;