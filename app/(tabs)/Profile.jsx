import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../../components/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./../../components/Header";
import { useLocalSearchParams, router } from "expo-router";
import LoaderModal from "../../components/justmoment";

const { width, height } = Dimensions.get("window");

export default function ProfileScreen() {
  const { user, logout } = useContext(AuthContext);
  const [paidMember, setPaidMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({});

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (user?.email) {
        try {
          const response = await fetch(
            `https://webapplication2-old-pond-3577.fly.dev/api/Users/${encodeURIComponent(
              user.email
            )}`,
            { method: "GET", headers: { Accept: "application/json" } }
          );
          if (response.ok) {
            const data = await response.json();
            setPaidMember(data.paidMember);
            setEditedData(data);
          } else {
            console.error("Failed to fetch user details");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserDetails();
  }, [user?.email]);

  const handleChange = (field, value) => {
    setEditedData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        style={{ flex: 1 }}
      >
        <View style={styles.card}>
          <View style={styles.profilePictureContainer}>
            <Image
              source={{
                uri:
                  user?.profilePicture ||
                  "https://img.freepik.com/free-psd/contact-icon-illustration-isolated_23-2151903337.jpg",
              }}
              style={styles.profilePicture}
            />
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.title}>{user?.title}</Text>
          </View>

          <View style={styles.bioContainer}>
            <Text style={styles.bio}>{user?.bio}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>  Personal Information</Text>
            <View style={styles.sectionContent}>
              <Text style={styles.label}>Username:</Text>
              <Text style={styles.value}>{user?.email}</Text>

              {/* <Text style={styles.label}>Age:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={String(editedData.age)}
                  onChangeText={(text) =>
                    handleChange("age", parseInt(text, 10))
                  }
                  keyboardType="numeric"
                  placeholder="Enter your age"
                />
              ) : (
                <Text style={styles.value}>{user?.age}</Text>
              )}

              <Text style={styles.label}>Country:</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={editedData.country}
                  onChangeText={(text) => handleChange("country", text)}
                  placeholder="Enter your country"
                />
              ) : (
                <Text style={styles.value}>{user?.country}</Text>
              )}

              <Text style={styles.label}>Paid Member:</Text>
              <Text style={styles.value}>{paidMember ? "Yes" : "No"}</Text> */}
            </View>
          </View>

          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#fff" />
            <Text style={styles.logoutButtonText}>  Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollViewContent: {
    padding: width * 0.05,
    marginTop: height * 0.08,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 26,
    padding: width * 0.05,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 35,
  },
  profilePictureContainer: {
    alignItems: "center",
    marginBottom: height * -0.15,
  },
  profilePicture: {
    width: width * 0.3,
    height: width * 0.3,
    borderRadius: width * 0.15,
    borderColor: "#e5e7eb",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  name: {
    fontSize: width * 0.06,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1f2937",
  },
  title: {
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#6b7280",
    marginTop: height * 0.01,
  },
  bioContainer: {
    marginBottom: height * 0.03,
  },
  bio: {
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textAlign: "center",
    color: "#4b5563",
  },
  section: {
    marginBottom: height * 0.03,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1f2937",
    marginBottom: height * 0.01,
  },
  sectionContent: {
    paddingLeft: width * 0.02,
  },
  label: {
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#6b7280",
    marginBottom: height * 0.01,
  },
  value: {
    fontSize: width * 0.045,
    fontWeight: "500",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1f2937",
    marginBottom: height * 0.01,
  },
  input: {
    height: height * 0.06,
    borderColor: "#d1d5db",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: width * 0.03,
    marginBottom: height * 0.01,
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    backgroundColor: "#f9fafb",
  },
  logoutButton: {
    marginTop: height * 0.03,
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.05,
    backgroundColor: "#ef4444",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: width * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    marginLeft: width * 0.02,
  },
});