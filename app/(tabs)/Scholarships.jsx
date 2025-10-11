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
  Image,
  StatusBar,
  Animated,
  FlatList,
  Modal,
  Linking,
  ScrollView,
  Alert,
  Dimensions,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchScholarships } from "../service/scholarshipService";
import { sendScholarshipEmail } from "../service/emailService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../components/AuthContext";
import LoaderModal from "../../components/justmoment";
import BottomModal from "../../components/BottomModal";
import NotificationModal from "../../components/NotificationModal";
import { useNavigation } from "@react-navigation/native";

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const modalHeight = screenHeight * 0.7; // 70% of screen height

const ScholarshipApp = () => {
  const [scholarships, setScholarships] = useState([]);
  const { user } = useContext(AuthContext);
  const [checkingPaid, setCheckingPaid] = useState(true);
  const [selectedMajor, setSelectedMajor] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedFunding, setSelectedFunding] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [sortOrder, setSortOrder] = useState(""); // New state for sort order
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [selectedScholarshipId, setSelectedScholarshipId] = useState(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const filterModalY = useRef(new Animated.Value(screenHeight)).current;
  const navigation = useNavigation();
  const majors = [
    "Chemistry",
    "Computer Science",
    "Software Engineering",
    "Physics",
    "Engineering",
    "Natural Sciences",
    "Mathematics & Statistics",
    "Business & Economics",
    "Health Sciences",
  ];
  const countries = [
    { name: "Canada", flag: "🇨🇦" },
    { name: "United States", flag: "🇺🇸" },
    { name: "Sri Lanka", flag: "🇱🇰" },
    { name: "Malta", flag: "🇲🇹" },
    { name: "UK", flag: "🇬🇧" },
    { name: "Australia", flag: "🇦🇺" },
    { name: "Germany", flag: "🇩🇪" },
    { name: "France", flag: "🇫🇷" },
    { name: "Netherlands", flag: "🇳🇱" },
    { name: "Sweden", flag: "🇸🇪" },
    { name: "Switzerland", flag: "🇨🇭" },
    { name: "Japan", flag: "🇯🇵" },
    { name: "South Korea", flag: "🇰🇷" },
    { name: "China", flag: "🇨🇳" },
    { name: "New Zealand", flag: "🇳🇿" },
    { name: "Norway", flag: "🇳🇴" },
    { name: "Finland", flag: "🇫🇮" },
    { name: "Denmark", flag: "🇩🇰" },
    { name: "Italy", flag: "🇮🇹" },
    { name: "Spain", flag: "🇪🇸" },
    { name: "Austria", flag: "🇦🇹" },
    { name: "Belgium", flag: "🇧🇪" },
    { name: "Singapore", flag: "🇸🇬" },
    { name: "Malaysia", flag: "🇲🇾" },
    { name: "Turkey", flag: "🇹🇷" },
    { name: "Russia", flag: "🇷🇺" },
    { name: "Saudi Arabia", flag: "🇸🇦" },
    { name: "United Arab Emirates (UAE)", flag: "🇦🇪" },
    { name: "Qatar", flag: "🇶🇦" },
    { name: "Ireland", flag: "🇮🇪" },
    { name: "Portugal", flag: "🇵🇹" },
    { name: "South Africa", flag: "🇿🇦" },
  ];
  const fundingTypes = ["Full", "Partial"];
  const sortOptions = ["Ascending", "Descending"]; // New options for sorting

  const isPaidMember = user?.paidMember || false;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const [favoriteScholarships, setFavoriteScholarships] = useState([]);

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
      const favorites = await AsyncStorage.getItem("favoriteScholarships");
      if (favorites) setFavoriteScholarships(JSON.parse(favorites));
    };
    loadFavorites();

    if (user && user.email) fetchFavorites();
  }, [user]);

  useEffect(() => {
    AsyncStorage.setItem(
      "favoriteScholarships",
      JSON.stringify(favoriteScholarships)
    ).catch((error) =>
      console.error("Error saving favorite scholarships:", error)
    );
  }, [favoriteScholarships]);

  const fetchFavorites = async () => {
    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
          user.email
        )}/favorites`
      );
      if (!response.ok) throw new Error("Failed to fetch favorites");
      const data = await response.json();
      const favoriteIds = data.map((s) => s.id);
      setFavoriteScholarships(favoriteIds);
      await AsyncStorage.setItem(
        "favoriteScholarships",
        JSON.stringify(favoriteIds)
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
        const baseUrl = `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
          user.email
        )}/favorites/by-email`;
        const url = isFavorited ? `${baseUrl}/${id}` : baseUrl;
        const method = isFavorited ? "DELETE" : "POST";
        const body = isFavorited ? null : JSON.stringify(id);

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body,
        });

        if (!response.ok) {
          throw new Error(
            `Failed to ${isFavorited ? "remove" : "add"} favorite`
          );
        }
      } catch (error) {
        console.error(
          `Error ${isFavorited ? "removing" : "adding"} favorite:`,
          error
        );
        setFavoriteScholarships(favoriteScholarships);
        Alert.alert(
          "Error",
          `Could not ${isFavorited ? "remove" : "add"} favorite scholarship.`
        );
      }
    }, 300),
    [favoriteScholarships, user?.email]
  );

  const handleReport = async (scholarshipId, description) => {
    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Scholarships/${scholarshipId}/report`,
        {
          method: "POST",
          headers: {
            "accept": "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit report");
      Alert.alert("Success", "Report submitted successfully.");
      setShowReportModal(false);
      setReportMessage("");
      setSelectedScholarshipId(null);
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert("Error", "Could not submit report.");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = "https://webapplication2-old-pond-3577.fly.dev/api/Scholarships";
      if (sortOrder) {
        const ascending = sortOrder === "Ascending" ? "true" : "false";
        url = `https://webapplication2-old-pond-3577.fly.dev/api/Scholarships/sortByDate?ascending=${ascending}`;
      }
      const response = await fetch(url, {
        method: "GET",
        headers: { accept: "text/plain" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.errors?.ascending?.[0] || "Failed to fetch scholarships";
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setScholarships(data);
    } catch (error) {
      console.error("Error fetching scholarships:", error.message);
      Alert.alert("Error", error.message || "Could not fetch scholarship data.");
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
      if (!user?.email) {
        setCheckingPaid(false);
        return;
      }
      try {
        const response = await fetch(
          `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
            user.email
          )}`
        );
        if (!response.ok) throw new Error("Failed to fetch user data");
      } catch (error) {
        console.error("Error checking paid status:", error);
      } finally {
        setCheckingPaid(false);
      }
    };
    checkPaidStatus();
  }, [user?.email]);

  useEffect(() => {
    if (!checkingPaid && isPaidMember) fetchData();
  }, [isPaidMember, checkingPaid, sortOrder]);

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
    ({ item, handleFavorite, favoriteScholarships, setSelectedScholarshipId, setShowReportModal }) => {
      const [isCourseVisible, setIsCourseVisible] = useState(false);
      const [isUniversityVisible, setIsUniversityVisible] = useState(false);
      const [isProfessorsVisible, setIsProfessorsVisible] = useState(false);

      const handleRequestScholarship = async () => {
        const professor = item.contactProfessors?.[0];
        await sendScholarshipEmail(
          professor?.email,
          user?.email,
          item.title,
          professor
        );
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
          <View style={styles.imageContainer}>
            <FlatList
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              data={item.images}
              keyExtractor={(image, index) => `${item.id}-image-${index}`}
              renderItem={({ item: imageUri }) => (
                <Image
                  source={{ uri: imageUri }}
                  style={styles.cardImage}
                  resizeMode="cover"
                />
              )}
            />
            <TouchableOpacity
              style={styles.reportButton}
              onPress={() => {
                setSelectedScholarshipId(item.id);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.university}</Text>
            <Text style={styles.cardDate}>
              Posted: {formatDate(item.createdAt)}
            </Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFunding}>{item.funding} Scholar</Text>
              <Text style={styles.cardFunding}>{item.country}</Text>
              <Text style={styles.cardFunding}>{item.major}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={() => handleFavorite(item.id)}
                  style={styles.likeButton}
                >
                  <FontAwesome
                    name={
                      favoriteScholarships.includes(item.id)
                        ? "heart"
                        : "heart-o"
                    }
                    size={25}
                    color={
                      favoriteScholarships.includes(item.id) ? "red" : "black"
                    }
                  />
                </TouchableOpacity>
              </View>
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
                  <Text style={styles.boldText}>Website:</Text>{" "}
                  <Text
                    style={styles.linkText}
                    onPress={() => Linking.openURL(item.universityWebsite)}
                  >
                    {item.universityWebsite}
                  </Text>
                </Text>
                <Text style={styles.dropdownText}>
                  <Text style={styles.boldText}>Department Head:</Text>{" "}
                  {item.departmentHead?.name} ({item.departmentHead?.position})
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
                  {item.languageTests?.join(", ")}
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
                {item.contactProfessors?.map((professor, index) => (
                  <View
                    key={`${item.id}-professor-${index}`}
                    style={styles.professorContainer}
                  >
                    <Text style={styles.dropdownText}>
                      <Text style={styles.boldText}>Name:</Text>{" "}
                      {professor.name}
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

            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestScholarship}
            >
              <Text style={styles.buttonText}>Request Scholarship</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    (prevProps, nextProps) =>
      prevProps.item.id === nextProps.item.id &&
      prevProps.item === nextProps.item &&
      prevProps.favoriteScholarships === nextProps.favoriteScholarships
  );

  const router = useRouter();

  const renderFilterOption = (label, options, selected, setSelected) => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}>{label}</Text>
      <View style={styles.filterOptionsVertical}>
        {options.map((item) => {
          const displayText =
            typeof item === "string" ? item : `${item.flag} ${item.name}`;
          const value = typeof item === "string" ? item : item.name;
          return (
            <TouchableOpacity
              key={typeof item === "string" ? item : item.name}
              style={[
                styles.filterOption,
                selected === value && styles.filterOptionSelected,
              ]}
              onPress={() => setSelected(selected === value ? "" : value)}
            >
              <Text style={styles.filterOptionText}>{displayText}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }) => (
      <ScholarshipCard
        item={item}
        handleFavorite={handleFavorite}
        favoriteScholarships={favoriteScholarships}
        setSelectedScholarshipId={setSelectedScholarshipId}
        setShowReportModal={setShowReportModal}
      />
    ),
    [handleFavorite, favoriteScholarships, setSelectedScholarshipId, setShowReportModal]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Animated.View
        style={[styles.headerContainer, { opacity: headerOpacity }]}
      >
        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={styles.iconsContainer}>
            <TouchableOpacity
              style={styles.iconBackground}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="funnel" size={25} color="#a5a4a4" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBackground}
              onPress={() => setShowNotificationModal(true)}
            >
              <Ionicons name="notifications" size={25} color="#a5a4a4" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBackground}
              onPress={() => navigation.navigate("CustomMail")}
            >
              <Ionicons name="create" size={25} color="#a5a4a4" />
            </TouchableOpacity>
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
            style={[
              styles.bottomModalContent,
              {
                transform: [{ translateY: filterModalY }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
              >
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Ionicons name="close" size={30} color="gray" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Filter Scholarships</Text>
                    {renderFilterOption(
                  "Sort by Date",
                  sortOptions,
                  sortOrder,
                  setSortOrder
                )}
                {renderFilterOption(
                  "Major",
                  majors,
                  selectedMajor,
                  setSelectedMajor
                )}
                {renderFilterOption(
                  "Country",
                  countries,
                  selectedCountry,
                  setSelectedCountry
                )}
                {renderFilterOption(
                  "Funding",
                  fundingTypes,
                  selectedFunding,
                  setSelectedFunding
                )}
            
                <TouchableOpacity
                  style={styles.filterbutton}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={styles.buttonText}>Apply Filters</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowReportModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.reportModalContent}>
            <Text style={styles.modalTitle}>Report Scholarship</Text>
            <TextInput
              style={styles.reportInput}
              multiline
              placeholder="Enter your report message..."
              value={reportMessage}
              onChangeText={setReportMessage}
            />
            <View style={styles.reportButtonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setShowReportModal(false);
                  setReportMessage("");
                  setSelectedScholarshipId(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, reportMessage ? styles.submitButton : styles.disabledButton]}
                disabled={!reportMessage}
                onPress={() => handleReport(selectedScholarshipId, reportMessage)}
              >
                <Text style={styles.buttonText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
            contentContainerStyle={{ paddingBottom: 20 }}
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
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    elevation: 2,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: "4%",
    overflow: "hidden",
    elevation: 8,
  },
  imageContainer: {
    position: "relative",
  },
  cardImage: {
    width: screenWidth - screenWidth * 0.04,
    height: screenHeight * 0.33,
    borderRadius: 10,
  },
  reportButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cardContent: {
    padding: "3%",
  },
  cardTitle: {
    fontSize: screenWidth * 0.045,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: "1%",
    textBreakStrategy: "simple",
  },
  cardSubtitle: {
    fontSize: screenWidth * 0.035,
    color: "#666",
    marginBottom: "1%",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
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
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "white",
    backgroundColor: "#245292",
    paddingHorizontal: "2.5%",
    paddingVertical: "2%",
    borderRadius: 20,
    margin: "1%",
    textBreakStrategy: "simple",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  subscribecontainer: {
    padding: "4%",
  },
  logo: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.1,
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
    lineHeight: screenWidth * 0.05,
    marginBottom: "2%",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  boldText: {
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  linkText: {
    color: "#007bff",
    textDecorationLine: "underline",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
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
  cancelButton: {
    backgroundColor: "#666",
    marginRight: "2%",
  },
  submitButton: {
    backgroundColor: "#004aad",
  },
  disabledButton: {
    backgroundColor: "#cccccc",
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
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
    textBreakStrategy: "simple",
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
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#007bff",
    textBreakStrategy: "simple",
  },
  professorContainer: {
    marginBottom: "2%",
  },
  resultCount: {
    fontSize: screenWidth * 0.04,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginVertical: "2%",
    paddingHorizontal: "2%",
    textBreakStrategy: "simple",
  },
  filterContainer: {
    marginVertical: "2%",
    paddingHorizontal: "2%",
  },
  filterLabel: {
    fontSize: screenWidth * 0.045,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: "2%",
    textBreakStrategy: "simple",
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
    fontSize: screenWidth * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  filterOptionSelected: {
    backgroundColor: "#007bff",
    color: "white",
    fontSize: screenWidth * 0.035,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: "2%",
  },
  messageText: {
    fontSize: screenWidth * 0.04,
    color: "#333333",
    textAlign: "center",
    marginBottom: "3%",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  subscribeLink: {
    fontSize: screenWidth * 0.04,
    color: "#007bff",
    fontWeight: "700",
    fontFamily: "Roboto",
    textDecorationLine: "underline",
    textAlign: "center",
    textBreakStrategy: "simple",
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
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  reportModalContent: {
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: "4%",
    maxHeight: screenHeight * 0.5,
  },
  modalContent: {
    flex: 1,
    padding: "4%",
  },
  modalTitle: {
    fontSize: screenWidth * 0.05,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: "4%",
    textAlign: "center",
    textBreakStrategy: "simple",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  reportInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: "3%",
    minHeight: 100,
    marginBottom: "4%",
    fontSize: screenWidth * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  reportButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});

export default ScholarshipApp;