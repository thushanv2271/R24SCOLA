import React, { useRef, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { height: screenHeight } = Dimensions.get("window");

const FilterModal = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
}) => {
  const filterModalY = useRef(new Animated.Value(screenHeight)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(filterModalY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterModalY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const renderFilterSection = (filter) => {
    const { label, options, selected, setSelected, type = "default" } = filter;

    return (
      <View key={label} style={styles.filterContainer}>
        <Text style={styles.filterLabel}>{label}</Text>
        <View style={styles.filterOptionsVertical}>
          {options.map((item) => {
            const displayText =
              typeof item === "string" ? item : `${item.flag || ""} ${item.name || item.label}`;
            const value = typeof item === "string" ? item : (item.value || item.name);

            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.filterOption,
                  selected === value && styles.filterOptionSelected,
                ]}
                onPress={() => setSelected(selected === value ? "" : value)}
              >
                <Text
                  style={[
                    styles.filterOptionText,
                    selected === value && styles.filterOptionTextSelected,
                  ]}
                >
                  {displayText}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.bottomModalContent,
            {
              transform: [{ translateY: filterModalY }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Scholarships</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={30} color="gray" />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
            >
              {filters.map((filter) => renderFilterSection(filter))}

              <View style={styles.buttonContainer}>
                {onResetFilters && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resetButton]}
                    onPress={onResetFilters}
                  >
                    <Text style={styles.resetButtonText}>Reset Filters</Text>
                  </TouchableOpacity>
                )}
                {onApplyFilters && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.applyButton]}
                    onPress={onApplyFilters}
                  >
                    <Text style={styles.applyButtonText}>Apply Filters</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    paddingBottom: 20,
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  filterContainer: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  filterOptionsVertical: {
    flexDirection: "column",
    gap: 8,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  filterOptionSelected: {
    backgroundColor: "#007bff",
    borderColor: "#0056b3",
  },
  filterOptionText: {
    fontSize: 14,
    color: "#333",
  },
  filterOptionTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  resetButton: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  applyButton: {
    backgroundColor: "#007bff",
  },
  resetButtonText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default FilterModal;
