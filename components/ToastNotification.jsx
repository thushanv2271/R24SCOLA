import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import notificationService from "@/services/NotificationService";

const { width } = Dimensions.get("window");

const ToastNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      if (notification.remove) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      } else {
        setNotifications((prev) => [notification, ...prev]);

        // Animate in
        slideAnim.setValue(-100);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }
    });

    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  const notification = notifications[0];

  const getIcon = () => {
    switch (notification.type) {
      case "success":
        return "checkmark-circle";
      case "error":
        return "alert-circle";
      case "warning":
        return "warning";
      default:
        return "information-circle";
    }
  };

  const getColor = () => {
    switch (notification.type) {
      case "success":
        return "#004aad";
      case "error":
        return "#F44336";
      case "warning":
        return "#FF9800";
      default:
        return "#004aad";
    }
  };

  const color = notification.color || getColor();
  const icon = notification.icon || getIcon();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={[styles.notification, { borderLeftColor: color }]}>
        <Ionicons name={icon} size={24} color={color} style={styles.icon} />
        <View style={styles.content}>
          <Text style={styles.title}>{notification.title}</Text>
          {notification.description && (
            <Text style={styles.description}>{notification.description}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
    zIndex: 9999,
  },
  notification: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
});

export default ToastNotification;
