import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { fetchUserByUsername, updateUser } from "../services/userService";
import AlertModal from "../components/AlertModal";
import { AuthContext } from "../components/AuthContext";
import { authAPI } from "../services/apiService";
import ScolaMenu from "../components/ScolaMenu";

export default function Profile() {
  const { username } = useLocalSearchParams(); // Get the username from query parameters
  const { favoritesRefreshTrigger } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [menuVisible, setMenuVisible] = useState(false);
  const [editedData, setEditedData] = useState({}); // State to hold edited user data
  const [favoriteScholarshipsCount, setFavoriteScholarshipsCount] = useState(0);
  const [favoriteJobsCount, setFavoriteJobsCount] = useState(0);
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
    const fetchUserData = async () => {
      try {
        const data = await fetchUserByUsername(username);
        setUserData(data);
        setEditedData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [username]);

  useEffect(() => {
    const fetchFavoriteCounts = async () => {
      if (!username) {
        setFavoriteScholarshipsCount(0);
        setFavoriteJobsCount(0);
        return;
      }

      try {
        const [scholarships, jobs] = await Promise.all([
          authAPI.getFavorites(username),
          authAPI.getJobFavorites(username),
        ]);

        setFavoriteScholarshipsCount(
          Array.isArray(scholarships) ? scholarships.length : 0,
        );
        setFavoriteJobsCount(Array.isArray(jobs) ? jobs.length : 0);
      } catch (error) {
        console.error("Error fetching favorite counts:", error);
        setFavoriteScholarshipsCount(0);
        setFavoriteJobsCount(0);
      }
    };

    fetchFavoriteCounts();
  }, [username, favoritesRefreshTrigger]);

  // Refetch favorites count when profile comes into view
  useFocusEffect(
    useCallback(() => {
      const fetchCounts = async () => {
        if (!username) {
          setFavoriteScholarshipsCount(0);
          setFavoriteJobsCount(0);
          return;
        }

        try {
          const [scholarships, jobs] = await Promise.all([
            authAPI.getFavorites(username),
            authAPI.getJobFavorites(username),
          ]);

          setFavoriteScholarshipsCount(
            Array.isArray(scholarships) ? scholarships.length : 0,
          );
          setFavoriteJobsCount(Array.isArray(jobs) ? jobs.length : 0);
        } catch (error) {
          console.error("Error fetching favorite counts on focus:", error);
        }
      };

      fetchCounts();
    }, [username]),
  );

  // Logout Function
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["username", "userToken"]);
      console.log("User logged out");
      router.replace("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      showAlert("Error", "Failed to log out. Please try again.", "error");
    }
  };

  const handleGoHome = () => {
    router.back(); // Navigate back to the previous screen (home page)
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing); // Toggle edit mode
  };

  const validateInput = () => {
    if (isNaN(editedData.age) || editedData.age <= 0) {
      showAlert("Invalid Input", "Age must be a positive number.", "warning");
      return false;
    }
    if (!editedData.country.trim()) {
      showAlert("Invalid Input", "Country cannot be empty.", "warning");
      return false;
    }
    return true;
  };

  const prepareDataForAPI = () => {
    return {
      id: userData.id,
      username: editedData.username,
      password: editedData.password,
      age: editedData.age,
      country: editedData.country,
      favoriteScholarshipIds: editedData.favoriteScholarshipIds || [],
    };
  };

  const handleSave = async () => {
    if (!validateInput()) return;

    try {
      const userId = userData.id;
      const dataToSend = prepareDataForAPI();
      const token = await AsyncStorage.getItem("userToken");

      const updatedData = await updateUser(userId, dataToSend, token);
      setUserData(updatedData || dataToSend);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating user data:", error);
      showAlert("Error", error.message || "Failed to update profile.", "error");
    }
  };

  const handleChange = (field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  // Function to convert country name to flag emoji
  const getFlagEmoji = (countryName) => {
    // Simple mapping of country names to ISO 3166-1 alpha-2 codes
    const countryCodes = {
      Algeria: "DZ",
      Argentina: "AR",
      Australia: "AU",
      Austria: "AT",
      Bangladesh: "BD",
      Belgium: "BE",
      Brazil: "BR",
      Canada: "CA",
      Chile: "CL",
      China: "CN",
      Colombia: "CO",
      Cuba: "CU",
      "Czech Republic": "CZ",
      Denmark: "DK",
      Egypt: "EG",
      Ethiopia: "ET",
      Finland: "FI",
      France: "FR",
      Germany: "DE",
      Ghana: "GH",
      Greece: "GR",
      Hungary: "HU",
      India: "IN",
      Indonesia: "ID",
      Iran: "IR",
      Iraq: "IQ",
      Ireland: "IE",
      Israel: "IL",
      Italy: "IT",
      Japan: "JP",
      Kenya: "KE",
      Malaysia: "MY",
      Mexico: "MX",
      Morocco: "MA",
      Netherlands: "NL",
      "New Zealand": "NZ",
      Nigeria: "NG",
      Norway: "NO",
      Pakistan: "PK",
      Peru: "PE",
      Poland: "PL",
      Portugal: "PT",
      Russia: "RU",
      "Saudi Arabia": "SA",
      "South Africa": "ZA",
      "South Korea": "KR",
      Spain: "ES",
      "Sri Lanka": "LK",
      Sweden: "SE",
      Switzerland: "CH",
      Thailand: "TH",
      Turkey: "TR",
      Ukraine: "UA",
      "United Kingdom": "GB",
      "United States": "US",
      Venezuela: "VE",
      Vietnam: "VN",
    };

    const countryCode = countryCodes[countryName] || "??"; // Default to '??' if country not found
    return String.fromCodePoint(
      ...countryCode
        .toUpperCase()
        .split("")
        .map((char) => 0x1f1a5 + char.charCodeAt(0)),
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#004aad" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={{ flex: 1 }}
      >
        {/* Header with Icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoHome} style={styles.iconButton}>
            <Ionicons name="chevron-back" size={22} color="#004aad" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            My Profile
          </Text>
          <View style={styles.headerIcons}>
            <TouchableOpacity
              onPress={() => setMenuVisible(true)}
              style={styles.iconButton}
            >
              <Ionicons name="menu" size={22} color="#004aad" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
              <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {userData ? (
          <>
            {/* Profile Header Card */}
            <View style={styles.headerCard}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarInitial}>
                  {userData.username
                    ? userData.username.charAt(0).toUpperCase()
                    : "?"}
                </Text>
              </View>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {userData.username || "User"}
              </Text>
            </View>

            {/* Stats Section - Favorites */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="book" size={26} color="#004aad" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    Scholarships
                  </Text>
                  <Text style={styles.statValue}>
                    {favoriteScholarshipsCount}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIcon}>
                  <Ionicons name="briefcase" size={26} color="#004aad" />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel} numberOfLines={1}>
                    Jobs
                  </Text>
                  <Text style={styles.statValue}>{favoriteJobsCount}</Text>
                </View>
              </View>
            </View>

            {/* Personal Information Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="person-circle" size={22} color="#004aad" />
                  <Text style={styles.sectionTitle} numberOfLines={1}>
                    Personal Information
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={toggleEditMode}
                  style={styles.editPill}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isEditing ? "close" : "pencil"}
                    size={14}
                    color="#004aad"
                  />
                  <Text style={styles.editPillText} numberOfLines={1}>
                    {isEditing ? "Cancel" : "Edit"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    Username
                  </Text>
                  <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                    {userData.username}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    Age
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={String(editedData.age ?? "")}
                      onChangeText={(text) =>
                        handleChange("age", parseInt(text, 10) || 0)
                      }
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value} numberOfLines={1}>
                      {userData.age}
                    </Text>
                  )}
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    Country
                  </Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.country}
                      onChangeText={(text) => handleChange("country", text)}
                    />
                  ) : (
                    <View style={styles.countryValue}>
                      <Text
                        style={styles.value}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {userData.country}
                      </Text>
                      <Text style={styles.flag}>
                        {getFlagEmoji(userData.country)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Save Button */}
              {isEditing && (
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <Text style={styles.saveButtonText} numberOfLines={1}>
                    Save Changes
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        ) : (
          <Text style={styles.noDataText}>No user data found.</Text>
        )}

        <View style={styles.spacer} />
      </ScrollView>
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
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollViewContent: {
    padding: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#e0f2fe",
    backgroundColor: "#004aad",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  avatarInitial: {
    fontSize: 38,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
    textAlign: "center",
    textTransform: "capitalize",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "Roboto",
    color: "#666",
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  sectionHeaderLeft: {
    flex: 1,
    flexShrink: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 8,
  },
  sectionTitle: {
    flexShrink: 1,
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    marginLeft: 8,
  },
  editPill: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#eff6ff",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  editPillText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#004aad",
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  label: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
    fontFamily: "Roboto",
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    fontFamily: "Roboto",
    flex: 1,
    textAlign: "right",
  },
  countryValue: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  flag: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    fontFamily: "Roboto",
    textAlign: "center",
    marginTop: 40,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    fontFamily: "Roboto",
    color: "#111827",
    backgroundColor: "#f8fafc",
    textAlign: "right",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#004aad",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
    fontFamily: "Roboto",
  },
  spacer: {
    height: 20,
  },
});
