import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";

const { width, height } = Dimensions.get("window");

const CustomizeEmailMessageModal = ({
  visible,
  emailMessage,
  setEmailMessage,
  userEmail,
  onClose,
  setLoading,
  setEditedData,
}) => {
  const handleSaveEmailMessage = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
          userEmail
        )}/email-message`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            scholarshipEmailMessage: emailMessage,
          }),
        }
      );

      if (response.ok) {
        const updatedData = await response.json();
        setEditedData(updatedData);
        setEmailMessage(updatedData.scholarshipEmailMessage || "");
        onClose();
        Alert.alert("Success", "Email message updated successfully");
      } else {
        throw new Error("Failed to update email message");
      }
    } catch (error) {
      console.error("Error updating email message:", error);
      Alert.alert("Error", "Failed to update email message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Customize Email Message</Text>
          <TextInput
            style={styles.modalInput}
            value={emailMessage}
            onChangeText={setEmailMessage}
            placeholder="Enter your custom email message"
            multiline
            numberOfLines={4}
          />
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSaveEmailMessage}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: width * 0.97,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: width * 0.05,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: height * 0.02,
  },
  modalInput: {
    width: "100%",
    height: height * 0.45,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    padding: width * 0.03,
    marginBottom: height * 0.06,
    fontSize: width * 0.04,
    textAlignVertical: "top",
    backgroundColor: "#f9fafb",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: height * 0.015,
    borderRadius: 8,
    marginHorizontal: width * 0.02,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
  },
  saveButton: {
    backgroundColor: "#10b981",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
});

export default CustomizeEmailMessageModal;