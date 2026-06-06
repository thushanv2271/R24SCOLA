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
  StatusBar,
  Animated,
  FlatList,
  Dimensions,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAllScholarships } from "./service/ConsolidatedScholarshipService";
import { sendScholarshipEmail } from "./service/emailService";
import { AuthContext } from "../components/AuthContext";
import LoaderModal from "../components/JustMoment";
import BottomModal from "../components/BottomModal";
import NotificationModal from "../components/NotificationModal";
import { authAPI } from "../services/apiService";
import AlertModal from "../components/AlertModal";
import ScholarshipCardOptimized from "../components/ScholarshipCardOptimized";
import HeaderComponent from "../components/HeaderComponent";
import FilterModal from "../components/FilterModal";
import {
  MAJORS,
  COUNTRIES,
  FUNDING_TYPES,
  LANGUAGE_TESTS,
} from "../constants/filterOptions";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const modalHeight = screenHeight * 0.7; // 70% of screen height

const ScholarshipApp = () => {
  const [scholarships, setScholarships] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const [checkingPaid, setCheckingPaid] = useState(true);
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

  const isPaidMember = user?.paidMember || false;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const [favoriteScholarships, setFavoriteScholarships] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const favorites = await AsyncStorage.getItem("favoriteScholarships");
      if (favorites) setFavoriteScholarships(JSON.parse(favorites));
    };
    loadFavorites();

    if (user && user.username) fetchFavorites();
  }, [user]);

  useEffect(() => {
    AsyncStorage.setItem(
      "favoriteScholarships",
      JSON.stringify(favoriteScholarships),
    ).catch((error) =>
      console.error("Error saving favorite scholarships:", error),
    );
  }, [favoriteScholarships]);

  const fetchFavorites = async () => {
    try {
      const data = await authAPI.getFavorites(user.username);
      const favoriteIds = data.map((s) => s.id);
      setFavoriteScholarships(favoriteIds);
      await AsyncStorage.setItem(
        "favoriteScholarships",
        JSON.stringify(favoriteIds),
      );
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
      const isFavorited = favoriteScholarships.includes(id);
      const updatedFavorites = isFavorited
        ? favoriteScholarships.filter((favId) => favId !== id)
        : [...favoriteScholarships, id];

      setFavoriteScholarships(updatedFavorites);

      try {
        if (isFavorited) {
          await authAPI.removeFavorite(user.username, id);
        } else {
          await authAPI.addFavorite(user.username, id);
        }
      } catch (error) {
        console.error(
          `Error ${isFavorited ? "removing" : "adding"} favorite:`,
          error,
        );
        setFavoriteScholarships(favoriteScholarships);
        showAlert(
          "Error",
          `Could not ${isFavorited ? "remove" : "add"} favorite scholarship.`,
          "error",
        );
      }
    }, 300),
    [favoriteScholarships, user?.username],
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAllScholarships();
      setScholarships(data || []);
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
        console.error("Error checking paid status:", error);
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

  const router = useRouter();

  const handleRequestScholarship = useCallback(
    async (item) => {
      const professor = item.contactProfessors?.[0];
      const result = await sendScholarshipEmail(
        professor?.email,
        user?.username,
        item.title,
        professor,
      );
      if (result && !result.success) {
        showAlert("Error", result.error, "error");
      }
    },
    [user?.username],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ScholarshipCardOptimized
        item={item}
        isFavorite={favoriteScholarships.includes(item.id)}
        onFavoriteToggle={() => handleFavorite(item.id)}
        onRequestPress={handleRequestScholarship}
      />
    ),
    [handleFavorite, favoriteScholarships, handleRequestScholarship],
  );

  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent
        opacity={headerOpacity}
        logoSource={require("../assets/images/11.png")}
        showBack={true}
        showFilter={true}
        showHome={true}
        onBackPress={() => router.back()}
        onFilterPress={() => setShowFilterModal(true)}
        onHomePress={() => router.push("/")}
      />

      <BottomModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={[
          {
            label: "Major",
            options: MAJORS,
            selected: selectedMajor,
            setSelected: setSelectedMajor,
          },
          {
            label: "Country",
            options: COUNTRIES,
            selected: selectedCountry,
            setSelected: setSelectedCountry,
          },
          {
            label: "Funding",
            options: FUNDING_TYPES,
            selected: selectedFunding,
            setSelected: setSelectedFunding,
          },
        ]}
        onApplyFilters={() => setShowFilterModal(false)}
      />

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
          <FlatList
            data={filteredScholarships}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={5}
            removeClippedSubviews={true}
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
            { useNativeDriver: true },
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
        actions={
          alertConfig.actions.length > 0
            ? alertConfig.actions
            : [{ text: "OK", onPress: closeAlert }]
        }
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: "2%",
    paddingTop: StatusBar.currentHeight || 50,
  },
  headerContainer: {
    position: "absolute",
    top: 25,
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
    marginBottom: "2%",
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
    backgroundColor: "#004aad",
    paddingHorizontal: "2.5%",
    paddingVertical: "2%",
    borderRadius: 20,
    margin: "1%",
  },
  subscribecontainer: {
    padding: "4%",
  },
  logo: {
    width: screenWidth * 0.37,
    height: screenHeight * 0.06,
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
    color: "#004aad",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textDecorationLine: "underline",
  },
  button: {
    backgroundColor: "#004aad",
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
  filterbutton: {
    backgroundColor: "#004aad",
    paddingVertical: "4.5%",
    paddingHorizontal: "4%",
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "9%",
    marginBottom: "12%",
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
    color: "#004aad",
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
  filterContainer: {
    marginVertical: "2%",
    paddingHorizontal: "2%",
  },
  filterLabel: {
    fontSize: screenWidth * 0.045,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginBottom: "2%",
  },
  filterOptionsVertical: {
    flexDirection: "column",
    width: "100%",
  },
  filterOption: {
    backgroundColor: "#e0e0e0",
    padding: "2%",
    height: screenHeight * 0.06,
    marginBottom: "2%",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  filterOptionText: {
    color: "black",
    fontSize: screenWidth * 0.035,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  filterOptionSelected: {
    backgroundColor: "#004aad",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: "2%",
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
    color: "#004aad",
    textDecorationLine: "underline",
    textAlign: "center",
  },
  likeButton: {
    padding: "1%",
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalContent: {
    flex: 1,
    padding: "4%",
  },
  modalTitle: {
    fontSize: screenWidth * 0.05,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginBottom: "4%",
    textAlign: "center",
  },
});

export default ScholarshipApp;
