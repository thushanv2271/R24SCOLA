import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  Image,
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

const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api/Users";

export default function Profile() {
  const { username } = useLocalSearchParams(); // Get the username from query parameters
  const { favoritesRefreshTrigger } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
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
        const [scholarshipsResponse, jobsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/${encodeURIComponent(username)}/favorites`, {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch(
            `${API_BASE_URL}/${encodeURIComponent(username)}/job-favorites`,
            { method: "GET", headers: { Accept: "application/json" } },
          ),
        ]);

        const scholarships = scholarshipsResponse.ok
          ? await scholarshipsResponse.json()
          : [];
        const jobs = jobsResponse.ok ? await jobsResponse.json() : [];

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
          const [scholarshipsResponse, jobsResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/${encodeURIComponent(username)}/favorites`, {
              method: "GET",
              headers: { Accept: "application/json" },
            }),
            fetch(
              `${API_BASE_URL}/${encodeURIComponent(username)}/job-favorites`,
              { method: "GET", headers: { Accept: "application/json" } },
            ),
          ]);

          const scholarships = scholarshipsResponse.ok
            ? await scholarshipsResponse.json()
            : [];
          const jobs = jobsResponse.ok ? await jobsResponse.json() : [];

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
      await AsyncStorage.multiRemove(["username", "userPassword", "userToken"]);
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
      showAlert("Success", "Profile updated successfully!", "success");
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
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Header with Icons */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoHome} style={styles.iconButton}>
            <Ionicons name="home" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <Ionicons name="log-out" size={24} color="red" />
          </TouchableOpacity>
        </View>

        {/* Edit Button */}
        {/* <TouchableOpacity style={styles.editButton} onPress={toggleEditMode}>
          <Text style={styles.editButtonText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity> */}

        {/* User Profile Card */}
        <View style={styles.card}>
          {userData ? (
            <>
              {/* Profile Picture */}
              <View style={styles.profilePictureContainer}>
                <Image
                  source={{
                    uri:
                      userData.profilePicture ||
                      "https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg",
                  }}
                  style={styles.profilePicture}
                />
              </View>

              {/* Name and Title */}
              <View style={styles.infoContainer}>
                <Text style={styles.name}>{userData.name}</Text>
                <Text style={styles.title}>{userData.title}</Text>
              </View>

              {/* Bio */}
              <View style={styles.bioContainer}>
                <Text style={styles.bio}>{userData.bio}</Text>
              </View>

              {/* Personal Information Section */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View style={styles.sectionContent}>
                  <Text style={styles.label}>Username:</Text>
                  <Text style={styles.value}>{userData.username}</Text>

                  <Text style={styles.label}>Favourite Scholarships:</Text>
                  <Text style={styles.value}>{favoriteScholarshipsCount}</Text>

                  <Text style={styles.label}>Favourite Jobs:</Text>
                  <Text style={styles.value}>{favoriteJobsCount}</Text>

                  <Text style={styles.label}>Age:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={String(editedData.age)}
                      onChangeText={(text) =>
                        handleChange("age", parseInt(text, 10))
                      }
                      keyboardType="numeric"
                    />
                  ) : (
                    <Text style={styles.value}>{userData.age}</Text>
                  )}

                  <Text style={styles.label}>Country:</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedData.country}
                      onChangeText={(text) => handleChange("country", text)}
                    />
                  ) : (
                    <View style={styles.countryContainer}>
                      <Text style={styles.value}>{userData.country}</Text>
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
                >
                  <Text style={styles.saveButtonText}>Save Changes</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <Text style={styles.noDataText}>No user data found.</Text>
          )}
        </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Roboto",
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profilePicture: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: "#e0f2fe",
    backgroundColor: "#f1f5f9",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
    fontFamily: "Roboto",
  },
  title: {
    fontSize: 16,
    color: "#64748b",
    fontFamily: "Roboto",
    marginTop: 4,
  },
  bioContainer: {
    marginBottom: 20,
  },
  bio: {
    fontSize: 15,
    textAlign: "center",
    color: "#475569",
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 12,
    fontFamily: "Roboto",
  },
  sectionContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  label: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "500",
    fontFamily: "Roboto",
  },
  value: {
    fontSize: 16,
    color: "#0f172a",
    marginBottom: 14,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  input: {
    height: 44,
    borderColor: "#cbd5e1",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    fontSize: 16,
    fontFamily: "Roboto",
    backgroundColor: "#f8fafc",
  },
  editButton: {
    alignSelf: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    marginBottom: 16,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Roboto",
  },
  saveButton: {
    alignSelf: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#10b981",
    borderRadius: 10,
    marginTop: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Roboto",
  },
  countryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  flag: {
    fontSize: 20,
    marginLeft: 10,
  },
});
