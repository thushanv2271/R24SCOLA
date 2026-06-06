import React, { useContext, useState, useEffect, useCallback } from "react";
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
import { AuthContext } from "../../components/AuthContext";
import { authAPI } from "../../services/apiService";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./../../components/Header";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoaderModal from "../../components/JustMoment";
import AlertModal from "../../components/AlertModal";

const { width, height } = Dimensions.get("window");
const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api/Users";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, favoritesRefreshTrigger } = useContext(AuthContext);
  const [paidMember, setPaidMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});
  const [favoriteScholarshipsCount, setFavoriteScholarshipsCount] = useState(0);
  const [favoriteJobsCount, setFavoriteJobsCount] = useState(0);
  const [username, setUsername] = useState(user?.username || "");
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

  // Fallback: Get username from AsyncStorage if not in AuthContext
  useEffect(() => {
    const getUsername = async () => {
      if (user?.username) {
        setUsername(user.username);
      } else {
        const storedUsername = await AsyncStorage.getItem("username");
        if (storedUsername) {
          setUsername(storedUsername);
        }
      }
    };
    getUsername();
  }, [user?.username]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (username) {
        try {
          const data = await authAPI.getUserByUsername(username);
          setPaidMember(data.paidMember);
          setEditedData(data);
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserDetails();
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

  // Refetch favorites count when profile tab comes into focus
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
          // Set to 0 on error to prevent showing stale data
          setFavoriteScholarshipsCount(0);
          setFavoriteJobsCount(0);
        }
      };

      fetchCounts();
    }, [username]),
  );

  const handleChange = (field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      showAlert("Error", "Failed to log out. Please try again.", "error");
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
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={{ flex: 1 }}
      >
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.profilePictureContainer}>
            <Image
              source={{
                uri:
                  user?.profilePicture ||
                  "https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg",
              }}
              style={styles.profilePicture}
            />
          </View>

          <View style={styles.profileInfoContainer}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.title}>{user?.title}</Text>
            {user?.bio && <Text style={styles.bio}>{user?.bio}</Text>}
          </View>
        </View>

        {/* Stats Section - Favorites */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="book" size={28} color="#004aad" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Scholarships</Text>
              <Text style={styles.statValue}>{favoriteScholarshipsCount}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="briefcase" size={28} color="#004aad" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Jobs</Text>
              <Text style={styles.statValue}>{favoriteJobsCount}</Text>
            </View>
          </View>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color="#004aad" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Username</Text>
              <Text style={styles.value}>{username}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{user?.email || "Not provided"}</Text>
            </View>

            {paidMember !== null && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Member Status</Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: paidMember ? "#d1fae5" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: paidMember ? "#065f46" : "#991b1b",
                        },
                      ]}
                    >
                      {paidMember ? "Premium Member" : "Free Member"}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={styles.logoutButton}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollViewContent: {
    paddingHorizontal: width * 0.04,
    paddingTop: 12,
    paddingBottom: height * 0.05,
  },
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: width * 0.06,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: height * 0.03,
    alignItems: "center",
  },
  profilePictureContainer: {
    marginBottom: height * 0.02,
  },
  profilePicture: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: width * 0.175,
    borderWidth: 4,
    borderColor: "#e0f2fe",
    backgroundColor: "#f1f5f9",
  },
  profileInfoContainer: {
    alignItems: "center",
    width: "100%",
  },
  name: {
    fontSize: width * 0.065,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#0f172a",
    marginTop: height * 0.01,
  },
  title: {
    fontSize: width * 0.042,
    fontFamily: "Roboto",
    color: "#64748b",
    marginTop: height * 0.005,
  },
  bio: {
    fontSize: width * 0.038,
    fontFamily: "Roboto",
    textAlign: "center",
    color: "#475569",
    marginTop: height * 0.01,
    fontStyle: "italic",
  },
  statsContainer: {
    flexDirection: "row",
    gap: width * 0.04,
    marginBottom: height * 0.03,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: width * 0.04,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    width: width * 0.14,
    height: width * 0.14,
    borderRadius: width * 0.07,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: width * 0.03,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: width * 0.034,
    fontFamily: "Roboto",
    color: "#64748b",
    fontWeight: "500",
  },
  statValue: {
    fontSize: width * 0.062,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#0f172a",
    marginTop: height * 0.002,
  },
  section: {
    marginBottom: height * 0.03,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: height * 0.015,
    paddingHorizontal: width * 0.02,
  },
  sectionTitle: {
    fontSize: width * 0.052,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#0f172a",
    marginLeft: width * 0.03,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: width * 0.05,
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
    paddingVertical: height * 0.015,
  },
  label: {
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: width * 0.043,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#0f172a",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: height * 0.005,
  },
  badge: {
    paddingVertical: height * 0.008,
    paddingHorizontal: width * 0.04,
    borderRadius: 20,
    alignSelf: "flex-end",
  },
  badgeText: {
    fontSize: width * 0.032,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  logoutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 14,
    paddingVertical: height * 0.018,
    paddingHorizontal: width * 0.06,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginHorizontal: width * 0.02,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: width * 0.044,
    fontFamily: "Roboto",
    marginLeft: width * 0.02,
  },
  spacer: {
    height: height * 0.02,
  },
});
