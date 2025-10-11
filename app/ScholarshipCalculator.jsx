import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size, factor = 0.5) =>
  Math.min(
    Math.max(size + (scale(size) - size) * factor, size * 0.8),
    size * 1.5
  );

const ScholarshipPossibilityCalculator = () => {
  const [gpa, setGpa] = useState(null);
  const [ielts, setIelts] = useState(null);
  const [country, setCountry] = useState(null);
  const [researchInterest, setResearchInterest] = useState(null);
  const [studyField, setStudyField] = useState(null);
  const [extracurriculars, setExtracurriculars] = useState(null);
  const [financialNeed, setFinancialNeed] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [possibility, setPossibility] = useState(0);
  const [feedback, setFeedback] = useState("");
  const navigation = useNavigation();
  const router = useRouter();

  const handleBackPress = () => {
    router?.back() || console.log("Navigation failed: router is undefined");
  };

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

  const gpaOptions = [
    { label: "4.0 (Excellent)", value: 4.0 },
    { label: "3.7-3.9 (Very Good)", value: 3.8 },
    { label: "3.4-3.6 (Good)", value: 3.5 },
    { label: "3.0-3.3 (Average)", value: 3.0 },
    { label: "< 3.0 (Below Average)", value: 2.5 },
  ];

  const ieltsOptions = [
    { label: "8.0-9.0 (Expert)", value: 8.5 },
    { label: "7.0-7.5 (Very Good)", value: 7.25 },
    { label: "6.0-6.5 (Competent)", value: 6.25 },
    { label: "5.0-5.5 (Modest)", value: 5.25 },
    { label: "< 5.0 (Limited)", value: 4.5 },
    { label: "Not Applicable", value: null },
  ];

  const researchOptions = [
    { label: "High (Published Papers)", value: 3 },
    { label: "Moderate (Research Experience)", value: 2 },
    { label: "Basic (Some Projects)", value: 1 },
    { label: "None", value: 0 },
  ];

  const fieldOptions = [
    { label: "STEM (Science, Tech, Eng, Math)", value: "stem" },
    { label: "Business & Economics", value: "business" },
    { label: "Arts & Humanities", value: "arts" },
    { label: "Social Sciences", value: "social" },
    { label: "Health Sciences", value: "health" },
  ];

  const extracurricularOptions = [
    { label: "High (Leadership Roles)", value: 3 },
    { label: "Moderate (Club Participation)", value: 2 },
    { label: "Basic (Some Activities)", value: 1 },
    { label: "None", value: 0 },
  ];

  const financialNeedOptions = [
    { label: "High (Low Income)", value: 3 },
    { label: "Moderate (Middle Income)", value: 2 },
    { label: "Low (High Income)", value: 1 },
    { label: "None (No Need)", value: 0 },
  ];

  const calculatePossibility = () => {
    if (
      !gpa ||
      (ielts === undefined && country !== "japan") ||
      !country ||
      !researchInterest ||
      !studyField ||
      !extracurriculars ||
      !financialNeed
    ) {
      Alert.alert("Error", "Please complete all required fields");
      return;
    }

    let score = 0;
    const maxScore = 100;
    let feedbackText = [];

    const minRequirements = {
      usa: { gpa: 3.0, ielts: 6.5 },
      uk: { gpa: 3.0, ielts: 6.5 },
      canada: { gpa: 3.2, ielts: 6.0 },
      australia: { gpa: 3.0, ielts: 6.0 },
      germany: { gpa: 3.0, ielts: 5.5 },
      france: { gpa: 3.0, ielts: 5.5 },
      japan: { gpa: 3.0, ielts: null },
      netherlands: { gpa: 3.0, ielts: 6.0 },
      sweden: { gpa: 3.0, ielts: 6.0 },
      newzealand: { gpa: 3.0, ielts: 6.0 },
    };

    const reqs = minRequirements[country];
    if (gpa < reqs.gpa) {
      feedbackText.push(`GPA too low for ${country}. Minimum: ${reqs.gpa}.`);
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }
    if (reqs.ielts && ielts !== null && ielts < reqs.ielts) {
      feedbackText.push(
        `IELTS too low for ${country}. Minimum: ${reqs.ielts}.`
      );
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }

    const gpaScore = Math.min((gpa - 2.0) / 2.0, 1) * 40;
    score += gpaScore;
    if (gpa < 3.3)
      feedbackText.push("GPA above 3.3 significantly boosts chances.");

    let ieltsScore = 0;
    if (country === "japan" && ielts === null) {
      ieltsScore = 20;
    } else if (ielts !== null) {
      ieltsScore = Math.min((ielts - 4.0) / 5.0, 1) * 20;
      if (ielts < 6.5 && reqs.ielts)
        feedbackText.push("IELTS 6.5+ is competitive.");
    }
    score += ieltsScore;

    const researchScore = (researchInterest / 3) * 15;
    score += researchScore;
    if (researchInterest < 2 && studyField === "stem") {
      feedbackText.push("Research experience is key for STEM scholarships.");
    }

    const extraScore = (extracurriculars / 3) * 10;
    score += extraScore;

    const needScore = (financialNeed / 3) * 10;
    score += needScore;
    if (financialNeed === 0)
      feedbackText.push("Financial need can boost need-based scholarships.");

    const competitiveness = {
      usa: { stem: 0.9, business: 0.95, arts: 1.0, social: 0.95, health: 0.9 },
      uk: { stem: 0.95, business: 0.9, arts: 1.0, social: 0.95, health: 0.95 },
      canada: {
        stem: 1.0,
        business: 0.95,
        arts: 1.0,
        social: 1.0,
        health: 0.95,
      },
      australia: {
        stem: 0.95,
        business: 1.0,
        arts: 1.0,
        social: 0.95,
        health: 0.95,
      },
      germany: {
        stem: 1.0,
        business: 0.95,
        arts: 1.0,
        social: 1.0,
        health: 0.95,
      },
      france: {
        stem: 0.95,
        business: 0.9,
        arts: 1.0,
        social: 0.95,
        health: 0.9,
      },
      japan: {
        stem: 0.9,
        business: 0.95,
        arts: 1.0,
        social: 0.95,
        health: 0.9,
      },
      netherlands: {
        stem: 1.0,
        business: 0.95,
        arts: 1.0,
        social: 1.0,
        health: 0.95,
      },
      sweden: {
        stem: 1.0,
        business: 0.95,
        arts: 1.0,
        social: 1.0,
        health: 0.95,
      },
      newzealand: {
        stem: 0.95,
        business: 1.0,
        arts: 1.0,
        social: 0.95,
        health: 0.95,
      },
    };
    const fieldComp = competitiveness[country][studyField] || 1.0;
    const adjustment = 5 * fieldComp;
    score += adjustment;

    const finalScore = Math.min(Math.round(score), 100);
    setPossibility(finalScore);

    if (finalScore >= 85) {
      feedbackText.unshift("Very strong candidate for scholarships!");
    } else if (finalScore >= 70) {
      feedbackText.unshift("Good chances with a polished application.");
    } else if (finalScore >= 50) {
      feedbackText.unshift("Moderate chances; strengthen weak areas.");
    } else {
      feedbackText.unshift("Low chances; significant improvements needed.");
    }

    if (country === "japan" && ielts === null) {
      feedbackText.push(
        "IELTS not required for Japan; focus on GPA and research."
      );
    }

    setFeedback(feedbackText.join("\n"));
    setIsModalVisible(true);
  };

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
            >
              <Ionicons
                name="arrow-back"
                size={moderateScale(24)}
                color="#a5a4a4"
              />
            </TouchableOpacity>
            <Image
              source={require("../assets/images/OPPORTUNITIES.png")}
              style={styles.logo}
            />
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate("CustomMail")}
            >
              <Ionicons
                name="create"
                size={moderateScale(24)}
                color="#a5a4a4"
              />
            </TouchableOpacity>
          </View>
        </View>

        <LinearGradient colors={["#f5f5f5", "#f5f5f5"]} style={styles.gradient}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
          >
            <Text style={styles.subtitle}>
              Assess your scholarship eligibility
            </Text>

            <Dropdown
              style={styles.dropdown}
              placeholder="Select GPA"
              data={gpaOptions}
              labelField="label"
              valueField="value"
              value={gpa}
              onChange={(item) => setGpa(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select IELTS Score"
              data={ieltsOptions}
              labelField="label"
              valueField="value"
              value={ielts}
              onChange={(item) => setIelts(item.value)}
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
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Research Experience"
              data={researchOptions}
              labelField="label"
              valueField="value"
              value={researchInterest}
              onChange={(item) => setResearchInterest(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Study Field"
              data={fieldOptions}
              labelField="label"
              valueField="value"
              value={studyField}
              onChange={(item) => setStudyField(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Extracurricular Activities"
              data={extracurricularOptions}
              labelField="label"
              valueField="value"
              value={extracurriculars}
              onChange={(item) => setExtracurriculars(item.value)}
            />
            <Dropdown
              style={styles.dropdown}
              placeholder="Select Financial Need"
              data={financialNeedOptions}
              labelField="label"
              valueField="value"
              value={financialNeed}
              onChange={(item) => setFinancialNeed(item.value)}
            />

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={calculatePossibility}
              >
                <Text style={styles.buttonText}> Calculate Possibility</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>

        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <LinearGradient
              colors={["#ffffff", "#f0f4ff"]}
              style={styles.modalContent}
            >
              <Text style={styles.modalTitle}> Scholarship Probability</Text>
              <View style={styles.resultCircle}>
                <Text style={styles.resultText}>{possibility}%</Text>
                <Text style={styles.resultLabel}>Likelihood</Text>
              </View>
              <Text style={styles.resultDescription}>{feedback}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.closeButtonText}> Close</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </Modal>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  section: {
    width: "100%",
    marginBottom: verticalScale(20),
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#2c3e50",
    marginBottom: verticalScale(10),
  },
  calculateButton: {
    backgroundColor: "#1a73e8",
    padding: moderateScale(15),
    borderRadius: moderateScale(25),
    width: "90%",
    alignSelf: "center",
    marginVertical: verticalScale(20),
    elevation: 3,
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: moderateScale(20),
    padding: moderateScale(25),
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: verticalScale(15),
  },
  scoreText: {
    fontSize: moderateScale(42),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1a73e8",
  },
  feedbackContainer: {
    maxHeight: verticalScale(200),
    marginBottom: verticalScale(15),
  },
  resourceLink: {
    padding: moderateScale(10),
    marginVertical: verticalScale(5),
    backgroundColor: "#e8f0fe",
    borderRadius: moderateScale(8),
  },
  linkText: {
    color: "#1a73e8",
    fontSize: moderateScale(14),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
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
    textBreakStrategy: "simple",
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(20),
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
  buttonContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: verticalScale(20),
    marginBottom: verticalScale(30),
  },
  button: {
    backgroundColor: "#004aad",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(30),
    alignItems: "center",
    justifyContent: "center",
    width: "60%",
    maxWidth: scale(300),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    maxWidth: scale(450),
    maxHeight: SCREEN_HEIGHT * 0.7,
    padding: moderateScale(20),
    borderRadius: moderateScale(20),
    alignItems: "center",
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#333",
    marginBottom: verticalScale(15),
  },
  resultCircle: {
    width: moderateScale(120),
    height: moderateScale(120),
    borderRadius: moderateScale(60),
    backgroundColor: "#4a90e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: verticalScale(20),
  },
  resultText: {
    fontSize: moderateScale(36),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
  },
  resultLabel: {
    fontSize: moderateScale(14),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
    opacity: 0.9,
  },
  resultDescription: {
    fontSize: moderateScale(16),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#666",
    textAlign: "center",
    marginBottom: verticalScale(20),
    paddingHorizontal: scale(10),
  },
  closeButton: {
    backgroundColor: "#4a90e2",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(25),
    width: "40%",
    maxWidth: scale(200),
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
});

export default ScholarshipPossibilityCalculator;
