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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../components/AuthContext";

// Screen dimensions
const { width, height } = Dimensions.get("window");
const cardWidth = width * 0.94;
const SPACING = 16;

const MastersScholarshipApp = () => {
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

  

  const categories = [
    {
      title: "Computer Science",
      icon: "terminal",
      route: "MComputerScience",
      subcategories: [
        "Machine Learning",
        "Distributed Systems",
        "Advanced Algorithms",
        "Human-Computer Interaction",
      ],
      description: "Advanced funding for tech leaders and researchers",
      color: "#1E88E5",
    },
    {
      title: "Chemistry",
      icon: "flask",
      route: "MChemistry",
      subcategories: [
        "Synthetic Chemistry",
        "Materials Science",
        "Chemical Biology",
        "Computational Chemistry",
      ],
      description: "Grants for cutting-edge chemical research",
      color: "#43A047",
    },
    {
      title: "Engineering",
      icon: "prism",
      route: "MEngineering",
      subcategories: [
        "Renewable Energy Systems",
        "Structural Engineering",
        "Robotics",
        "Aerospace Engineering",
      ],
      description: "Support for advanced engineering solutions",
      color: "#F4511E",
    },
    {
      title: "Natural Sciences",
      icon: "leaf",
      route: "MNaturalScience",
      subcategories: [
        "Molecular Biology",
        "Quantum Physics",
        "Climate Science",
        "Ecology",
      ],
      description: "Research funding for scientific discovery",
      color: "#8E24AA",
    },
    {
      title: "Mathematics & Statistics",
      icon: "pie-chart",
      route: "MStatictics",
      subcategories: [
        "Mathematical Modeling",
        "Stochastic Processes",
        "Data Analytics",
        "Cryptography",
      ],
      description: "Scholarships for advanced quantitative research",
      color: "#D81B60",
    },
    {
      title: "Business & Economics",
      icon: "storefront",
      route: "MBusiness",
      subcategories: [
        "Global Finance",
        "Strategic Management",
        "Behavioral Economics",
        "Supply Chain Management",
      ],
      description: "Funding for future industry leaders",
      color: "#FBC02D",
    },
    {
      title: "Health Sciences",
      icon: "medical",
      route: "MHealthScience",
      subcategories: [
        "Epidemiology",
        "Health Policy",
        "Clinical Research",
        "Biostatistics",
      ],
      description: "Support for advanced healthcare studies",
      color: "#039BE5",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#a5a4a4" />
          </TouchableOpacity>
          <Image
            source={require("../assets/images/mastersMain.png")} // Update this to your Master's logo
            style={styles.logo}
          />
 
                 <TouchableOpacity
                      style={styles.iconButton}
                      onPress={() => router.push("/")}
                    >
                      <Ionicons name="home" size={24} color="#a5a4a4" />
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


        {categories.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.card, { borderLeftColor: item.color }]}
            onPress={() => router.push(item.route)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name={item.icon} size={28} color={item.color} />
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
            </View>

            <Text style={styles.cardDescription}>{item.description}</Text>

            <View style={styles.subcategoriesContainer}>
              {item.subcategories.map((sub, subIndex) => (
                <View key={subIndex} style={styles.subcategoryItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={item.color}
                  />
                  <Text style={styles.subcategoryText}>{sub}</Text>
                </View>
              ))}
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.exploreText}>Explore Scholarships</Text>
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
  subcategoriesContainer: {
    marginBottom: 12,
  },
  subcategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  subcategoryText: {
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

export default MastersScholarshipApp;