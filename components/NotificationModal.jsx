import React, { useState } from "react";
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const NotificationModal = ({ visible, onClose }) => {
  // Sample notification data
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Registration Successful",
      description: "Your account has been successfully created.",
      time: "Just now",
    },
    {
      id: 2,
      title: "Account Activity Alert",
      description:
        "There was a recent login to your account from a new device.",
      time: "10 minutes ago",
    },
    {
      id: 3,
      title: "New Scholarship Opportunity",
      description:
        "A new scholarship opportunity from Stanford University is available.",
      time: "1 hour ago",
    },
    {
      id: 4,
      title: "Upcoming Deadline",
      description:
        "The application deadline for Yale University scholarship is approaching.",
      time: "2 hours ago",
    },
  ]);

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
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.notificationItem}>
              <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{item.title}</Text>
                <Text style={styles.notificationDescription}>
                  {item.description}
                </Text>
              </View>
            </View>
          )}
        />
      </View>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff", // Background color of the modal
    borderTopLeftRadius: 20, // Rounded corners at the top-left
    borderTopRightRadius: 20, // Rounded corners at the top-right
    elevation: 5, // Adds a shadow on Android
    shadowColor: "#000", // Shadow color for iOS
    shadowOffset: { width: 0, height: -2 }, // Shadow offset for iOS
    shadowOpacity: 0.25, // Shadow opacity for iOS
    shadowRadius: 4, // Shadow radius for iOS
    height: "70%", // Set height for the modal content
    padding: 20, // Padding inside the modal
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  closeButton: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  notificationDescription: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginLeft: 10,
    alignSelf: "flex-start",
  },
});

export default NotificationModal;
