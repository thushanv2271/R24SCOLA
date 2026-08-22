import React, { memo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Get screen dimensions
const { width } = Dimensions.get("window");

const Header = memo(
  ({ onNotificationPress, notificationCount = 0, onMenuPress }) => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
            resizeMode="contain" // Better image scaling
          />
          <View style={styles.iconsContainer}>
            {onNotificationPress && (
              <TouchableOpacity
                style={styles.iconBackground}
                onPress={onNotificationPress}
              >
                <Ionicons name="notifications" size={22} color="#a5a4a4" />
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
            {onMenuPress && (
              <TouchableOpacity
                style={styles.iconBackground}
                onPress={onMenuPress}
              >
                <Ionicons name="menu" size={24} color="#a5a4a4" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    maxWidth: 600, // Maximum width for larger devices
    marginHorizontal: "auto", // Center on wider screens
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
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#FF6B6B",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  logo: {
    width: width * 0.4, // 40% of screen width
    height: width * 0.13, // Maintain aspect ratio
    maxWidth: 150, // Maximum width cap
    maxHeight: 50, // Maximum height cap
  },
});

export default Header;
