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
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { fetchScholarships } from "./service/BusinessfetchScholarships";
import { sendScholarshipEmail } from "./service/emailService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../components/AuthContext";
import LoaderModal from "../components/justmoment";
import BottomModal from "../components/BottomModal";
import NotificationModal from "../components/NotificationModal";

// Create an animated version of FlatList
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const modalHeight = screenHeight * 0.7;

const ScholarshipApp = () => {
  const [scholarships, setScholarships] = useState([]);
  const { user, logout } = useContext(AuthContext);
  const [checkingPaid, setCheckingPaid] = useState(true);
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

  const majors = [
    "Chemistry",
    "Computer Science",
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
    { name: "Malta", flag: "🇲🇹" }, // Corrected flag
    { name: "UK", flag: "🇬🇧" }, // Could also be "United Kingdom"
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

  const fundingTypes = ["full scholar", "Partial scholar"];

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await fetchScholarships();
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
      } finally {
        setCheckingPaid(false);
      }
    };
    checkPaidStatus();
  }, [user?.email]);

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

      return (
        <View style={styles.card}>
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
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.university}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFunding}>{item.funding} Scholar</Text>
              <Text style={styles.cardFunding}>{item.country}</Text>
              <Text style={styles.cardFunding}>{item.major}</Text>
              <TouchableOpacity
                onPress={() => handleFavorite(item.id)}
                style={styles.likeButton}
              >
                <FontAwesome
                  name={
                    favoriteScholarships.includes(item.id) ? "heart" : "heart-o"
                  }
                  size={25}
                  color={
                    favoriteScholarships.includes(item.id) ? "red" : "black"
                  }
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
              <Text style={styles.buttonText}> Request Scholarship</Text>
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

  const renderFilterOption = (label, options, selected, setSelected) => (
    <View style={styles.filterContainer}>
      <Text style={styles.filterLabel}> {label}</Text>
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
    ({ item }) => <ScholarshipCard item={item} />,
    [handleFavorite, favoriteScholarships]
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
            source={require("../assets/images/12.png")}
            style={styles.logo}
          />
          <View style={styles.iconsContainer}>
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={() => setShowFilterModal(true)}>
                <Ionicons name="funnel" size={25} color="#a5a4a4" />
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
                <Text style={styles.modalTitle}> Filter Scholarships</Text>
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
                  <Text style={styles.buttonText}> Apply Filters</Text>
                </TouchableOpacity>
              </ScrollView>
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
          ListFooterComponent={
            <View style={styles.subscribecontainer}>
              <Text style={styles.messageText}>
                More requests, more opportunities Subscribe to unlock 500+
                scholarships.
              </Text>
              <TouchableOpacity onPress={() => router.push("/Premium")}>
                <Text style={styles.subscribeLink}> Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          }
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
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
    backgroundColor: "#245292",
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
    color: "#007bff",
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
    color: "#007bff",
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
    backgroundColor: "#007bff",
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
    color: "#007bff",
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
