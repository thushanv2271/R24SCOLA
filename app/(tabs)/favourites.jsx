import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import FastImage from "react-native-fast-image";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { AuthContext } from "../../components/AuthContext";
import { sendScholarshipEmail, sendJobEmail } from "../service/emailService";
import { useRouter, useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AlertModal from "../../components/AlertModal";

const FavoriteItemsList = () => {
  const { user, refreshFavorites } = useContext(AuthContext);
  const [favoriteScholarships, setFavoriteScholarships] = useState([]);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [selectedTab, setSelectedTab] = useState("scholarships"); // "scholarships" or "jobs"
  const [refreshing, setRefreshing] = useState(false);
  const [requestedScholarships, setRequestedScholarships] = useState(new Set());
  const [requestedJobs, setRequestedJobs] = useState(new Set());
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const scaleFactor = screenWidth / 375;
  const scale = (size) => Math.min(size * scaleFactor, size * 1.5);
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

  // Load requested scholarships from AsyncStorage when the component mounts
  useEffect(() => {
    const loadRequestedScholarships = async () => {
      try {
        const storedData = await AsyncStorage.getItem("requestedScholarships");
        if (storedData) {
          const parsedData = new Set(JSON.parse(storedData));
          setRequestedScholarships(parsedData);
        }
      } catch (error) {
        console.error("Failed to load requested scholarships:", error);
        showAlert(
          "Error",
          "Could not load requested scholarships data.",
          "error",
        );
      }
    };

    const loadRequestedJobs = async () => {
      try {
        const storedData = await AsyncStorage.getItem("requestedJobs");
        if (storedData) {
          const parsedData = new Set(JSON.parse(storedData));
          setRequestedJobs(parsedData);
        }
      } catch (error) {
        console.error("Failed to load requested jobs:", error);
        showAlert("Error", "Could not load requested jobs data.", "error");
      }
    };

    loadRequestedScholarships();
    loadRequestedJobs();
  }, []);

  // Save requested scholarships to AsyncStorage whenever it changes
  useEffect(() => {
    const saveRequestedScholarships = async () => {
      try {
        await AsyncStorage.setItem(
          "requestedScholarships",
          JSON.stringify([...requestedScholarships]),
        );
      } catch (error) {
        console.error("Failed to save requested scholarships:", error);
        showAlert(
          "Error",
          "Could not save requested scholarships data.",
          "error",
        );
      }
    };
    saveRequestedScholarships();
  }, [requestedScholarships]);

  // Save requested jobs to AsyncStorage whenever it changes
  useEffect(() => {
    const saveRequestedJobs = async () => {
      try {
        await AsyncStorage.setItem(
          "requestedJobs",
          JSON.stringify([...requestedJobs]),
        );
      } catch (error) {
        console.error("Failed to save requested jobs:", error);
        showAlert("Error", "Could not save requested jobs data.", "error");
      }
    };
    saveRequestedJobs();
  }, [requestedJobs]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: "#f5f5f5",
          paddingHorizontal: scale(10),
          paddingBottom: scale(10),
        },
        headerContainer: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "#f5f5f5",
          paddingTop: StatusBar.currentHeight || scale(30),
          paddingHorizontal: scale(10),
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        iconButton: {
          backgroundColor: "#f1f5f9",
          borderRadius: 50,
          padding: 8,
          elevation: 2,
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
          height: scale(60),
          resizeMode: "contain",
        },
        title: {
          marginTop: scale(80),
          fontFamily: "Poppins_700Bold",
          fontSize: scale(24),
          fontWeight: "700",
          color: "#333",
          textAlign: "center",
          textBreakStrategy: "simple",
        },
        card: {
          backgroundColor: "#fff",
          top: scale(12),
          borderRadius: scale(12),
          marginVertical: scale(8),
          padding: scale(12),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: scale(2) },
          shadowOpacity: 0.2,
          shadowRadius: scale(5),
          elevation: scale(4),
        },
        cardHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: scale(10),
        },
        imageContainer: {
          width: scale(80),
          height: scale(80),
          borderRadius: scale(8),
          backgroundColor: "#f0f0f0",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        cardTitle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: scale(16),
          fontWeight: "600",
          color: "#333",
          textBreakStrategy: "simple",
        },
        cardSubtitle: {
          fontFamily: "Poppins_400Regular",
          fontSize: scale(14),
          color: "#666",
          fontStyle: "italic",
          textBreakStrategy: "simple",
        },
        buttonContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: scale(10),
        },
        button: {
          backgroundColor: "#004aad",
          paddingVertical: scale(10),
          paddingHorizontal: scale(16),
          borderRadius: scale(30),
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          marginRight: scale(10),
        },
        buttonRequested: {
          backgroundColor: "#002961",
        },
        buttonText: {
          fontSize: scale(16),
          fontWeight: "700",
          fontFamily: "Roboto",
          color: "#fff",
          textBreakStrategy: "simple",
        },
        requestAllText: {
          fontSize: scale(16),
          fontFamily: "Roboto",
          color: "#004aad",
          textDecorationLine: "underline",
          textAlign: "center",
          marginTop: scale(10),
          marginHorizontal: scale(10),
        },
        requestAllTextDisabled: {
          color: "#cccccc",
          textDecorationLine: "none",
        },
        actionButtonsContainer: {
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
          marginTop: scale(5),
          marginHorizontal: scale(10),
        },
        actionButton: {
          flex: 1,
          marginHorizontal: scale(5),
        },
        removeAllText: {
          fontSize: scale(16),
          fontFamily: "Roboto",
          color: "#ff4d4d",
          textDecorationLine: "underline",
          textAlign: "center",
          marginTop: scale(10),
        },
        removeAllTextDisabled: {
          color: "#cccccc",
          textDecorationLine: "none",
        },
        removeButton: {
          backgroundColor: "#ff4d4d",
          padding: scale(10),
          borderRadius: scale(28),
          justifyContent: "center",
          alignItems: "center",
        },
        emptyText: {
          textAlign: "center",
          fontFamily: "Poppins_400Regular",
          color: "#888",
          fontSize: scale(16),
          marginTop: screenHeight * 0.2,
          textBreakStrategy: "simple",
        },
        tabContainer: {
          flexDirection: "row",
          backgroundColor: "#fff",
          borderRadius: scale(30),
          padding: scale(4),
          marginTop: scale(10),
          marginBottom: scale(10),
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabButton: {
          flex: 1,
          paddingVertical: scale(10),
          paddingHorizontal: scale(20),
          borderRadius: scale(26),
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
          fontFamily: "Poppins_600SemiBold",
          fontSize: scale(14),
          fontWeight: "600",
        },
        tabTextActive: {
          color: "#fff",
        },
        tabTextInactive: {
          color: "#666",
        },
      }),
    [scale, screenWidth, screenHeight],
  );

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

  const fetchFavoriteScholarships = useCallback(async (username) => {
    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURI(
          username,
        )}/favorites`,
      );
      if (!response.ok) throw new Error("Failed to fetch favorites");
      const data = await response.json();
      setFavoriteScholarships(data);
    } catch (error) {
      showAlert("Error", "Could not fetch favorite scholarships.", "error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchFavoriteJobs = useCallback(async (username) => {
    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURI(
          username,
        )}/job-favorites`,
      );
      if (!response.ok) throw new Error("Failed to fetch job favorites");
      const data = await response.json();
      setFavoriteJobs(data);
    } catch (error) {
      showAlert("Error", "Could not fetch favorite jobs.", "error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.username) {
      if (selectedTab === "scholarships") {
        await fetchFavoriteScholarships(user.username);
      } else {
        await fetchFavoriteJobs(user.username);
      }
    }
  };

  const handleRequestAllScholarships = async () => {
    if (!user?.username) {
      showAlert("Error", "Please log in to request scholarships.", "error");
      return;
    }

    // Filter out already requested scholarships and those without valid professor emails
    const scholarshipsToRequest = favoriteScholarships.filter(
      (scholarship) =>
        !requestedScholarships.has(scholarship.id) &&
        scholarship.contactProfessors?.[0]?.email,
    );

    if (scholarshipsToRequest.length === 0) {
      showAlert(
        "Info",
        "No new scholarships to request or missing professor emails.",
        "info",
      );
      return;
    }

    // Collect all professor emails
    const professorEmails = scholarshipsToRequest
      .map((scholarship) => scholarship.contactProfessors[0].email)
      .join(",");

    // Create email body with all scholarship details
    const scholarshipList = scholarshipsToRequest
      .map(
        (scholarship, index) =>
          `${index + 1}. ${scholarship.title || "Untitled Scholarship"} (${
            scholarship.university || "Unknown University"
          })`,
      )
      .join("\n");
    const emailBody = `Request for the following scholarships:\n\n${scholarshipList}`;

    try {
      // Send single email to all professor emails
      await sendScholarshipEmail(
        professorEmails,
        user.username,
        "Scholarship Request for Multiple Favorites",
        { name: "Multiple Recipients" },
        emailBody,
      );

      // Mark all scholarships as requested
      const newRequested = new Set(requestedScholarships);
      scholarshipsToRequest.forEach((scholarship) =>
        newRequested.add(scholarship.id),
      );
      setRequestedScholarships(newRequested);

      showAlert(
        "Success",
        `${scholarshipsToRequest.length} scholarship${
          scholarshipsToRequest.length > 1 ? "s" : ""
        } requested successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Failed to send scholarship request email:", error);
      showAlert("Error", "Failed to send scholarship request email.", "error");
    }
  };

  const handleRequestAllJobs = async () => {
    if (!user?.username) {
      showAlert("Error", "Please log in to request jobs.", "error");
      return;
    }

    // Filter out already requested jobs and those without valid contact emails
    const jobsToRequest = favoriteJobs.filter(
      (job) => !requestedJobs.has(job.id) && job.contactProfessors?.[0]?.email,
    );

    if (jobsToRequest.length === 0) {
      showAlert(
        "Info",
        "No new jobs to request or missing contact emails.",
        "info",
      );
      return;
    }

    // Collect all contact emails
    const contactEmails = jobsToRequest
      .map((job) => job.contactProfessors[0].email)
      .join(",");

    // Create email body with all job details
    const jobList = jobsToRequest
      .map(
        (job, index) =>
          `${index + 1}. ${job.title || "Untitled Job"} (${
            job.university || "Unknown Organization"
          })`,
      )
      .join("\n");
    const emailBody = `Request for the following jobs:\n\n${jobList}`;

    try {
      // Send single email to all contact emails
      await sendJobEmail(
        contactEmails,
        user.username,
        "Job Request for Multiple Favorites",
        { name: "Multiple Recipients" },
        emailBody,
      );

      // Mark all jobs as requested
      const newRequested = new Set(requestedJobs);
      jobsToRequest.forEach((job) => newRequested.add(job.id));
      setRequestedJobs(newRequested);

      showAlert(
        "Success",
        `${jobsToRequest.length} job${jobsToRequest.length > 1 ? "s" : ""} requested successfully!`,
        "success",
      );
    } catch (error) {
      console.error("Failed to send job request email:", error);
      showAlert("Error", "Failed to send job request email.", "error");
    }
  };

  const handleRemoveAll = async () => {
    const isJob = selectedTab === "jobs";
    const itemsToRemove = isJob ? favoriteJobs : favoriteScholarships;

    if (itemsToRemove.length === 0) {
      showAlert(
        "Info",
        `No ${isJob ? "jobs" : "scholarships"} to remove.`,
        "info",
      );
      return;
    }

    showAlert(
      "Confirm",
      `Are you sure you want to remove all ${itemsToRemove.length} ${isJob ? "job" : "scholarship"}${itemsToRemove.length > 1 ? "s" : ""} from favorites?`,
      "warning",
      [
        {
          text: "Cancel",
          onPress: closeAlert,
          style: "cancel",
        },
        {
          text: "Remove All",
          onPress: async () => {
            closeAlert();
            try {
              // Remove all items from backend
              const deletePromises = itemsToRemove.map((item) =>
                fetch(
                  `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURI(
                    user.username,
                  )}/${isJob ? "job-favorites" : "favorites"}/by-username/${item.id}`,
                  {
                    method: "DELETE",
                  },
                ),
              );

              await Promise.all(deletePromises);

              // Update local state
              if (isJob) {
                setFavoriteJobs([]);
                await AsyncStorage.setItem("favoriteJobs", JSON.stringify([]));
              } else {
                setFavoriteScholarships([]);
                await AsyncStorage.setItem(
                  "favoriteScholarships",
                  JSON.stringify([]),
                );
              }

              // Trigger refresh in other components
              refreshFavorites();

              showAlert(
                "Success",
                `All ${isJob ? "jobs" : "scholarships"} removed from favorites!`,
                "success",
              );
            } catch (error) {
              console.error("Error removing all favorites:", error);
              showAlert(
                "Error",
                `Could not remove all ${isJob ? "jobs" : "scholarships"} from favorites.`,
                "error",
              );
            }
          },
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.username) {
        setRefreshing(true);
        fetchFavoriteScholarships(user.username);
        fetchFavoriteJobs(user.username);
      }
    }, [user, fetchFavoriteScholarships, fetchFavoriteJobs]),
  );

  useEffect(() => {
    if (user?.username) {
      fetchFavoriteScholarships(user.username);
      fetchFavoriteJobs(user.username);
    }
  }, [refreshFavorites, user, fetchFavoriteScholarships, fetchFavoriteJobs]);

  const handleRemoveFavorite = async (item) => {
    const isJob = selectedTab === "jobs";

    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURI(
          user.username,
        )}/${isJob ? "job-favorites" : "favorites"}/by-username/${item.id}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to remove ${isJob ? "job" : "scholarship"} from favorites`,
        );
      }

      // Update local state
      if (isJob) {
        const updatedJobs = favoriteJobs.filter((job) => job.id !== item.id);
        setFavoriteJobs(updatedJobs);

        // Update AsyncStorage with the new job favorites list
        const jobIds = updatedJobs.map((j) => j.id);
        await AsyncStorage.setItem("favoriteJobs", JSON.stringify(jobIds));
      } else {
        const updatedFavorites = favoriteScholarships.filter(
          (scholarship) => scholarship.id !== item.id,
        );
        setFavoriteScholarships(updatedFavorites);

        // Update AsyncStorage with the new favorites list
        const favoriteIds = updatedFavorites.map((s) => s.id);
        await AsyncStorage.setItem(
          "favoriteScholarships",
          JSON.stringify(favoriteIds),
        );
      }

      // Trigger refresh in other components
      refreshFavorites();

      showAlert(
        "Success",
        `${isJob ? "Job" : "Scholarship"} removed from favorites!`,
        "success",
      );
    } catch (error) {
      console.error("Error removing favorite:", error);
      showAlert(
        "Error",
        `Could not remove ${isJob ? "job" : "scholarship"} from favorites.`,
        "error",
      );
    }
  };

  const renderItem = ({ item }) => {
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0] : null;
    const isJob = selectedTab === "jobs";
    const isRequested = isJob
      ? requestedJobs.has(item.id)
      : requestedScholarships.has(item.id);

    const handleRequestItem = async () => {
      const professor = item.contactProfessors?.[0];
      if (!professor?.email || !user?.username) {
        showAlert("Error", "Missing email information.", "error");
        return;
      }

      try {
        if (isJob) {
          await sendJobEmail(
            professor.email,
            user.username,
            item.title,
            professor,
          );
          setRequestedJobs((prev) => {
            const newSet = new Set(prev);
            newSet.add(item.id);
            return newSet;
          });
          showAlert("Success", "Job request sent successfully!", "success");
        } else {
          await sendScholarshipEmail(
            professor.email,
            user.username,
            item.title,
            professor,
          );
          setRequestedScholarships((prev) => {
            const newSet = new Set(prev);
            newSet.add(item.id);
            return newSet;
          });
          showAlert(
            "Success",
            "Scholarship request sent successfully!",
            "success",
          );
        }
      } catch (error) {
        showAlert(
          "Error",
          `Failed to send ${isJob ? "job" : "scholarship"} request.`,
          "error",
        );
      }
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <FastImage
                source={{
                  uri: imageUrl,
                  cache: FastImage.cacheControl.immutable,
                  priority: FastImage.priority.normal,
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: scale(8),
                }}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <MaterialIcons
                name="image-not-supported"
                size={scale(40)}
                color="#888"
              />
            )}
          </View>
          <View style={{ flex: 1, paddingLeft: scale(12) }}>
            <Text style={styles.cardTitle}>
              {item.title || `Untitled ${isJob ? "Job" : "Scholarship"}`}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.university ||
                `Unknown ${isJob ? "Organization" : "University"}`}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isRequested && styles.buttonRequested]}
            onPress={handleRequestItem}
          >
            <Text style={styles.buttonText}>
              {isRequested
                ? "Requested"
                : `Request ${isJob ? "Job" : "Scholarship"}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveFavorite(item)}
          >
            <MaterialIcons name="delete" size={scale(24)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user || !user.username) {
    return (
      <View style={styles.container}>
        <AlertModal
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          actions={alertConfig.actions}
          onClose={closeAlert}
        />
        <Text style={styles.emptyText}>
          Please log in to view your favorites.
        </Text>
      </View>
    );
  }

  const currentData =
    selectedTab === "scholarships" ? favoriteScholarships : favoriteJobs;
  const handleRequestAll =
    selectedTab === "scholarships"
      ? handleRequestAllScholarships
      : handleRequestAllJobs;

  return (
    <View style={styles.container}>
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions}
        onClose={closeAlert}
      />
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={scale(24)} color="#a5a4a4" />
          </TouchableOpacity>
          <FastImage
            source={require("../../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
            resizeMode={FastImage.resizeMode.contain}
          />
          <TouchableOpacity
            style={styles.iconBackground}
            onPress={() => navigation.navigate("CustomMail")}
          >
            <Ionicons name="create" size={25} color="#a5a4a4" />
          </TouchableOpacity>
        </View>

        {/* Tab Selector */}
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

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            onPress={handleRequestAll}
            disabled={currentData.length === 0}
            style={styles.actionButton}
          >
            <Text
              style={[
                styles.requestAllText,
                currentData.length === 0 && styles.requestAllTextDisabled,
              ]}
            >
              Request All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRemoveAll}
            disabled={currentData.length === 0}
            style={styles.actionButton}
          >
            <Text
              style={[
                styles.removeAllText,
                currentData.length === 0 && styles.removeAllTextDisabled,
              ]}
            >
              Remove All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingTop: scale(170),
          paddingBottom: scale(20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
          />
        }
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {refreshing
              ? "Refreshing..."
              : `No favorite ${selectedTab === "scholarships" ? "scholarships" : "jobs"} yet.`}
          </Text>
        )}
      />
    </View>
  );
};

export default FavoriteItemsList;
