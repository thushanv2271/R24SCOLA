import React from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { authAPI } from "../services/apiService";

const { width, height } = Dimensions.get("window");

const CustomizeEmailMessageModal = ({
  visible,
  emailMessage,
  setEmailMessage,
  userEmail,
  onClose,
  setLoading,
  setEditedData,
  onShowAlert,
}) => {
  const handleSaveEmailMessage = async () => {
    try {
      setLoading(true);
      const updatedData = await authAPI.updateEmailMessage(
        userEmail,
        emailMessage,
      );
      setEditedData(updatedData);
      setEmailMessage(updatedData?.scholarshipEmailMessage || emailMessage);
      onClose();
      if (onShowAlert) {
        onShowAlert("Success", "Email message updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating email message:", error);
      if (onShowAlert) {
        onShowAlert("Error", "Failed to update email message", "error");
      }
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
    backgroundColor: "#004aad",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
  },
});

export default CustomizeEmailMessageModal;
