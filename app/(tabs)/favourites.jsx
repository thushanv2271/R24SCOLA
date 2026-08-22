import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { AuthContext } from "../../components/AuthContext";
import { authAPI } from "../../services/apiService";
import { sendScholarshipEmail, sendJobEmail } from "../service/emailService";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScolaMenu from "../../components/ScolaMenu";

const FavoriteItemsList = () => {
  const { user, refreshFavorites } = useContext(AuthContext);
  const [favoriteScholarships, setFavoriteScholarships] = useState([]);
  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const [selectedTab, setSelectedTab] = useState("scholarships"); // "scholarships" or "jobs"
  const [refreshing, setRefreshing] = useState(false);
  const [requestedScholarships, setRequestedScholarships] = useState(new Set());
  const [requestedJobs, setRequestedJobs] = useState(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleFactor = screenWidth / 375;
  const scale = (size) => Math.min(size * scaleFactor, size * 1.5);
  const pageWidth = screenWidth - scale(10) * 2; // matches container's paddingHorizontal
  const pagerRef = useRef(null);
  const TABS = ["scholarships", "jobs"];

  const goToTab = (tab) => {
    setSelectedTab(tab);
    pagerRef.current?.scrollTo({
      x: TABS.indexOf(tab) * pageWidth,
      animated: true,
    });
  };

  const handlePagerScrollEnd = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const tab = TABS[page] ?? TABS[0];
    if (tab !== selectedTab) setSelectedTab(tab);
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
        pagePaneDivider: {
          borderRightWidth: 1,
          borderRightColor: "#e2e8f0",
        },
        headerContainer: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "#f8fafc",
          paddingTop: StatusBar.currentHeight || 30,
          paddingHorizontal: 16,
          paddingBottom: 10,
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
          width: 150,
          height: 50,
        },
        fab: {
          position: "absolute",
          bottom: 24,
          right: 20,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: "#004aad",
          paddingVertical: 12,
          paddingHorizontal: 18,
          borderRadius: 30,
          elevation: 6,
          shadowColor: "#004aad",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35,
          shadowRadius: 8,
          zIndex: 20,
        },
        fabText: {
          color: "#fff",
          fontSize: 14,
          fontWeight: "700",
          fontFamily: "Roboto",
          textBreakStrategy: "simple",
        },
        title: {
          marginTop: scale(80),
          fontFamily: "Roboto",
          fontSize: scale(24),
          fontWeight: "700",
          color: "#111827",
          textAlign: "center",
          textBreakStrategy: "simple",
        },
        card: {
          backgroundColor: "#fff",
          borderRadius: 16,
          marginVertical: 8,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        },
        imageBanner: {
          width: "100%",
          height: 150,
          backgroundColor: "#f1f5f9",
        },
        bannerImage: {
          width: "100%",
          height: "100%",
        },
        bannerFallback: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        bannerOverlayTop: {
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        },
        typeBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingVertical: 4,
          paddingHorizontal: 10,
          borderRadius: 20,
        },
        typeBadgeScholarship: {
          backgroundColor: "#004aad",
        },
        typeBadgeJob: {
          backgroundColor: "#004aad",
        },
        typeBadgeText: {
          fontSize: 10,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: "#fff",
          textBreakStrategy: "simple",
        },
        removeIconBtn: {
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
        },
        cardBody: {
          padding: 14,
        },
        cardTitle: {
          fontFamily: "Roboto",
          fontSize: 16,
          fontWeight: "700",
          color: "#111827",
          textBreakStrategy: "simple",
          marginBottom: 4,
        },
        cardSubtitle: {
          fontFamily: "Roboto",
          fontSize: 13,
          color: "#666",
          textBreakStrategy: "simple",
          marginBottom: 8,
        },
        tagsRow: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 4,
          marginBottom: 10,
        },
        tag: {
          backgroundColor: "#f1f5f9",
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 2,
        },
        tagText: {
          fontSize: 11,
          color: "#374151",
          fontFamily: "Roboto",
          textBreakStrategy: "simple",
        },
        cardActions: {
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          marginTop: 4,
        },
        requestBtn: {
          backgroundColor: "#004aad",
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingVertical: 7,
          paddingHorizontal: 16,
          borderRadius: 20,
        },
        requestBtnText: {
          fontSize: 13,
          fontWeight: "600",
          fontFamily: "Roboto",
          color: "#fff",
          textBreakStrategy: "simple",
        },
        requestedBadge: {
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
        },
        requestedText: {
          fontSize: 13,
          fontWeight: "600",
          fontFamily: "Roboto",
          color: "#10b981",
          textBreakStrategy: "simple",
        },
        headerIcons: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        menuBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: "#f1f5f9",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBar: {
          flexDirection: "row",
          marginTop: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#e2e8f0",
        },
        tabItem: {
          flex: 1,
          alignItems: "center",
          paddingBottom: 10,
        },
        tabLabel: {
          fontSize: scale(14),
          fontWeight: "600",
          fontFamily: "Roboto",
          color: "#94a3b8",
          textBreakStrategy: "simple",
        },
        tabLabelActive: {
          color: "#004aad",
        },
        tabCount: {
          fontSize: scale(12),
          fontWeight: "700",
          color: "#004aad",
        },
        tabUnderline: {
          position: "absolute",
          bottom: 0,
          left: "20%",
          right: "20%",
          height: 2,
          backgroundColor: "#004aad",
          borderRadius: 2,
        },
        menuBackdrop: {
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 150,
        },
        dropdown: {
          position: "absolute",
          top: (StatusBar.currentHeight || 30) + 120,
          right: 16,
          backgroundColor: "#fff",
          borderRadius: 12,
          paddingVertical: 4,
          minWidth: 180,
          elevation: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          zIndex: 200,
        },
        dropdownItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        dropdownText: {
          fontSize: 14,
          fontWeight: "600",
          fontFamily: "Roboto",
          color: "#004aad",
          textBreakStrategy: "simple",
        },
        dropdownTextDanger: {
          color: "#ef4444",
        },
        dropdownTextDisabled: {
          color: "#cbd5e1",
        },
        dropdownDivider: {
          height: 1,
          backgroundColor: "#f1f5f9",
          marginHorizontal: 12,
        },
        emptyContainer: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 60,
          paddingHorizontal: 32,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: "#334155",
          fontFamily: "Roboto",
          marginTop: 16,
          marginBottom: 8,
          textBreakStrategy: "simple",
        },
        emptySubtext: {
          fontSize: 14,
          color: "#94a3b8",
          fontFamily: "Roboto",
          textAlign: "center",
          lineHeight: 20,
          textBreakStrategy: "simple",
        },
      }),
    [scale, screenWidth, screenHeight],
  );

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

  const fetchFavoriteScholarships = useCallback(async (username) => {
    try {
      const data = await authAPI.getFavorites(username);
      setFavoriteScholarships(data);
    } catch (error) {
      console.error("Could not fetch favorite scholarships:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchFavoriteJobs = useCallback(async (username) => {
    try {
      const data = await authAPI.getJobFavorites(username);
      setFavoriteJobs(data);
    } catch (error) {
      console.error("Could not fetch favorite jobs:", error);
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
    if (!user?.username) return;

    const scholarshipsToRequest = favoriteScholarships.filter(
      (scholarship) =>
        !requestedScholarships.has(scholarship.id) &&
        scholarship.contactProfessors?.[0]?.email,
    );

    if (scholarshipsToRequest.length === 0) return;

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
    } catch (error) {
      console.error("Failed to send scholarship request email:", error);
    }
  };

  const handleRequestAllJobs = async () => {
    if (!user?.username) return;

    const jobsToRequest = favoriteJobs.filter(
      (job) => !requestedJobs.has(job.id) && job.contactProfessors?.[0]?.email,
    );

    if (jobsToRequest.length === 0) return;

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
    } catch (error) {
      console.error("Failed to send job request email:", error);
    }
  };

  const handleRemoveAll = async () => {
    const isJob = selectedTab === "jobs";
    const itemsToRemove = isJob ? favoriteJobs : favoriteScholarships;
    if (itemsToRemove.length === 0) return;
    try {
      await Promise.all(
        itemsToRemove.map((item) =>
          isJob
            ? authAPI.removeJobFavorite(user.username, item.id)
            : authAPI.removeFavorite(user.username, item.id),
        ),
      );
      if (isJob) {
        setFavoriteJobs([]);
        await AsyncStorage.setItem("favoriteJobs", JSON.stringify([]));
      } else {
        setFavoriteScholarships([]);
        await AsyncStorage.setItem("favoriteScholarships", JSON.stringify([]));
      }
      refreshFavorites();
    } catch (error) {
      console.error("Error removing all favorites:", error);
    }
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

  const handleRemoveFavorite = async (item, isJob) => {
    try {
      if (isJob) {
        await authAPI.removeJobFavorite(user.username, item.id);
      } else {
        await authAPI.removeFavorite(user.username, item.id);
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

      refreshFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
    }
  };

  const renderItem = (dataType) => ({ item }) => {
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0] : null;
    const isJob = dataType === "jobs";
    const isRequested = isJob
      ? requestedJobs.has(item.id)
      : requestedScholarships.has(item.id);

    const handleRequestItem = async () => {
      const professor = item.contactProfessors?.[0];
      if (!professor?.email || !user?.username) return;

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
        }
      } catch (error) {
        console.error(`Failed to send ${isJob ? "job" : "scholarship"} request:`, error);
      }
    };

    return (
      <View style={styles.card}>
        {/* Image banner */}
        <View style={styles.imageBanner}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.bannerImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : (
            <View style={styles.bannerFallback}>
              <MaterialIcons name="image-not-supported" size={scale(36)} color="#94a3b8" />
            </View>
          )}

          <View style={styles.bannerOverlayTop}>
            <View style={[styles.typeBadge, isJob ? styles.typeBadgeJob : styles.typeBadgeScholarship]}>
              <Ionicons name={isJob ? "briefcase" : "school"} size={10} color="#fff" />
              <Text style={styles.typeBadgeText}>{isJob ? "Job" : "Scholarship"}</Text>
            </View>
            <TouchableOpacity
              style={styles.removeIconBtn}
              onPress={() => handleRemoveFavorite(item, isJob)}
              accessibilityLabel="Remove from favourites"
            >
              <Ionicons name="trash-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title || `Untitled ${isJob ? "Job" : "Scholarship"}`}
          </Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {item.university || `Unknown ${isJob ? "Organization" : "University"}`}
          </Text>
          <View style={styles.tagsRow}>
            {item.country ? <View style={styles.tag}><Text style={styles.tagText}>{item.country}</Text></View> : null}
            {item.major ? <View style={styles.tag}><Text style={styles.tagText}>{item.major}</Text></View> : null}
          </View>

          {/* Action row */}
          <View style={styles.cardActions}>
            {isRequested ? (
              <View style={styles.requestedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.requestedText}>Requested</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.requestBtn} onPress={handleRequestItem}>
                <Text style={styles.requestBtnText}>Send Request</Text>
                <Ionicons name="send" size={12} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = (dataType) => {
    const isJob = dataType === "jobs";
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isJob ? "briefcase-outline" : "school-outline"}
          size={64}
          color="#cbd5e1"
        />
        <Text style={styles.emptyTitle}>
          {refreshing
            ? "Loading..."
            : `No favourite ${isJob ? "jobs" : "scholarships"} yet`}
        </Text>
        <Text style={styles.emptySubtext}>
          {refreshing
            ? "Fetching your favourites…"
            : `Tap the heart icon on any ${isJob ? "job" : "scholarship"} to save it here.`}
        </Text>
      </View>
    );
  };

  if (!user || !user.username) {
    return (
      <View style={styles.container}>
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
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
            contentFit="contain"
          />
          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setShowMenu((v) => !v)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuBtn}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="menu" size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Underline tab bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => goToTab("scholarships")}
          >
            <Text style={[styles.tabLabel, selectedTab === "scholarships" && styles.tabLabelActive]}>
              Scholarships
              {favoriteScholarships.length > 0
                ? <Text style={styles.tabCount}> {favoriteScholarships.length}</Text>
                : null}
            </Text>
            {selectedTab === "scholarships" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => goToTab("jobs")}
          >
            <Text style={[styles.tabLabel, selectedTab === "jobs" && styles.tabLabelActive]}>
              Jobs
              {favoriteJobs.length > 0
                ? <Text style={styles.tabCount}> {favoriteJobs.length}</Text>
                : null}
            </Text>
            {selectedTab === "jobs" && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              disabled={currentData.length === 0}
              onPress={() => { handleRequestAll(); setShowMenu(false); }}
            >
              <Ionicons name="send" size={16} color={currentData.length === 0 ? "#cbd5e1" : "#004aad"} />
              <Text style={[styles.dropdownText, currentData.length === 0 && styles.dropdownTextDisabled]}>
                Request All
              </Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              disabled={currentData.length === 0}
              onPress={() => { handleRemoveAll(); setShowMenu(false); }}
            >
              <Ionicons name="trash-outline" size={16} color={currentData.length === 0 ? "#cbd5e1" : "#ef4444"} />
              <Text style={[styles.dropdownText, styles.dropdownTextDanger, currentData.length === 0 && styles.dropdownTextDisabled]}>
                Remove All
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView
        ref={pagerRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerScrollEnd}
        scrollEventThrottle={16}
      >
        <View style={[styles.pagePaneDivider, { width: pageWidth, height: "100%" }]}>
          <FlatList
            style={{ flex: 1 }}
            data={favoriteScholarships}
            renderItem={renderItem("scholarships")}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              paddingTop: scale(130),
              paddingBottom: scale(100),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#004aad"]}
              />
            }
            ListEmptyComponent={() => renderEmptyState("scholarships")}
          />
        </View>
        <View style={{ width: pageWidth, height: "100%" }}>
          <FlatList
            style={{ flex: 1 }}
            data={favoriteJobs}
            renderItem={renderItem("jobs")}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              paddingTop: scale(130),
              paddingBottom: scale(100),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#004aad"]}
              />
            }
            ListEmptyComponent={() => renderEmptyState("jobs")}
          />
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/CustomMail")}
        activeOpacity={0.85}
      >
        <Ionicons name="create" size={22} color="#fff" />
        <Text style={styles.fabText}>Edit Mail</Text>
      </TouchableOpacity>

      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
    </View>
  );
};

export default FavoriteItemsList;
