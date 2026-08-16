import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated from "react-native-reanimated";
import { AuthContext } from "../components/AuthContext";
import { authAPI } from "../services/apiService";
import { SafeAreaView } from "react-native-safe-area-context";
import LoaderModal from "../components/JustMoment";
import { router } from "expo-router";
import AlertModal from "../components/AlertModal";
import CustomizeEmailMessageModal from "../components/CustomizeEmailMessageModal";

const { width, height } = Dimensions.get("window");

const referenceWidth = 375; // Reference design width (e.g., iPhone X)
const referenceHeight = 812; // Reference design height (e.g., iPhone X)
const scale = (size) => (width / referenceWidth) * size;
const verticalScale = (size) => (height / referenceHeight) * size;
const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Helper function to format message for display (Text component)
const formatMessage = (message) => {
  if (!message) return ["No message set"];
  return message.replace(/<br\s*\/?>/gi, "\n").split("\n");
};

// Helper function to convert <br> to \n for TextInput
const convertToNewlines = (message) => {
  if (!message) return "";
  return message.replace(/<br\s*\/?>/gi, "\n");
};

export default function CustomMail() {
  const { user, logout } = useContext(AuthContext);
  const [paidMember, setPaidMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedData, setEditedData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [jobEmailMessage, setJobEmailMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState("scholarships");
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });

  const showAlert = (title, message, type = "info", actions = []) => {
    setAlertConfig({ visible: true, title, message, type, actions });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.username) return;
      try {
        const data = await authAPI.getUserByUsername(user.username);
        setPaidMember(data.paidMember);
        setEditedData(data);
        // Convert <br> to \n when setting emailMessage for TextInput
        setEmailMessage(convertToNewlines(data.scholarshipEmailMessage));
        setJobEmailMessage(convertToNewlines(data.jobEmailMessage));
      } catch (error) {
        console.error("Error fetching user details:", error);
        showAlert("Error", "Failed to load user details", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [user]);

  const handleSaveEmailMessage = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const updatedData = await authAPI.updateEmailMessage(
        user.username,
        emailMessage,
      );
      console.log("Saved email message:", updatedData.scholarshipEmailMessage); // Debug log
      setEditedData(updatedData);
      // Convert <br> to \n again when updating emailMessage
      setEmailMessage(convertToNewlines(updatedData.scholarshipEmailMessage));
      setModalVisible(false);
      showAlert("Success", "Email message updated successfully", "success");
    } catch (error) {
      console.error("Error updating email message:", error);
      showAlert("Error", "Failed to update email message", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJobEmailMessage = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const updatedData = await authAPI.updateJobEmailMessage(
        user.username,
        jobEmailMessage,
      );
      console.log("Saved job email message:", updatedData.jobEmailMessage);
      setEditedData(updatedData);
      setJobEmailMessage(convertToNewlines(updatedData.jobEmailMessage));
      setJobModalVisible(false);
      showAlert("Success", "Job email message updated successfully", "success");
    } catch (error) {
      console.error("Error updating job email message:", error);
      showAlert("Error", "Failed to update job email message", "error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <View style={styles.iconBackground}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={25} color="#a5a4a4" />
            </TouchableOpacity>
          </View>
          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.iconsContainer}>
            <View style={styles.iconBackground}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("Scholarships")}
              >
                <Ionicons
                  name="school"
                  size={moderateScale(30)}
                  color="#a5a4a4"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "scholarships"
                ? styles.tabButtonActive
                : styles.tabButtonInactive,
            ]}
            onPress={() => setSelectedTab("scholarships")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "scholarships"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              Scholarships
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              selectedTab === "jobs"
                ? styles.tabButtonActive
                : styles.tabButtonInactive,
            ]}
            onPress={() => setSelectedTab("jobs")}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === "jobs"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
              ]}
            >
              Jobs
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.section}>
            <View style={styles.sectionContent}>
              <Text style={styles.label}>
                {selectedTab === "scholarships"
                  ? "Scholarship Email Message:"
                  : "Job Email Message:"}
              </Text>
              {formatMessage(
                selectedTab === "scholarships"
                  ? editedData.scholarshipEmailMessage
                  : editedData.jobEmailMessage,
              ).map((line, index) => (
                <Text key={index} style={styles.value}>
                  {line}
                </Text>
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.customizeButton,
              selectedTab === "jobs" && styles.jobButton,
            ]}
            onPress={() =>
              selectedTab === "scholarships"
                ? setModalVisible(true)
                : setJobModalVisible(true)
            }
          >
            <Ionicons
              name={
                selectedTab === "scholarships"
                  ? "mail-outline"
                  : "briefcase-outline"
              }
              size={moderateScale(24)}
              color="#fff"
            />
            <Text style={styles.customizeButtonText}>
              {selectedTab === "scholarships"
                ? "Customize Scholarship Email"
                : "Customize Job Email"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomizeEmailMessageModal
        visible={modalVisible}
        title="Customize Scholarship Email"
        emailMessage={emailMessage}
        setEmailMessage={setEmailMessage}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveEmailMessage}
      />

      <CustomizeEmailMessageModal
        visible={jobModalVisible}
        title="Customize Job Email"
        emailMessage={jobEmailMessage}
        setEmailMessage={setJobEmailMessage}
        onClose={() => setJobModalVisible(false)}
        onSave={handleSaveJobEmailMessage}
      />

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={
          alertConfig.actions.length > 0
            ? alertConfig.actions
            : [{ text: "OK", onPress: closeAlert }]
        }
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    padding: scale(20),
    paddingTop: verticalScale(80),
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(26),
    padding: scale(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: verticalScale(20),
    marginTop: verticalScale(20),
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: moderateScale(30),
    padding: scale(4),
    marginTop: verticalScale(10),
    marginBottom: verticalScale(10),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: scale(20),
    borderRadius: moderateScale(26),
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#004aad",
  },
  tabButtonInactive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
  },
  tabTextInactive: {
    color: "#6b7280",
  },
  section: {
    marginBottom: verticalScale(20),
  },
  sectionContent: {
    paddingLeft: scale(8),
  },
  label: {
    fontSize: moderateScale(16),
    color: "#6b7280",
    marginBottom: verticalScale(8),
  },
  value: {
    fontSize: moderateScale(18),
    color: "#1f2937",
    marginBottom: verticalScale(8),
    fontWeight: "500",
  },
  customizeButton: {
    marginTop: verticalScale(20),
    paddingVertical: verticalScale(12),
    paddingHorizontal: scale(20),
    backgroundColor: "#004aad",
    borderRadius: moderateScale(28),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  jobButton: {
    backgroundColor: "#004aad",
  },
  customizeButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    marginLeft: scale(8),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: moderateScale(26),
  },
  modalScrollViewContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  modalContent: {
    flex: 1,
    padding: scale(20),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: moderateScale(20),
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: verticalScale(16),
    marginTop: verticalScale(20),
  },
  modalInput: {
    width: "100%",
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: moderateScale(8),
    padding: scale(12),
    marginBottom: verticalScale(20),
    fontSize: moderateScale(16),
    textAlignVertical: "top",
    backgroundColor: "#f9fafb",
    minHeight: verticalScale(200),
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingBottom: verticalScale(20),
  },
  modalButton: {
    flex: 1,
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(8),
    marginHorizontal: scale(8),
    alignItems: "center",
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
  },
  saveButton: {
    backgroundColor: "#004aad",
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    fontSize: moderateScale(16),
  },
  headerContainer: {
    position: "absolute",
    top: 23,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    padding: "2%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBackground: {
    backgroundColor: "#f1f5f9",
    borderRadius: 50,
    padding: 8,
    elevation: 2,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  logo: {
    width: scale(160),
    height: verticalScale(50),
  },
});
