import React, { useContext } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { AuthContext } from "../components/AuthContext";
import { useLocalSearchParams, router } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function ScholarshipGuide() {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      Alert.alert("Error", "Unable to log out. Please retry.");
    }
  };

  const handleVideoPress = () => {
    // Placeholder function - Add your navigation or WebView logic here
    console.log("Play video: How to Use the App");
    router.push("https://www.youtube.com/watch?v=vBIJ7b47dFk");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <Animated.View style={styles.headerContainer} entering={FadeInDown}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={26} color="#a5a4a4" />
          </TouchableOpacity>

          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
          />

          <TouchableOpacity style={styles.iconButton} onPress={() => {}}>
            <Ionicons name="mail" size={26} color="#a5a4a4" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Scholarship Application Guide */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>


        <View style={styles.guideContainer}>
          <Text style={styles.mainTitle}>
            Your Guide to Scholarship Success
          </Text>
          <Text style={styles.introText}>
            Navigate the scholarship process with ease. Follow these 11 steps to
            maximize your chances of securing funding for your education.
          </Text>
        {/* Video Placeholder */}
        <Animated.View
          style={styles.videoContainer}
          entering={FadeInDown.delay(50)}
        >
          <TouchableOpacity onPress={handleVideoPress}>
            <View style={styles.videoThumbnail}>
              <Text style={styles.videoTitle}>How to Use This App</Text>
              <Ionicons
                name="play-circle"
                size={height * 0.08}
                color="#fff"
                style={styles.playIcon}
              />
            </View>
          </TouchableOpacity>
        </Animated.View>
          {/* Step 1: Create Account */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(100)}
          >
            <Text style={styles.stepTitle}>1. Create Account</Text>
            <Text style={styles.stepSubTitle}>Start Your Journey</Text>
            <Text style={styles.stepDescription}>
              Sign up on scholarship platforms or university portals to access
              exclusive opportunities and manage your applications efficiently.
            </Text>
            <Ionicons
              name="person-add"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 2: Login Account */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(200)}
          >
            <Text style={styles.stepTitle}>2. Login Account</Text>
            <Text style={styles.stepSubTitle}>Access Your Dashboard</Text>
            <Text style={styles.stepDescription}>
              Log in to your account to track progress, update details, and stay
              connected to new scholarship openings.
            </Text>
            <Ionicons
              name="log-in"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 3: Check Eligibility */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(300)}
          >
            <Text style={styles.stepTitle}>3. Check Eligibility</Text>
            <Text style={styles.stepSubTitle}>Match the Requirements</Text>
            <Text style={styles.stepDescription}>
              Review criteria like GPA, major, or residency to ensure you qualify
              before investing time in an application.
            </Text>
            <Ionicons
              name="checkmark-circle"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 4: Edit Email */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(400)}
          >
            <Text style={styles.stepTitle}>4. Edit Email</Text>
            <Text style={styles.stepSubTitle}>Keep Contact Info Current</Text>
            <Text style={styles.stepDescription}>
              Update your email address to ensure you receive notifications and
              responses from scholarship providers promptly.
            </Text>
            <Ionicons
              name="mail"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 5: Discover Scholarships According to Majors */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(500)}
          >
            <Text style={styles.stepTitle}>
              5. Discover Scholarships by Major
            </Text>
            <Text style={styles.stepSubTitle}>Find Tailored Opportunities</Text>
            <Text style={styles.stepDescription}>
              Search for scholarships specific to your field of study to increase
              relevance and your chances of success.
            </Text>
            <Ionicons
              name="search"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 6: Add Favourites List */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(600)}
          >
            <Text style={styles.stepTitle}>6. Add to Favourites List</Text>
            <Text style={styles.stepSubTitle}>Organize Your Picks</Text>
            <Text style={styles.stepDescription}>
              Bookmark scholarships that interest you for quick access and to
              prioritize your applications effectively.
            </Text>
            <Ionicons
              name="star"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 7: Request Scholarships */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(700)}
          >
            <Text style={styles.stepTitle}>7. Request Scholarships</Text>
            <Text style={styles.stepSubTitle}>Take the Initiative</Text>
            <Text style={styles.stepDescription}>
              Submit inquiries or preliminary applications to express interest
              and gather additional details if needed.
            </Text>
            <Ionicons
              name="paper-plane"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 8: Redirect to Gmail App */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(800)}
          >
            <Text style={styles.stepTitle}>8. Redirect to Gmail App</Text>
            <Text style={styles.stepSubTitle}>Stay Connected</Text>
            <Text style={styles.stepDescription}>
              Link to your Gmail app to manage correspondence with scholarship
              providers seamlessly.
            </Text>
            <Ionicons
              name="mail-open"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 9: Send Request Mail to University */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(900)}
          >
            <Text style={styles.stepTitle}>
              9. Send Request Mail to University
            </Text>
            <Text style={styles.stepSubTitle}>Formalize Your Application</Text>
            <Text style={styles.stepDescription}>
              Draft and send a professional email to the university requesting
              scholarship details or submitting your application.
            </Text>
            <Ionicons
              name="send"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 10: Apply More to Get More Chances */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(1000)}
          >
            <Text style={styles.stepTitle}>
              10. Apply More to Boost Chances
            </Text>
            <Text style={styles.stepSubTitle}>Increase Your Odds</Text>
            <Text style={styles.stepDescription}>
              Submit applications to multiple scholarships to maximize your
              opportunities for funding success.
            </Text>
            <Ionicons
              name="rocket"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>

          {/* Step 11: Wait for Response */}
          <Animated.View
            style={styles.stepSection}
            entering={FadeInDown.delay(1100)}
          >
            <Text style={styles.stepTitle}>11. Wait for the Response</Text>
            <Text style={styles.stepSubTitle}>Patience Pays Off</Text>
            <Text style={styles.stepDescription}>
              Check your Gmail regularly for replies from universities or
              scholarship committees and prepare for next steps.
            </Text>
            <Ionicons
              name="time"
              size={height * 0.1}
              color="#3b82f6"
              style={styles.stepIcon}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
    paddingTop: StatusBar.currentHeight || 40,
  },
  headerContainer: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
  logo: {
    width: width * 0.45,
    height: height * 0.06,
    resizeMode: "contain",
  },
  scrollViewContent: {
    paddingHorizontal: 10,
    paddingTop: height * 0.12,
    paddingBottom: 40,
  },
  videoContainer: {
    marginBottom: 20,
  },
  videoThumbnail: {
    width: "100%",
    height: height * 0.2,
    backgroundColor: "#000",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  videoTitle: {
    position: "absolute",
    top: 10,
    left: 10,
    color: "#fff",
    fontSize: width * 0.045,
    fontWeight: "600",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 5,
    borderRadius: 5,
  },
  playIcon: {
    opacity: 0.9,
  },
  guideContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mainTitle: {
    fontSize: width * 0.065,
    fontWeight: "700",
    color: "#1e3a8a",
    textAlign: "center",
    marginBottom: 15,
  },
  introText: {
    fontSize: width * 0.04,
    color: "#4b5563",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  stepSection: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  stepTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#1e3a8a",
    marginBottom: 5,
  },
  stepSubTitle: {
    fontSize: width * 0.045,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: width * 0.04,
    color: "#6b7280",
    lineHeight: 24,
    marginBottom: 15,
  },
  stepIcon: {
    alignSelf: "center",
  },
});