import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useContext,
  useCallback,
} from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  FlatList,
  Modal,
  Linking,
  ScrollView,
  Dimensions,
  RefreshControl,
  Image,
} from "react-native";
import FastImage from 'react-native-fast-image';
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchScholarships } from "./service/itjobsfetch";
import { sendJobEmail } from "./service/emailService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../components/AuthContext";
import { authAPI } from "../services/apiService";
import LoaderModal from "../components/JustMoment";
import BottomModal from "../components/BottomModal";
import NotificationModal from "../components/NotificationModal";
import AlertModal from "../components/AlertModal";
import { MAJORS, COUNTRIES, FUNDING_TYPES } from "../constants/filterOptions";

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const modalHeight = screenHeight * 0.82;

const ScholarshipApp = () => {
  const [scholarships, setScholarships] = useState([]);
  const { user, logout, favoritesRefreshTrigger } = useContext(AuthContext);
  const [checkingPaid, setCheckingPaid] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info", actions: [] });
  const showAlert = (title, message, type = "info", actions = []) => { setAlertConfig({ visible: true, title, message, type, actions }); };
  const closeAlert = () => { setAlertConfig({ ...alertConfig, visible: false }); };
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedFunding, setSelectedFunding] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const filterModalY = useRef(new Animated.Value(screenHeight)).current;

  // Use imported constants (not recreated on every render)
  const majors = MAJORS;
  const countries = COUNTRIES;
  const fundingTypes = FUNDING_TYPES;

  const isPaidMember = user?.paidMember || false;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const [favoriteJobs, setFavoriteJobs] = useState([]);

  useEffect(() => {
    if (showFilterModal) {
      Animated.timing(filterModalY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterModalY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showFilterModal]);

  useEffect(() => {
    const loadFavorites = async () => {
      const favorites = await AsyncStorage.getItem("favoriteJobs");
      if (favorites) setFavoriteJobs(JSON.parse(favorites));
    };
    loadFavorites();

    if (user && user.username) fetchFavorites();
  }, [user, favoritesRefreshTrigger]);

  useEffect(() => {
    AsyncStorage.setItem("favoriteJobs", JSON.stringify(favoriteJobs)).catch(
      (error) => console.error("Error saving favorite jobs:", error)
    );
  }, [favoriteJobs]);

  const fetchFavorites = async () => {
    try {
      const data = await authAPI.getJobFavorites(user.username);
      const favoriteIds = Array.isArray(data) ? data.map((s) => s.id) : [];
      setFavoriteJobs(favoriteIds);
      await AsyncStorage.setItem("favoriteJobs", JSON.stringify(favoriteIds));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleFavorite = useCallback(
    debounce(async (id) => {
      const isFavorited = favoriteJobs.includes(id);
      const updatedFavorites = isFavorited
        ? favoriteJobs.filter((favId) => favId !== id)
        : [...favoriteJobs, id];

      setFavoriteJobs(updatedFavorites);

      try {
        if (isFavorited) {
          await authAPI.removeJobFavorite(user.username, id);
        } else {
          await authAPI.addJobFavorite(user.username, id);
        }
      } catch (error) {
        console.error(
          `Error ${isFavorited ? "removing" : "adding"} favorite:`,
          error
        );
        setFavoriteJobs(favoriteJobs);
        showAlert(
          "Error",
          error?.message ||
            `Could not ${isFavorited ? "remove" : "add"} favorite job.`,
          "error"
        );
      }
    }, 300),
    [favoriteJobs, user?.username]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchScholarships();
      setScholarships(data);
    } catch (error) {
      console.error(error);
      showAlert("Error", "Could not fetch scholarship data.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  useEffect(() => {
    const checkPaidStatus = async () => {
      if (!user?.username) {
        setCheckingPaid(false);
        return;
      }
      try {
        await authAPI.getUserByUsername(user.username);
      } catch (error) {
      } finally {
        setCheckingPaid(false);
      }
    };
    checkPaidStatus();
  }, [user?.username]);

  useEffect(() => {
    if (!checkingPaid && isPaidMember) fetchData();
  }, [isPaidMember, checkingPaid]);

  useEffect(() => {
    fetchData();
  }, []);

  const filteredScholarships = useMemo(() => {
    return scholarships.filter((item) => {
      const majorMatch = !selectedMajor || item.major === selectedMajor;
      const countryMatch = !selectedCountry || item.country === selectedCountry;
      const fundingMatch = !selectedFunding || item.funding === selectedFunding;
      const testMatch =
        !selectedTest || item.languageTests?.includes(selectedTest);
      return majorMatch && countryMatch && fundingMatch && testMatch;
    });
  }, [
    scholarships,
    selectedMajor,
    selectedCountry,
    selectedFunding,
    selectedTest,
  ]);

  const ScholarshipCard = React.memo(
    ({ item }) => {
      const [isCourseVisible, setIsCourseVisible] = useState(false);
      const [isCompanyVisible, setIsCompanyVisible] = useState(false);
      const [isProfessorsVisible, setIsProfessorsVisible] = useState(false);

      const handleRequestScholarship = async () => {
        const professor = item.contactProfessors?.[0];
        const result = await sendJobEmail(
          professor?.email,
          user?.username,
          item.title,
          professor
        );
        if (result && !result.success) {
          showAlert("Error", result.error, "error");
        }
      };

      const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      };

      return (
        <View style={styles.card}>
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            data={item.images}
            keyExtractor={(image, index) => `${item.id}-image-${index}`}
            renderItem={({ item: imageUri }) => (
              <FastImage
                source={{
                  uri: imageUri,
                  cache: FastImage.cacheControl.immutable,
                  priority: FastImage.priority.normal,
                }}
                style={styles.cardImage}
                resizeMode={FastImage.resizeMode.cover}
              />
            )}
          />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.university}</Text>
            <Text style={styles.cardDate}>
              Posted: {formatDate(item.createdAt)}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFunding}>Jobs</Text>
              <Text style={styles.cardFunding}>{item.country}</Text>
              <Text style={styles.cardFunding}>{item.major}</Text>
              <TouchableOpacity
                onPress={() => handleFavorite(item.id)}
                style={styles.likeButton}
              >
                <FontAwesome
                  name={favoriteJobs.includes(item.id) ? "heart" : "heart-o"}
                  size={32}
                  color={favoriteJobs.includes(item.id) ? "red" : "#555"}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.dropdownToggle}
              onPress={() => setIsProfessorsVisible(!isProfessorsVisible)}
            >
              <Text style={styles.dropdownToggleText}>Company Details</Text>
              <Ionicons
                name={isProfessorsVisible ? "chevron-up" : "chevron-down"}
                size={20}
                color="gray"
              />
            </TouchableOpacity>
            {isProfessorsVisible && (
              <View style={styles.dropdownContent}>
                {item.contactProfessors?.map((professor, index) => (
                  <View
                    key={`${item.id}-professor-${index}`}
                    style={styles.professorContainer}
                  >
                    <Text style={styles.dropdownText}>
                      <Text style={styles.boldText}>Website:</Text>{" "}
                      <Text
                        style={styles.linkText}
                        onPress={() => Linking.openURL(item.universityWebsite)}
                      >
                        {item.universityWebsite}
                      </Text>
                    </Text>

                    <Text style={styles.dropdownText}>
                      <Text style={styles.boldText}>Email:</Text>{" "}
                      {professor.email}
                    </Text>

                    <Text style={styles.dropdownText}>
                      <Text style={styles.boldText}>Office:</Text>{" "}
                      {professor.office}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestScholarship}
            >
              <Text style={styles.buttonText}>Request Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    (prevProps, nextProps) =>
      prevProps.item.id === nextProps.item.id &&
      prevProps.item === nextProps.item
  );

  const router = useRouter();

  const activeFilterCount = [selectedMajor, selectedCountry, selectedFunding, selectedTest].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedMajor("");
    setSelectedCountry("");
    setSelectedFunding("");
    setSelectedTest("");
  };

  const renderChipGroup = (label, options, selected, setSelected) => (
    <View style={styles.chipGroup}>
      <Text style={styles.chipGroupLabel}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((item) => {
          const displayText = typeof item === "string" ? item : `${item.flag} ${item.name}`;
          const value = typeof item === "string" ? item : item.name;
          const isSelected = selected === value;
          return (
            <TouchableOpacity
              key={value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => setSelected(isSelected ? "" : value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {displayText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }) => <ScholarshipCard item={item} />,
    [handleFavorite, favoriteJobs]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.headerContainer, { opacity: headerOpacity }]}
      >
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
            <TouchableOpacity
              style={[styles.iconBackground, activeFilterCount > 0 && styles.iconBackgroundActive]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="funnel" size={22} color={activeFilterCount > 0 ? "#fff" : "#a5a4a4"} />
              {activeFilterCount > 0 && (
                <View style={styles.filterActiveBadge}>
                  <Text style={styles.filterActiveBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.iconBackground}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => router.push("/")}
              >
                <Ionicons name="home" size={24} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>

      <BottomModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <Animated.View
            style={[styles.bottomModalContent, { transform: [{ translateY: filterModalY }] }]}
          >
            <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
              <View style={styles.dragHandle} />

              <View style={styles.filterHeader}>
                <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.filterHeaderClose}>
                  <Ionicons name="close" size={22} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.filterHeaderTitle}>
                  Filters {activeFilterCount > 0 && <Text style={styles.filterBadge}> {activeFilterCount}</Text>}
                </Text>
                <TouchableOpacity onPress={resetFilters} style={styles.filterHeaderReset}>
                  <Text style={styles.filterHeaderResetText}>Reset all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterDivider} />

              <ScrollView
                contentContainerStyle={styles.filterScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {renderChipGroup("Major", majors, selectedMajor, setSelectedMajor)}
                <View style={styles.filterDivider} />
                {renderChipGroup("Country", countries, selectedCountry, setSelectedCountry)}
              </ScrollView>

              <View style={styles.filterFooter}>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowFilterModal(false)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.applyButtonText}>
                    Show Results{filteredScholarships.length > 0 ? ` · ${filteredScholarships.length}` : ""}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {!checkingPaid && (
        <Text style={styles.resultCount}>
          Results: {filteredScholarships.length}
        </Text>
      )}

      {checkingPaid ? (
        <View style={styles.loaderContainer}>
          <LoaderModal />
        </View>
      ) : isPaidMember ? (
        loading ? (
          <View style={styles.loaderContainer}>
            <LoaderModal />
          </View>
        ) : (
          <AnimatedFlatList
            data={filteredScholarships}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        )
      ) : (
        <AnimatedFlatList
          data={filteredScholarships.slice(0, 20)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions.length > 0 ? alertConfig.actions : [{ text: "OK", onPress: closeAlert }]}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: "2%",
    paddingTop: StatusBar.currentHeight || 50,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f8fafc",
    paddingTop: StatusBar.currentHeight || 30,
    paddingHorizontal: 10,
    paddingBottom: 10,
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
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: "4%",
    overflow: "hidden",
    elevation: 8,
    borderTopWidth: 4,
    borderTopColor: "#166534",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: "3%",
  },
  cardTitle: {
    fontSize: screenWidth * 0.045,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginBottom: "1%",
  },
  cardSubtitle: {
    fontSize: screenWidth * 0.035,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#666",
    marginBottom: "1%",
  },
  cardDate: {
    fontSize: screenWidth * 0.03,
    color: "#666",
    marginBottom: "2%",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
  },
  cardFunding: {
    fontSize: screenWidth * 0.03,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "white",
    backgroundColor: "#166534",
    paddingHorizontal: "2.5%",
    paddingVertical: "2%",
    borderRadius: 20,
    margin: "1%",
  },
  subscribecontainer: {
    padding: "4%",
  },
  logo: {
    width: 150,
    height: 50,
  },
  dropdownContent: {
    marginTop: "2%",
    padding: "2%",
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 2,
  },
  dropdownText: {
    fontSize: screenWidth * 0.035,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    lineHeight: screenWidth * 0.05,
    marginBottom: "2%",
  },
  boldText: {
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  linkText: {
    color: "#166534",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#166534",
    paddingVertical: "2.5%",
    paddingHorizontal: "4%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "2%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
  },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: "2%",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dropdownToggleText: {
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#166534",
  },
  professorContainer: {
    marginBottom: "2%",
  },
  cardImage: {
    width: screenWidth - screenWidth * 0.04,
    height: screenHeight * 0.33,
    borderRadius: 10,
  },
  resultCount: {
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginVertical: "2%",
    paddingHorizontal: "2%",
  },
  likeButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    width: "100%",
    height: modalHeight,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  filterHeaderClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  filterHeaderTitle: {
    fontSize: screenWidth * 0.047,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  filterBadge: {
    color: "#166534",
    fontWeight: "700",
  },
  filterHeaderReset: {
    paddingHorizontal: 4,
  },
  filterHeaderResetText: {
    fontSize: screenWidth * 0.037,
    color: "#166534",
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  filterDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  filterScrollContent: {
    paddingBottom: 16,
  },
  chipGroup: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chipGroupLabel: {
    fontSize: screenWidth * 0.038,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Roboto",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  chipSelected: {
    backgroundColor: "#166534",
    borderColor: "#166534",
  },
  chipText: {
    fontSize: screenWidth * 0.035,
    color: "#374151",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  filterFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#166534",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#166534",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: screenWidth * 0.042,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  iconBackgroundActive: {
    backgroundColor: "#166534",
  },
  filterActiveBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  filterActiveBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  messageText: {
    fontSize: screenWidth * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#333333",
    textAlign: "center",
    marginBottom: "3%",
  },
  subscribeLink: {
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#166534",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});

export default ScholarshipApp;

