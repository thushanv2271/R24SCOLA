import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  RefreshControl,
  Dimensions,
  FlatList,
  ScrollView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import LoaderModal from "../../components/justmoment";
import NotificationModal from "../../components/NotificationModal";

const { width, height } = Dimensions.get("window");

const bannerData = [
  {
    id: 1,
    imageUrl:
      "https://admissions.uc.edu/content/dam/refresh/admissions/digital-swag/Facebook-Cover-820x360.jpg",
    text: "Explore New Horizons",
  },
  {
    id: 2,
    imageUrl:
      "https://www.ndsu.edu/fileadmin/_migrated/pics/NDSU.globe_2014.jpg",
    text: "Join Our Community Today",
  },
  {
    id: 3,
    imageUrl:
      "https://www.cumuonline.org/wp-content/uploads/cumu-coalition-urban-metropolitan-universities.png",
    text: "Exclusive Scholarship Opportunities",
  },
  {
    id: 4,
    imageUrl:
      "https://admissions.uc.edu/content/dam/refresh/admissions/digital-swag/Campus_CoverPhoto.jpg",
    text: "Unlock Your Potential",
  },
];

const ScholarshipHome = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const { email = "" } = useLocalSearchParams();
  const navigation = useNavigation();
  const [paidMember, setPaidMember] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userID");
        if (storedUser) {
          console.log(`The current user ID is: ${storedUser}`);
        } else {
          console.log("User ID not found in AsyncStorage.");
        }
      } catch (error) {
        console.error("Error fetching user ID:", error);
      }
    };

    fetchUserId();
  }, []);

  useEffect(() => {
    const fetchPaidStatus = async () => {
      try {
        const response = await fetch(
          `https://webapplication2-old-pond-3577.fly.dev/api/Users/${email}`
        );
        const userData = await response.json();
        setPaidMember(userData.paidMember);
      } catch (error) {
        console.error("Error fetching paid status:", error);
      }
    };

    if (email) fetchPaidStatus();
  }, [email]);

  useEffect(() => {
    const loadData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -width * 0.75 : 0;
    Animated.timing(sidebarAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return "🌞 Good Morning!";
    else if (hours < 18) return "🌤️ Good Afternoon!";
    else return "🌙 Good Evening!";
  };

  function getUserName(email) {
    if (!email) return "User";
    const username = email.split("@")[0];
    return username.length > 10
      ? username.slice(0, 10)
      : username.padEnd(5, " ");
  }

  const sidebarItems = [
    { title: "Home", icon: "home", screen: "index" },
    { title: "Profile", icon: "person", screen: "Profile", params: { email } },
    { title: "Scholarships", icon: "school", screen: "Scholarships" },
    { title: "Jobs", icon: "briefcase", screen: "JobInside" },
    { title: "Favourites", icon: "heart", screen: "favourites" },
    { title: "Edit Mail", icon: "create", screen: "CustomMail" },
  ];

  const renderSidebarItem = ({ item }) => (
    <TouchableOpacity
      style={styles.sidebarItem}
      onPress={() => {
        if (item.action) {
          item.action();
        } else {
          navigation.navigate(item.screen, item.params || {});
        }
        toggleSidebar();
      }}
    >
      <Ionicons name={item.icon} size={24} color="#fff" />
      <Text style={styles.sidebarItemText}>{item.title}</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    switch (item.type) {
      case "mainHeader":
        return (
          <View style={[styles.mainHeader, { width: width * 0.9 }]}>
            <View>
              <Text style={styles.userName}>
                Hi, {getUserName(item.data.email)}
              </Text>
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.accountStatus}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? "#4CAF50" : "#FF0000" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? "Active" : "Offline"}
                </Text>
              </View>
              <Text style={styles.cardTitle}>
                {paidMember ? "Premium Member" : "Basic Member"}
              </Text>
            </View>
          </View>
        );

      case "banner":
        return (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.bannerContainer, { height: height * 0.31 }]}
          >
            {item.data.map((banner) => (
              <View key={banner.id} style={styles.banner}>
                <Image
                  source={{ uri: banner.imageUrl }}
                  style={styles.bannerImage}
                />
                <Text style={styles.bannerText}>{banner.text}</Text>
              </View>
            ))}
          </ScrollView>
        );

      case "mainActions":
        return (
          <View>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <FlatList
              data={item.data}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate(item.screen)}
                >
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Ionicons name={item.icon} size={40} color="#FFC107" />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.title}
              numColumns={2}
              columnWrapperStyle={styles.cardRow}
            />
          </View>
        );


      default:
        return null;
    }
  };

  const data = [
    { type: "mainHeader", data: { email } },
    { type: "banner", data: bannerData },
    {
      type: "mainActions",
      data: [
        { title: "Jobs", icon: "briefcase", screen: "JobInside" },
        // { title: "Create new", icon: "briefcase", screen: "ScholarshipCreateNew" },
        // { title: "Circle", icon: "briefcase", screen: "JobInside" },
        {
          title: "Check Your Eligibility",
          icon: "checkmark-circle",
          screen: "ScholarshipCalculator",
        },
        { title: "Edit Mail", icon: "create", screen: "CustomMail" },
        { title: "Favourites", icon: "heart", screen: "favourites" },
        {
          title: "Explore Universities",
          icon: "school",
          screen: "Scholarships",
        },
      ],
    },
    {
      type: "academicPathways",
      data: [
        {
          title: "Request for Bachelor's",
          icon: "school",
          screen: "BachalorsInside",
          color: "#1E88E5",
          description: "Start your undergraduate journey with funding support",
        },
        {
          title: "Request for Masters",
          icon: "book",
          screen: "MastersInside",
          color: "#43A047",
          description: "Advance your expertise with graduate scholarships",
        },
        {
          title: "Request for PhD",
          icon: "flask",
          screen: "PhdInside",
          color: "#F4511E",
          description: "Secure funding for groundbreaking research",
        },
      ],
    },
    { type: "services", icon: "cog" },
  ];

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
          />
          <View style={styles.iconsContainer}>
            <View style={styles.iconBackground}>
              <TouchableOpacity
                onPress={() => router.push(`/Profile?email=${email}`)}
              >
                <Ionicons name="person" size={25} color="#a5a4a4" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconBackground}>
              <TouchableOpacity onPress={() => setShowNotificationModal(true)}>
                <Ionicons name="notifications" size={25} color="#a5a4a4" />
              </TouchableOpacity>
              
            </View>


               <View style={styles.iconBackground}>
                 <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="menu" size={30} color="#a5a4a4" />
          </TouchableOpacity>
              
            </View>
         
          </View>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [{ translateX: sidebarAnim }],
          },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>Scola Menu</Text>
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="close" size={35} color="#fff" />
          </TouchableOpacity>
        </View>
        <FlatList
          data={sidebarItems}
          renderItem={renderSidebarItem}
          keyExtractor={(item) => item.title}
          contentContainerStyle={styles.sidebarContent}
        />
      </Animated.View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <LoaderModal />
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item, index) => item.type + index}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
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
  headerContainer: {
    position: "absolute",
    top: "5%",
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
  },
  logo: {
    width: 150,
    height: 50,
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
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
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    marginTop: 87,
    height: 125,
    backgroundColor: "#fff",
    margin: 10,
    borderRadius: 18,
    elevation: 3,
  },
  greeting: {
    fontSize: width * 0.04,
    marginTop: 10,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: 5,
    textBreakStrategy: "simple",
  },
  userName: {
    fontSize: width * 0.044,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#1a237e",
    textBreakStrategy: "simple",
  },
  accountStatus: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 8,
    marginRight: 4,
  },
  statusText: {
    color: "#666",
    fontSize: width * 0.06,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  bannerContainer: {
    marginVertical: 18,
    height: height * 0.31,
  },
  banner: {
    width: 320,
    height: 170,
    borderRadius: 18,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  bannerImage: {
    flex: 1,
    justifyContent: "center",
  },
  bannerText: {
    position: "absolute",
    bottom: 16,
    left: 16,
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Roboto",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textBreakStrategy: "simple",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 100,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginHorizontal: 5,
    marginBottom: 30,
    flex: 1,
  },
  cardTitle: {
    fontSize: width * 0.039,
    color: "#004aad",
    fontWeight: "800",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: 16,
    marginLeft: 10,
    textBreakStrategy: "simple",
  },
  cardRow: {
    justifyContent: "space-between",
    marginHorizontal: 5,
    gap: 10,
  },
  academicCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
    width: width * 0.9,
    alignSelf: "center",
  },
  academicCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  academicCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 74, 173, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  academicCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#1A237E",
    textBreakStrategy: "simple",
  },
  academicCardDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  academicCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  academicExploreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#004AAD",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: width * 0.75,
    backgroundColor: "#1A237E",
    zIndex: 20,
    paddingTop: StatusBar.currentHeight || 50,
  },
  sidebarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Roboto",
  },
  sidebarContent: {
    padding: 16,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  sidebarItemText: {
    fontSize: 16,
    color: "#fff",
    marginLeft: 16,
    fontFamily: "Roboto",
    fontWeight: "500",
  },
});

export default ScholarshipHome;