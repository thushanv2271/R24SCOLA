import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  StatusBar,
  useWindowDimensions,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { AuthContext } from "../../components/AuthContext";
import { sendScholarshipEmail } from "../service/emailService";
import { useRouter, useFocusEffect } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const FavoriteItemsList = () => {
  const { user, refreshFavorites } = useContext(AuthContext);
  const [favoriteScholarships, setFavoriteScholarships] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [requestedScholarships, setRequestedScholarships] = useState(new Set());
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigation = useNavigation();
  const scaleFactor = screenWidth / 375;
  const scale = (size) => Math.min(size * scaleFactor, size * 1.5);

  // Load requested scholarships from AsyncStorage when the component mounts
  useEffect(() => {
    const loadRequestedScholarships = async () => {
      try {
        const storedData = await AsyncStorage.getItem("requestedScholarships");
        if (storedData) {
          const parsedData = new Set(JSON.parse(storedData));
          setRequestedScholarships(parsedData);
        }
      } catch (error) {
        console.error("Failed to load requested scholarships:", error);
        Alert.alert("Error", "Could not load requested scholarships data.");
      }
    };
    loadRequestedScholarships();
  }, []);

  // Save requested scholarships to AsyncStorage whenever it changes
  useEffect(() => {
    const saveRequestedScholarships = async () => {
      try {
        await AsyncStorage.setItem(
          "requestedScholarships",
          JSON.stringify([...requestedScholarships])
        );
      } catch (error) {
        console.error("Failed to save requested scholarships:", error);
        Alert.alert("Error", "Could not save requested scholarships data.");
      }
    };
    saveRequestedScholarships();
  }, [requestedScholarships]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: "#f5f5f5",
          paddingHorizontal: scale(10),
          paddingBottom: scale(10),
        },
        headerContainer: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: "#f5f5f5",
          paddingTop: StatusBar.currentHeight || scale(30),
          paddingHorizontal: scale(10),
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
        iconBackground: {
          backgroundColor: "#f1f5f9",
          borderRadius: 50,
          padding: 8,
          elevation: 2,
          width: 45,
          height: 45,
          justifyContent: "center",
          alignItems: "center",
          marginHorizontal: 5,
        },
        logo: {
          width: scale(160),
          height: scale(60),
          resizeMode: "contain",
        },
        title: {
          marginTop: scale(80),
          fontFamily: "Poppins_700Bold",
          fontSize: scale(24),
          fontWeight: "700",
          color: "#333",
          textAlign: "center",
          textBreakStrategy: "simple",
        },
        card: {
          backgroundColor: "#fff",
          top: scale(12),
          borderRadius: scale(12),
          marginVertical: scale(8),
          padding: scale(12),
          shadowColor: "#000",
          shadowOffset: { width: 0, height: scale(2) },
          shadowOpacity: 0.2,
          shadowRadius: scale(5),
          elevation: scale(4),
        },
        cardHeader: {
          flexDirection: "row",
          alignItems: "center",
          marginBottom: scale(10),
        },
        imageContainer: {
          width: scale(80),
          height: scale(80),
          borderRadius: scale(8),
          backgroundColor: "#f0f0f0",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        },
        cardTitle: {
          fontFamily: "Poppins_600SemiBold",
          fontSize: scale(16),
          fontWeight: "600",
          color: "#333",
          textBreakStrategy: "simple",
        },
        cardSubtitle: {
          fontFamily: "Poppins_400Regular",
          fontSize: scale(14),
          color: "#666",
          fontStyle: "italic",
          textBreakStrategy: "simple",
        },
        buttonContainer: {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: scale(10),
        },
        button: {
          backgroundColor: "#004aad",
          paddingVertical: scale(10),
          paddingHorizontal: scale(16),
          borderRadius: scale(30),
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          marginRight: scale(10),
        },
        buttonRequested: {
          backgroundColor: "#002961",
        },
        buttonText: {
          fontSize: scale(16),
          fontWeight: "700",
          fontFamily: "Roboto",
          color: "#fff",
          textBreakStrategy: "simple",
        },
        requestAllText: {
          fontSize: scale(16),
          fontFamily: "Roboto",
          color: "#004aad",
          textDecorationLine: "underline",
          textAlign: "center",
          marginTop: scale(10),
          marginHorizontal: scale(10),
        },
        requestAllTextDisabled: {
          color: "#cccccc",
          textDecorationLine: "none",
        },
        removeButton: {
          backgroundColor: "#ff4d4d",
          padding: scale(10),
          borderRadius: scale(28),
          justifyContent: "center",
          alignItems: "center",
        },
        emptyText: {
          textAlign: "center",
          fontFamily: "Poppins_400Regular",
          color: "#888",
          fontSize: scale(16),
          marginTop: screenHeight * 0.2,
          textBreakStrategy: "simple",
        },
      }),
    [scale, screenWidth, screenHeight]
  );

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

  const fetchFavoriteScholarships = useCallback(async (email) => {
    try {
      const response = await fetch(
        `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURI(
          email
        )}/favorites`
      );
      if (!response.ok) throw new Error("Failed to fetch favorites");
      const data = await response.json();
      setFavoriteScholarships(data);
    } catch (error) {
      Alert.alert("Error", "Could not fetch favorite scholarships.");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.email) {
      await fetchFavoriteScholarships(user.email);
    }
  };

  const handleRequestAllScholarships = async () => {
    if (!user?.email) {
      Alert.alert("Error", "Please log in to request scholarships.");
      return;
    }

    // Filter out already requested scholarships and those without valid professor emails
    const scholarshipsToRequest = favoriteScholarships.filter(
      (scholarship) =>
        !requestedScholarships.has(scholarship.id) &&
        scholarship.contactProfessors?.[0]?.email
    );

    if (scholarshipsToRequest.length === 0) {
      Alert.alert(
        "Info",
        "No new scholarships to request or missing professor emails."
      );
      return;
    }

    // Collect all professor emails
    const professorEmails = scholarshipsToRequest
      .map((scholarship) => scholarship.contactProfessors[0].email)
      .join(",");

    // Create email body with all scholarship details
    const scholarshipList = scholarshipsToRequest
      .map(
        (scholarship, index) =>
          `${index + 1}. ${scholarship.title || "Untitled Scholarship"} (${
            scholarship.university || "Unknown University"
          })`
      )
      .join("\n");
    const emailBody = `Request for the following scholarships:\n\n${scholarshipList}`;

    try {
      // Send single email to all professor emails
      await sendScholarshipEmail(
        professorEmails,
        user.email,
        "Scholarship Request for Multiple Favorites",
        { name: "Multiple Recipients" },
        emailBody
      );

      // Mark all scholarships as requested
      const newRequested = new Set(requestedScholarships);
      scholarshipsToRequest.forEach((scholarship) =>
        newRequested.add(scholarship.id)
      );
      setRequestedScholarships(newRequested);

      Alert.alert(
        "Success",
        `${scholarshipsToRequest.length} scholarship${
          scholarshipsToRequest.length > 1 ? "s" : ""
        } requested successfully!`
      );
    } catch (error) {
      console.error("Failed to send scholarship request email:", error);
      Alert.alert("Error", "Failed to send scholarship request email.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.email) {
        setRefreshing(true);
        fetchFavoriteScholarships(user.email);
      }
    }, [user, fetchFavoriteScholarships])
  );

  useEffect(() => {
    if (user?.email) fetchFavoriteScholarships(user.email);
  }, [refreshFavorites, user, fetchFavoriteScholarships]);

  const renderItem = ({ item }) => {
    const imageUrl =
      item.images && item.images.length > 0 ? item.images[0] : null;
    const isRequested = requestedScholarships.has(item.id);

    const handleRequestScholarship = async () => {
      const professor = item.contactProfessors?.[0];
      if (!professor?.email || !user?.email) {
        Alert.alert("Error", "Missing email information.");
        return;
      }

      try {
        await sendScholarshipEmail(
          professor.email,
          user.email,
          item.title,
          professor
        );
        setRequestedScholarships((prev) => {
          const newSet = new Set(prev);
          newSet.add(item.id);
          return newSet;
        });
        Alert.alert("Success", "Scholarship request sent successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to send scholarship request.");
      }
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.imageContainer}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: scale(8),
                }}
                resizeMode="cover"
              />
            ) : (
              <MaterialIcons
                name="image-not-supported"
                size={scale(40)}
                color="#888"
              />
            )}
          </View>
          <View style={{ flex: 1, paddingLeft: scale(12) }}>
            <Text style={styles.cardTitle}>
              {item.title || "Untitled Scholarship"}
            </Text>
            <Text style={styles.cardSubtitle}>
              {item.university || "Unknown University"}
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, isRequested && styles.buttonRequested]}
            onPress={handleRequestScholarship}
          >
            <Text style={styles.buttonText}>
              {isRequested ? "Requested" : "Request Scholarship"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!user || !user.email) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Please log in to view your favorite scholarships.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.headerContainer}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={scale(24)} color="#a5a4a4" />
          </TouchableOpacity>
          <Image
            source={require("../../assets/images/OPPORTUNITIES.png")}
            style={styles.logo}
          />
          <TouchableOpacity
            style={styles.iconBackground}
            onPress={() => navigation.navigate("CustomMail")}
          >
            <Ionicons name="create" size={25} color="#a5a4a4" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleRequestAllScholarships}
          disabled={favoriteScholarships.length === 0}
        >
          <Text
            style={[
              styles.requestAllText,
              favoriteScholarships.length === 0 &&
                styles.requestAllTextDisabled,
            ]}
          >
            Request All
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={favoriteScholarships}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{
          paddingTop: scale(120),
          paddingBottom: scale(20),
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2e7d32"]}
          />
        }
        ListEmptyComponent={() => (
          <Text style={styles.emptyText}>
            {refreshing ? "Refreshing..." : "No favorite scholarships yet."}
          </Text>
        )}
      />
    </View>
  );
};

export default FavoriteItemsList;
