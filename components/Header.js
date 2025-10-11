import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Get screen dimensions
const { width } = Dimensions.get('window');

const Header = ({ onFilterPress, onProfilePress }) => {
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Image
          source={require("../assets/images/OPPORTUNITIES.png")}
          style={styles.logo}
          resizeMode="contain" // Better image scaling
        />
        <View style={styles.iconsContainer}>
          {/* Add your icons here if needed */}
          {/* Example:
          <TouchableOpacity style={styles.iconBackground} onPress={onFilterPress}>
            <Ionicons name="filter" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBackground} onPress={onProfilePress}>
            <Ionicons name="person" size={24} color="#333" />
          </TouchableOpacity>
          */}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: '4%', // Using percentage for better scaling
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: width * 0.03, // Responsive padding (3% of screen width)
    paddingVertical: '2%', // Responsive vertical padding
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 600, // Maximum width for larger devices
    marginHorizontal: 'auto', // Center on wider screens
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    // Limit the icons container width
    maxWidth: width * 0.3, // 30% of screen width
  },
  iconBackground: {
    backgroundColor: "#ececec",
    borderRadius: Math.min(width * 0.1, 20), // Responsive border radius
    width: Math.min(width * 0.1, 40), // Responsive width
    height: Math.min(width * 0.1, 40), // Responsive height
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: width * 0.015, // Responsive margin (1.5% of screen width)
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logo: {
    width: width * 0.4, // 40% of screen width
    height: width * 0.13, // Maintain aspect ratio
    maxWidth: 150, // Maximum width cap
    maxHeight: 50, // Maximum height cap
  },
});

export default Header;