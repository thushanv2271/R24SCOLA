import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoaderModal from "../components/JustMoment";
import { getAllScholarships } from "../app/service/ConsolidatedScholarshipService";
import AlertModal from "../components/AlertModal";
import ScholarshipCardOptimized from "../components/ScholarshipCardOptimized";
import LoginModal from "../components/LoginModal";
import HeaderComponent from "../components/HeaderComponent";

const screenWidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height / 3;

const TenHome = () => {
  const [scholarships, setScholarships] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedFunding, setSelectedFunding] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
  const router = useRouter();
  const { username } = useLocalSearchParams();
  const isLoggedIn = Boolean(username);
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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Check if the page has been viewed before and redirect to login if true
  useEffect(() => {
    const checkFirstVisit = async () => {
      try {
        const hasVisited = await AsyncStorage.getItem("hasVisitedTenHome");
        if (hasVisited === "true") {
          router.replace("/Login"); // Redirect to login page
        } else {
          // Fetch scholarships and mark the page as visited
          fetchScholarships();
          await AsyncStorage.setItem("hasVisitedTenHome", "true");
        }
      } catch (error) {
        console.error("Error checking first visit:", error);
      }
    };

    checkFirstVisit();
  }, []);

  const fetchScholarships = async () => {
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
    fetchScholarships();
  };

  const filteredScholarships = useMemo(() => {
    return scholarships.filter((item) => {
      const majorMatch = !selectedMajor || item.major === selectedMajor;
      const countryMatch = !selectedCountry || item.country === selectedCountry;
      const fundingMatch = !selectedFunding || item.funding === selectedFunding;
      const typeMatch = !selectedType || item.type === selectedType;
      const levelMatch = !selectedLevel || item.level === selectedLevel;
      const testMatch =
        !selectedTest || item.languageTests.includes(selectedTest);

      return (
        majorMatch &&
        countryMatch &&
        fundingMatch &&
        typeMatch &&
        levelMatch &&
        testMatch
      );
    });
  }, [
    scholarships,
    selectedMajor,
    selectedCountry,
    selectedFunding,
    selectedType,
    selectedLevel,
    selectedTest,
  ]);

  const toggleFavorite = (scholarship) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    if (favorites.includes(scholarship)) {
      setFavorites(favorites.filter((fav) => fav.id !== scholarship.id));
    } else {
      setFavorites([...favorites, scholarship]);
    }
  };

  const handleRequestScholarship = (item) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    // Open email client
    const email = item.contactProfessors?.[0]?.email || "";
    if (email) {
      const subject = "Scholarship Application";
      const body = `Dear Professor,\n\nI am writing to express my interest in applying for the scholarship program at your esteemed university.\n\nBest regards,\n[Your Name]`;
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      import("react-native").then(({ Linking }) => {
        Linking.openURL(mailtoUrl).catch(() =>
          showAlert("Error", "Unable to open the email client.", "error"),
        );
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <HeaderComponent
        opacity={headerOpacity}
        logoSource={require("../assets/images/OPPORTUNITIES.png")}
        showFilter={false}
        showHome={false}
        onFilterPress={() => setShowLoginModal(true)}
        onHomePress={() => setShowLoginModal(true)}
      />

      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={() => {
          setShowLoginModal(false);
          router.push("/Login");
        }}
      />

      {loading ? (
        <View style={styles.loaderContainer}>
          <LoaderModal />
        </View>
      ) : (
        <View>
          {(() => {
            const visibleScholarships = filteredScholarships.slice(0, 5);
            return (
              <>
                <Text style={styles.resultCount}>
                  Results: {visibleScholarships.length}
                </Text>
                <FlatList
                  data={visibleScholarships}
                  renderItem={({ item }) => (
                    <ScholarshipCardOptimized
                      item={item}
                      isFavorite={favorites.includes(item)}
                      onFavoriteToggle={toggleFavorite}
                      onRequestPress={handleRequestScholarship}
                    />
                  )}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={styles.listContainer}
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={handleRefresh}
                      colors={["#007bff"]}
                      tintColor="#007bff"
                    />
                  }
                  maxToRenderPerBatch={5}
                  windowSize={5}
                  removeClippedSubviews={true}
                  initialNumToRender={3}
                />
              </>
            );
          })()}
        </View>
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
    padding: 10,
    paddingTop: StatusBar.currentHeight || 50,
  },
  listContainer: {
    paddingBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  resultCount: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    marginBottom: 8,
    marginTop: 60,
  },
});

export default TenHome;
