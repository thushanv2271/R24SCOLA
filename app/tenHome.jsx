import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ScrollView,
  Modal,
  Linking,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage
import LoaderModal from "../components/justmoment";

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
  const { email } = useLocalSearchParams();

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
          router.replace("/login"); // Redirect to login page
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
      const response = await fetch(
        "https://webapplication2-old-pond-3577.fly.dev/api/Scholarships"
      );
      if (!response.ok) throw new Error("Failed to fetch scholarships.");
      const data = await response.json();
      setScholarships(data);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Could not fetch scholarship data.");
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
    if (!email) {
      setShowLoginModal(true);
      return;
    }

    if (favorites.includes(scholarship)) {
      setFavorites(favorites.filter((fav) => fav.id !== scholarship.id));
    } else {
      setFavorites([...favorites, scholarship]);
    }
  };

  const sendScholarshipEmail = (email) => {
    const recipient = email;
    const subject = "Scholarship Application";
    const body = `Dear Professor,

I am writing to express my interest in applying for the scholarship program at your esteemed university. Please find my details attached below.

Looking forward to hearing from you.

Best regards,
[Your Name]`;

    const mailtoUrl = `mailto:${recipient}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    Linking.openURL(mailtoUrl).catch(() =>
      Alert.alert("Error", "Unable to open the email client.")
    );
  };

  const ScholarshipCard = ({ item }) => {
    const [isCourseVisible, setIsCourseVisible] = useState(false);
    const [isUniversityVisible, setIsUniversityVisible] = useState(false);
    const [isProfessorsVisible, setIsProfessorsVisible] = useState(false);

    return (
      <View style={styles.card}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.imageCarousel}
        >
          {item.images.map((imageUri, index) => (
            <Image
              key={`${item.id}-image-${index}`}
              source={{ uri: imageUri }}
              style={styles.cardImage}
            />
          ))}
        </ScrollView>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardSubtitle}>{item.university}</Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFunding}>{item.funding}</Text>
            <Text style={styles.cardFunding}>{item.country}</Text>
            <Text style={styles.cardFunding}>{item.major}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <Ionicons
                name={favorites.includes(item) ? "heart" : "heart-outline"}
                size={24}
                color={favorites.includes(item) ? "red" : "gray"}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setIsUniversityVisible(!isUniversityVisible)}
          >
            <Text style={styles.dropdownToggleText}>University Details</Text>
            <Ionicons
              name={isUniversityVisible ? "chevron-up" : "chevron-down"}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {isUniversityVisible && (
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>University:</Text>{" "}
                {item.university}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Details:</Text>{" "}
                {item.universityDetails}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Website:</Text>
                <Text
                  style={styles.linkText}
                  onPress={() => Linking.openURL(item.universityWebsite)}
                >
                  {item.universityWebsite}
                </Text>
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Department Head:</Text>{" "}
                {item.departmentHead.name} ({item.departmentHead.position})
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setIsCourseVisible(!isCourseVisible)}
          >
            <Text style={styles.dropdownToggleText}>Course Details</Text>
            <Ionicons
              name={isCourseVisible ? "chevron-up" : "chevron-down"}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {isCourseVisible && (
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Major:</Text> {item.major}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Type:</Text> {item.type}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Level:</Text> {item.level}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Language Tests:</Text>{" "}
                {item.languageTests.join(", ")}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Funding:</Text> {item.funding}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Course Value:</Text>{" "}
                {item.courseValue}
              </Text>
              <Text style={styles.dropdownText}>
                <Text style={styles.boldText}>Qualifications:</Text>{" "}
                {item.qualifications}
              </Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setIsProfessorsVisible(!isProfessorsVisible)}
          >
            <Text style={styles.dropdownToggleText}>Professor Details</Text>
            <Ionicons
              name={isProfessorsVisible ? "chevron-up" : "chevron-down"}
              size={20}
              color="gray"
            />
          </TouchableOpacity>
          {isProfessorsVisible && (
            <View style={styles.dropdownContent}>
              {item.contactProfessors.map((professor) => (
                <View key={professor.email} style={styles.professorContainer}>
                  <Text style={styles.dropdownText}>
                    <Text style={styles.boldText}>Name:</Text> {professor.name}
                  </Text>
                  <Text style={styles.dropdownText}>
                    <Text style={styles.boldText}>Position:</Text>{" "}
                    {professor.position}
                  </Text>
                  <Text style={styles.dropdownText}>
                    <Text style={styles.boldText}>Email:</Text>{" "}
                    {professor.email}
                  </Text>
                  <Text style={styles.dropdownText}>
                    <Text style={styles.boldText}>Research:</Text>{" "}
                    {professor.research}
                  </Text>
                  <Text style={styles.dropdownText}>
                    <Text style={styles.boldText}>Office:</Text>{" "}
                    {professor.office}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (email) {
                  sendScholarshipEmail(item.contactProfessors[0].email);
                } else {
                  setShowLoginModal(true);
                }
              }}
            >
              <Text style={styles.buttonText}>Request Scholarship</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.headerContainer, { opacity: headerOpacity }]}
      >
        <View style={styles.headerRow}>
          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
          />
          <View style={styles.iconsContainer}>
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={() => setShowLoginModal(true)}>
                <Ionicons name="funnel" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={() => setShowLoginModal(true)}>
                <Ionicons name="log-in" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.View>
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Login Required</Text>
            <Text style={styles.modalText}>
              Please log in to access this feature.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.loginButton]}
                onPress={() => {
                  setShowLoginModal(false);
                  router.push("/login");
                }}
              >
                <Text style={styles.modalButtonText}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalcancelButton, styles.cancelButton]}
                onPress={() => setShowLoginModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {loading ? (
        <View style={styles.loaderContainer}>
          <LoaderModal />
        </View>
      ) : (
        <View>
          <Text style={styles.resultCount}>
            Results: {filteredScholarships.length}
          </Text>
          <AnimatedFlatList
            data={filteredScholarships}
            renderItem={({ item }) => <ScholarshipCard item={item} />}
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
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          />
        </View>
      )}
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
  headerContainer: {
    position: "absolute",
    top: 25,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#f5f5f5",
    padding: 10,
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
    backgroundColor: "#ececec",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "Roboto",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardFunding: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "white",
    backgroundColor: "#a6a6a6",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 20,
  },
  logo: {
    width: 150,
    height: 50,
  },
  dropdownContent: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "white",
    borderRadius: 5,
    elevation: 2,
  },
  dropdownText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  boldText: {
    fontWeight: "bold",
    fontFamily: "Roboto",
  },
  linkText: {
    color: "#007bff",
    textDecorationLine: "underline",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
  },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  dropdownToggleText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "#007bff",
  },
  professorContainer: {
    marginBottom: 10,
  },
  cardImage: {
    width: screenWidth,
    height: screenheight,
    borderRadius: 10,
    marginRight: 10,
  },
  resultCount: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    marginBottom: 8,
  },
  button: {
    backgroundColor: "#004aad",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "#fff",
    paddingHorizontal: 10,
    marginRight: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "Roboto",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalcancelButton: {
    backgroundColor: "#FF154A",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginHorizontal: 3,
    elevation: 3,
  },
  modalButton: {
    backgroundColor: "#004aad",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    marginHorizontal: 3,
    elevation: 3,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "#fff",
    paddingHorizontal: 10,
    marginRight: 5,
  },
});

export default TenHome;