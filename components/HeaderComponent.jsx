import React from "react";
import { View, Image, TouchableOpacity, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const HeaderComponent = ({
  onBackPress,
  onFilterPress,
  onNotificationPress,
  onHomePress,
  showBack = false,
  showFilter = false,
  showNotification = false,
  showHome = false,
  logoSource,
  opacity = 1,
}) => {
  return (
    <Animated.View style={[styles.headerContainer, { opacity }]}>
      <View style={styles.headerRow}>
        {showBack && (
          <View style={styles.iconBackground}>
            <TouchableOpacity onPress={onBackPress}>
              <Ionicons name="arrow-back" size={25} color="#a5a4a4" />
            </TouchableOpacity>
          </View>
        )}

        {logoSource && (
          <Image
            source={logoSource}
            style={styles.logo}
            resizeMode="contain"
          />
        )}

        <View style={styles.iconsContainer}>
          {showFilter && (
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={onFilterPress}>
                <Ionicons name="funnel" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
          )}

          {showNotification && (
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={onNotificationPress}>
                <Ionicons name="notifications" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
          )}

          {showHome && (
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={onHomePress}>
                <Ionicons name="home" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 25,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    padding: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    width: 150,
    height: 50,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBackground: {
    backgroundColor: "#ececec",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default HeaderComponent;
