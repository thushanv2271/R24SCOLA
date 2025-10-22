import React, { useState, useRef, useEffect, useContext } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
  Animated,
  ScrollView,
  Dimensions,
  Linking, // Add this import
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../components/AuthContext";

// Screen dimensions
const { width, height } = Dimensions.get("window");
const cardWidth = width * 0.94;
const SPACING = 16;

const SocialMediaApp = () => {
  const [loading, setLoading] = useState(true);
  const scrollY = useRef(new Animated.Value(0)).current;
  const { user, logout } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    setLoading(false);
  }, [router]);

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

  const socialPlatforms = [
    {
      title: "Twitter",
      icon: "logo-twitter",
      telegramLink: "https://t.me/twitter", // Replace with actual Telegram link
      features: [
        "Real-time updates",
        "Hashtag tracking",
        "Tweet threads",
        "Direct messaging",
      ],
      description: "Connect with the world in 280 characters",
      color: "#1DA1F2",
    },
    {
      title: "Instagram",
      icon: "logo-instagram",
      telegramLink: "https://t.me/instagram", // Replace with actual Telegram link
      features: ["Photo sharing", "Stories", "Reels", "IGTV"],
      description: "Share your visual story",
      color: "#E1306C",
    },
    {
      title: "Facebook",
      icon: "logo-facebook",
      telegramLink: "https://t.me/facebook", // Replace with actual Telegram link
      features: ["News Feed", "Groups", "Events", "Marketplace"],
      description: "Stay connected with friends and family",
      color: "#4267B2",
    },
    {
      title: "LinkedIn",
      icon: "logo-linkedin",
      telegramLink: "https://t.me/linkedin", // Replace with actual Telegram link
      features: [
        "Professional networking",
        "Job listings",
        "Company pages",
        "Articles",
      ],
      description: "Build your professional network",
      color: "#0077B5",
    },
    {
      title: "TikTok",
      icon: "musical-note",
      telegramLink: "https://t.me/tiktok", // Replace with actual Telegram link
      features: ["Short videos", "Live streaming", "Effects", "Duets"],
      description: "Create and discover short videos",
      color: "#000000",
    },
    {
      title: "YouTube",
      icon: "logo-youtube",
      telegramLink: "https://t.me/youtube", // Replace with actual Telegram link
      features: ["Video content", "Live streaming", "Playlists", "Comments"],
      description: "Watch and share videos",
      color: "#FF0000",
    },
    {
      title: "Snapchat",
      icon: "logo-snapchat",
      telegramLink: "https://t.me/snapchat", // Replace with actual Telegram link
      features: ["Snaps", "Stories", "Filters", "Chat"],
      description: "Share moments that disappear",
      color: "#FFFC00",
    },
  ];

  const handleCardPress = async (telegramLink) => {
    try {
      const supported = await Linking.canOpenURL(telegramLink);
      if (supported) {
        await Linking.openURL(telegramLink);
      } else {
        console.log("Telegram app is not installed");
        // Fallback: Open in browser
        await Linking.openURL(telegramLink);
      }
    } catch (error) {
      console.error("Error opening Telegram link:", error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#a5a4a4" />
          </TouchableOpacity>
          <Image
            source={require("../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
          />
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="search" size={24} color="#a5a4a4" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {socialPlatforms.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => handleCardPress(item.telegramLink)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>

            <Text style={styles.cardDescription}>{item.description}</Text>

            <View style={styles.featuresContainer}>
              {item.features.map((feature, featureIndex) => (
                <View key={featureIndex} style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={item.color}
                  />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.exploreText}>Join Telegram</Text>
              <Ionicons name="arrow-forward" size={20} color={item.color} />
            </View>
          </TouchableOpacity>
        ))}
        <View style={styles.bottomSpacer} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 40,
    padding: SPACING,
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
    width: 150,
    height: 50,
    resizeMode: "contain",
  },
  scrollView: {
    flex: 1,
    marginTop: 100,
  },
  scrollContent: {
    padding: SPACING,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: SPACING,
    marginBottom: SPACING,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 74, 173, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1A237E",
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#444",
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 12,
  },
  exploreText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#004AAD",
  },
  bottomSpacer: {
    height: SPACING * 2,
  },
});

export default SocialMediaApp;
