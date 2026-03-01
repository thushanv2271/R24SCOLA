import React, { useContext, memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Modal,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const NotificationModal = memo(({ visible, onClose }) => {
  const { notifications, clearNotifications } = useContext(AuthContext);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "login":
        return "checkmark-circle";
      case "scholarship":
        return "school";
      case "deadline":
        return "timer";
      case "application":
        return "document";
      default:
        return "notifications";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "login":
        return "#4CAF50";
      case "scholarship":
        return "#2196F3";
      case "deadline":
        return "#FF9800";
      case "application":
        return "#9C27B0";
      default:
        return "#6366f1";
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(timestamp).toLocaleDateString();
  };

  const renderNotificationItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <View
        style={[
          styles.iconBackground,
          { backgroundColor: getNotificationColor(item.type) + "20" },
        ]}
      >
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDescription}>{item.description}</Text>
      </View>
      <Text style={styles.notificationTime}>{getTimeAgo(item.timestamp)}</Text>
    </View>
  );

  const displayNotifications =
    notifications && notifications.length > 0
      ? notifications
      : [
          {
            id: 0,
            title: "No notifications yet",
            description: "You're all caught up!",
            type: "info",
            timestamp: new Date(),
          },
        ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Modal Overlay */}
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        {/* Empty View to allow touches to pass through */}
      </Pressable>

      {/* Modal Content */}
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {displayNotifications.length} update
              {displayNotifications.length !== 1 ? "s" : ""}
            </Text>
          </View>
          <View style={styles.headerActions}>
            {notifications && notifications.length > 0 && (
              <TouchableOpacity
                onPress={clearNotifications}
                style={styles.clearButton}
              >
                <Ionicons name="trash" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications List */}
        <FlatList
          data={displayNotifications}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={renderNotificationItem}
        />
      </View>
    </Modal>
  );
});

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    height: "70%",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#999",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#FFE6E6",
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconBackground: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 10,
  },
});

export default NotificationModal;
