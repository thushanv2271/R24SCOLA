import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size, factor = 0.5) =>
  Math.min(
    Math.max(size + (scale(size) - size) * factor, size * 0.8),
    size * 1.5
  );

const ScholarshipCreateNew = () => {
  const [title, setTitle] = useState("");
  const [country, setCountry] = useState(null);
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState(null);
  const [funding, setFunding] = useState("");
  const [type, setType] = useState(null);
  const [level, setLevel] = useState(null);
  const [languageTests, setLanguageTests] = useState("");
  const [universityDetails, setUniversityDetails] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [universityWebsite, setUniversityWebsite] = useState("");
  const [departmentHead, setDepartmentHead] = useState({
    name: "",
    position: "",
    email: "",
    research: "",
    office: "",
  });
  const router = useRouter();

  const countryOptions = [
    { label: "USA", value: "usa" },
    { label: "UK", value: "uk" },
    { label: "Canada", value: "canada" },
    { label: "Australia", value: "australia" },
    { label: "Germany", value: "germany" },
    { label: "France", value: "france" },
    { label: "Japan", value: "japan" },
    { label: "Netherlands", value: "netherlands" },
    { label: "Sweden", value: "sweden" },
    { label: "New Zealand", value: "newzealand" },
  ];

  const majorOptions = [
    { label: "STEM (Science, Tech, Eng, Math)", value: "stem" },
    { label: "Business & Economics", value: "business" },
    { label: "Arts & Humanities", value: "arts" },
    { label: "Social Sciences", value: "social" },
    { label: "Health Sciences", value: "health" },
  ];

  const typeOptions = [
    { label: "Merit-Based", value: "merit" },
    { label: "Need-Based", value: "need" },
    { label: "Research", value: "research" },
    { label: "International", value: "international" },
  ];

  const levelOptions = [
    { label: "Undergraduate", value: "undergraduate" },
    { label: "Master's", value: "masters" },
    { label: "PhD", value: "phd" },
    { label: "Postdoctoral", value: "postdoctoral" },
  ];

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

  const handleSubmit = async () => {
    if (
      !title ||
      !country ||
      !university ||
      !major ||
      !funding ||
      !type ||
      !level ||
      !qualifications
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const scholarshipData = {
      id: Math.random().toString(36).substring(2), // Generate random ID
      title,
      country,
      university,
      major,
      funding,
      type,
      level,
      languageTests: languageTests ? languageTests.split(",").map((test) => test.trim()) : [],
      images: [], // Placeholder; could be extended to handle image uploads
      courseValue: funding, // Assuming funding can represent courseValue
      universityDetails,
      qualifications,
      universityWebsite,
      departmentHead: {
        name: departmentHead.name || "",
        position: departmentHead.position || "",
        email: departmentHead.email || "",
        research: departmentHead.research || "",
        office: departmentHead.office || "",
      },
      contactProfessors: [], // Placeholder; could be extended to add multiple professors
      likes: 0,
      createdAt: new Date().toISOString(),
      reports: [],
    };

    try {
      const response = await fetch("https://webapplication2-old-pond-3577.fly.dev/api/Scholarships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(scholarshipData),
      });

      if (response.status === 200) {
        Alert.alert("Success", "Scholarship created successfully!");
        // Reset form
        setTitle("");
        setCountry(null);
        setUniversity("");
        setMajor(null);
        setFunding("");
        setType(null);
        setLevel(null);
        setLanguageTests("");
        setUniversityDetails("");
        setQualifications("");
        setUniversityWebsite("");
        setDepartmentHead({
          name: "",
          position: "",
          email: "",
          research: "",
          office: "",
        });
      } else {
        Alert.alert("Error", "Failed to create scholarship. Please try again.");
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert("Error", "An error occurred while submitting. Please check your connection.");
    }
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.iconButton} onPress={handleBackPress}>
              <Ionicons name="arrow-back" size={moderateScale(24)} color="#a5a4a4" />
            </TouchableOpacity>
            <Image
              source={require("../assets/images/OPPORTUNITIES.png")}
              style={styles.logo}
            />
            <View style={styles.iconButton} />
          </View>
        </View>

        <LinearGradient colors={["#f5f5f5", "#f5f5f5"]} style={styles.gradient}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.subtitle}>Create a New Scholarship</Text>

            <TextInput
              style={styles.input}
              placeholder="Scholarship Title"
              value={title}
              onChangeText={setTitle}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Country"
              data={countryOptions}
              labelField="label"
              valueField="value"
              value={country}
              onChange={(item) => setCountry(item.value)}
            />
            <TextInput
              style={styles.input}
              placeholder="University"
              value={university}
              onChangeText={setUniversity}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Major"
              data={majorOptions}
              labelField="label"
              valueField="value"
              value={major}
              onChange={(item) => setMajor(item.value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Funding (e.g., $10,000 or Full Tuition)"
              value={funding}
              onChangeText={setFunding}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Scholarship Type"
              data={typeOptions}
              labelField="label"
              valueField="value"
              value={type}
              onChange={(item) => setType(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Study Level"

              data={levelOptions}
              labelField="label"
              valueField="value"
              value={level}
              onChange={(item) => setLevel(item.value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Language Tests (e.g., IELTS, TOEFL)"
              value={languageTests}
              onChangeText={setLanguageTests}
            />
            <TextInput
              style={styles.input}
              placeholder="University Details"
              value={universityDetails}
              onChangeText={setUniversityDetails}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Qualifications"
              value={qualifications}
              onChangeText={setQualifications}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="University Website"
              value={universityWebsite}
              onChangeText={setUniversityWebsite}
            />
            <Text style={styles.sectionTitle}>Department Head</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={departmentHead.name}
              onChangeText={(text) => setDepartmentHead({ ...departmentHead, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Position"
              value={departmentHead.position}
              onChangeText={(text) => setDepartmentHead({ ...departmentHead, position: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={departmentHead.email}
              onChangeText={(text) => setDepartmentHead({ ...departmentHead, email: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Research Interests"
              value={departmentHead.research}
              onChangeText={(text) => setDepartmentHead({ ...departmentHead, research: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Office"
              value={departmentHead.office}
              onChangeText={(text) => setDepartmentHead({ ...departmentHead, office: text })}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                <Text style={styles.buttonText}>Create Scholarship</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: "#f5f5f5",
    paddingTop: StatusBar.currentHeight || verticalScale(20),
    paddingHorizontal: scale(10),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  iconButton: {
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    elevation: 2,
  },
  logo: {
    width: scale(150),
    height: verticalScale(50),
    resizeMode: "contain",
    flex: 1,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  gradient: {
    flex: 1,
    marginTop: verticalScale(80),
  },
  scrollContent: {
    paddingHorizontal: scale(15),
    paddingVertical: verticalScale(20),
    alignItems: "center",
    minHeight: SCREEN_HEIGHT * 0.9,
  },
  subtitle: {
    fontSize: moderateScale(16),
    fontFamily: "Roboto",
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(20),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#2c3e50",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(10),
    alignSelf: "flex-start",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: "90%",
    maxWidth: scale(400),
    fontSize: moderateScale(16),
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: "#ddd",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: "90%",
    maxWidth: scale(400),
  },
});

export default ScholarshipCreateNew;
