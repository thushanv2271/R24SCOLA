import React, { useContext, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
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
import ScolaMenu from "../../components/ScolaMenu";
import NotificationModal from "../../components/NotificationModal";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, favoritesRefreshTrigger, notifications } =
    useContext(AuthContext);
  const [paidMember, setPaidMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
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

  const fetchUserDetails = useCallback(async () => {
    if (!username) return;
    try {
      const data = await authAPI.getUserByUsername(username);
      setPaidMember(data.paidMember);
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  }, [username]);

  const fetchFavoriteCounts = useCallback(async () => {
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
  }, [username]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  useEffect(() => {
    fetchFavoriteCounts();
  }, [fetchFavoriteCounts, favoritesRefreshTrigger]);

  // Refetch profile data when the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchUserDetails();
      fetchFavoriteCounts();
    }, [fetchUserDetails, fetchFavoriteCounts]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchUserDetails(), fetchFavoriteCounts()]);
    setRefreshing(false);
  }, [fetchUserDetails, fetchFavoriteCounts]);

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
      <Header
        onNotificationPress={() => setShowNotificationModal(true)}
        notificationCount={notifications?.length || 0}
        onMenuPress={() => setMenuVisible(true)}
      />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>
              {username ? username.charAt(0).toUpperCase() : "?"}
            </Text>
          </View>

          <View style={styles.profileInfoContainer}>
            <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
              {username || "User"}
            </Text>
          </View>
        </View>

        {/* Stats Section - Favorites */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="book" size={28} color="#004aad" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel} numberOfLines={1}>
                Scholarships
              </Text>
              <Text style={styles.statValue}>{favoriteScholarshipsCount}</Text>
            </View>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="briefcase" size={28} color="#004aad" />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel} numberOfLines={1}>
                Jobs
              </Text>
              <Text style={styles.statValue}>{favoriteJobsCount}</Text>
            </View>
          </View>
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle" size={24} color="#004aad" />
            <Text style={styles.sectionTitle} numberOfLines={1}>
              Account Information
            </Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label} numberOfLines={1}>
                Username
              </Text>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                {username}
              </Text>
            </View>

            {paidMember !== null && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label} numberOfLines={1}>
                    Member Status
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: paidMember ? "#d1fae5" : "#fee2e2",
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
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

        {/* Privacy Policy */}
        <TouchableOpacity
          onPress={() => router.push("/PrivacyPolicy")}
          style={styles.privacyButton}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={18} color="#6b7280" />
          <Text style={styles.privacyButtonText} numberOfLines={1}>
            Privacy Policy
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#6b7280" />
        </TouchableOpacity>

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
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
  avatarCircle: {
    width: width * 0.28,
    height: width * 0.28,
    borderRadius: width * 0.14,
    borderWidth: 4,
    borderColor: "#e0f2fe",
    backgroundColor: "#004aad",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  avatarInitial: {
    fontSize: width * 0.11,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
  },
  profileInfoContainer: {
    alignItems: "center",
    width: "100%",
  },
  name: {
    fontSize: width * 0.065,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    textTransform: "capitalize",
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
    color: "#666",
    fontWeight: "500",
  },
  statValue: {
    fontSize: width * 0.062,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
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
    color: "#111827",
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
    color: "#666",
    fontWeight: "500",
    flex: 1,
  },
  value: {
    fontSize: width * 0.043,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#111827",
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
  privacyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: height * 0.014,
    paddingHorizontal: width * 0.06,
    marginHorizontal: width * 0.02,
    marginBottom: height * 0.012,
    gap: width * 0.02,
  },
  privacyButtonText: {
    color: "#666",
    fontSize: width * 0.038,
    fontFamily: "Roboto",
    flex: 1,
    textAlign: "center",
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
