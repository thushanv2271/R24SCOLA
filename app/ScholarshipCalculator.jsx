import React, { useState, useContext } from "react";
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
  Animated,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { AuthContext } from "../components/AuthContext";
import { calculatorAPI } from "../services/apiService";

const API_BASE_URL = "https://webapplication2-old-pond-3577.fly.dev/api";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size, factor = 0.5) =>
  Math.min(
    Math.max(size + (scale(size) - size) * factor, size * 0.8),
    size * 1.5
  );

const ScholarshipPossibilityCalculator = () => {
  const { user } = useContext(AuthContext);
  const [gpa, setGpa] = useState(null);
  const [ielts, setIelts] = useState(null);
  const [country, setCountry] = useState(null);
  const [researchInterest, setResearchInterest] = useState(null);
  const [studyField, setStudyField] = useState(null);
  const [extracurriculars, setExtracurriculars] = useState(null);
  const [financialNeed, setFinancialNeed] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pastResults, setPastResults] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [possibility, setPossibility] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [scoreBreakdown, setScoreBreakdown] = useState({
    gpaScore: 0,
    ieltsScore: 0,
    researchScore: 0,
    extracurricularScore: 0,
    financialScore: 0,
    fieldBonus: 0,
  });
  const [recommendations, setRecommendations] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [improvements, setImprovements] = useState([]);
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
    let feedbackText = [];
    let strengthsList = [];
    let improvementsList = [];
    let recommendationsList = [];

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
      feedbackText.push(`Your GPA is below the minimum requirement (${reqs.gpa}) for ${country.toUpperCase()}.`);
      improvementsList.push(`Increase your GPA to at least ${reqs.gpa}`);
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }
    if (reqs.ielts && ielts !== null && ielts < reqs.ielts) {
      feedbackText.push(
        `Your IELTS score is below the minimum requirement (${reqs.ielts}) for ${country.toUpperCase()}.`
      );
      improvementsList.push(`Aim for IELTS score of at least ${reqs.ielts}`);
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }

    // GPA Scoring (40 points max)
    const gpaScore = Math.min((gpa - 2.0) / 2.0, 1) * 40;
    score += gpaScore;
    if (gpa >= 3.7) {
      strengthsList.push("Excellent GPA - highly competitive");
    } else if (gpa >= 3.4) {
      strengthsList.push("Strong GPA - good foundation");
    } else if (gpa < 3.3) {
      improvementsList.push("Consider improving GPA to 3.3+ for better chances");
    }

    // IELTS Scoring (20 points max)
    let ieltsScore = 0;
    if (country === "japan" && ielts === null) {
      ieltsScore = 20;
      strengthsList.push("IELTS not required for Japan");
    } else if (ielts !== null) {
      ieltsScore = Math.min((ielts - 4.0) / 5.0, 1) * 20;
      if (ielts >= 7.5) {
        strengthsList.push("Outstanding IELTS score");
      } else if (ielts >= 7.0) {
        strengthsList.push("Very good IELTS score");
      } else if (ielts < 6.5 && reqs.ielts) {
        improvementsList.push("Aim for IELTS 6.5+ to be more competitive");
      }
    }
    score += ieltsScore;

    // Research Experience (15 points max)
    const researchScore = (researchInterest / 3) * 15;
    score += researchScore;
    if (researchInterest === 3) {
      strengthsList.push("Published research - major advantage");
    } else if (researchInterest === 2) {
      strengthsList.push("Research experience strengthens application");
    } else if (researchInterest < 2 && studyField === "stem") {
      improvementsList.push("Gain research experience for STEM scholarships");
    }

    // Extracurricular Activities (10 points max)
    const extraScore = (extracurriculars / 3) * 10;
    score += extraScore;
    if (extracurriculars === 3) {
      strengthsList.push("Strong leadership and activity involvement");
    } else if (extracurriculars < 2) {
      improvementsList.push("Participate in extracurricular activities and leadership roles");
    }

    // Financial Need (10 points max)
    const needScore = (financialNeed / 3) * 10;
    score += needScore;
    if (financialNeed === 3) {
      strengthsList.push("High financial need may qualify for need-based aid");
    } else if (financialNeed === 0) {
      improvementsList.push("Consider need-based scholarships if applicable");
    }

    // Field Competitiveness Bonus (5 points max)
    const competitiveness = {
      usa: { stem: 0.9, business: 0.95, arts: 1.0, social: 0.95, health: 0.9 },
      uk: { stem: 0.95, business: 0.9, arts: 1.0, social: 0.95, health: 0.95 },
      canada: { stem: 1.0, business: 0.95, arts: 1.0, social: 1.0, health: 0.95 },
      australia: { stem: 0.95, business: 1.0, arts: 1.0, social: 0.95, health: 0.95 },
      germany: { stem: 1.0, business: 0.95, arts: 1.0, social: 1.0, health: 0.95 },
      france: { stem: 0.95, business: 0.9, arts: 1.0, social: 0.95, health: 0.9 },
      japan: { stem: 0.9, business: 0.95, arts: 1.0, social: 0.95, health: 0.9 },
      netherlands: { stem: 1.0, business: 0.95, arts: 1.0, social: 1.0, health: 0.95 },
      sweden: { stem: 1.0, business: 0.95, arts: 1.0, social: 1.0, health: 0.95 },
      newzealand: { stem: 0.95, business: 1.0, arts: 1.0, social: 0.95, health: 0.95 },
    };
    const fieldComp = competitiveness[country][studyField] || 1.0;
    const fieldBonus = 5 * fieldComp;
    score += fieldBonus;

    const finalScore = Math.min(Math.round(score), 100);
    setPossibility(finalScore);

    // Store score breakdown
    setScoreBreakdown({
      gpaScore: Math.round(gpaScore),
      ieltsScore: Math.round(ieltsScore),
      researchScore: Math.round(researchScore),
      extracurricularScore: Math.round(extraScore),
      financialScore: Math.round(needScore),
      fieldBonus: Math.round(fieldBonus),
    });

    // Main feedback
    if (finalScore >= 85) {
      feedbackText.push("🎯 Excellent! You're a very strong candidate for scholarships.");
    } else if (finalScore >= 70) {
      feedbackText.push("✅ Good chances! Focus on creating a compelling application.");
    } else if (finalScore >= 50) {
      feedbackText.push("⚠️ Moderate chances. Strengthen the areas below for better results.");
    } else {
      feedbackText.push("📈 Significant improvements needed to be competitive.");
    }

    // Generate recommendations based on profile
    if (finalScore >= 70) {
      recommendationsList.push("Start preparing your application documents now");
      recommendationsList.push("Research specific scholarship programs in your field");
      recommendationsList.push("Reach out to professors or mentors for recommendation letters");
    }
    
    if (studyField === "stem") {
      recommendationsList.push("Look into research-based fellowships and assistantships");
    }
    
    if (country === "germany" || country === "netherlands" || country === "sweden") {
      recommendationsList.push("Check for tuition-free or low-cost public universities");
    }
    
    if (financialNeed >= 2) {
      recommendationsList.push("Apply to need-based scholarship programs");
      recommendationsList.push("Consider crowdfunding or sponsorship opportunities");
    }

    if (country === "usa" && finalScore >= 60) {
      recommendationsList.push("Explore Fulbright, Commonwealth, and university-specific scholarships");
    }

    setFeedback(feedbackText.join("\n"));
    setStrengths(strengthsList);
    setImprovements(improvementsList);
    setRecommendations(recommendationsList);
    
    // Save to database if user is logged in
    if (user?.username) {
      saveResultToDatabase(
        finalScore,
        gpaScore,
        ieltsScore,
        researchScore,
        extraScore,
        needScore,
        fieldBonus,
        strengthsList,
        improvementsList,
        recommendationsList,
        feedbackText.join("\n")
      );
    }
    
    setIsModalVisible(true);
  };

  // Save calculator result to database
  const saveResultToDatabase = async (
    totalScore,
    gpaScore,
    ieltsScore,
    researchScore,
    extracurricularScore,
    financialScore,
    fieldBonus,
    strengths,
    improvements,
    recommendations,
    feedbackMessage
  ) => {
    try {
      setIsSaving(true);
      const resultData = {
        username: user.username,
        gpa: parseFloat(gpa) || 0,
        ielts: ielts ? parseFloat(ielts) : null,
        country: country || null,
        researchInterest: parseInt(researchInterest) || 0,
        studyField: studyField || null,
        extracurriculars: parseInt(extracurriculars) || 0,
        financialNeed: parseInt(financialNeed) || 0,
        totalScore: totalScore,
        gpaScore: gpaScore,
        ieltsScore: ieltsScore,
        researchScore: researchScore,
        extracurricularScore: extracurricularScore,
        financialScore: financialScore,
        fieldBonus: fieldBonus,
        strengths: strengths || [],
        improvements: improvements || [],
        recommendations: recommendations || [],
        feedback: feedbackMessage || null,
      };

      console.log("Saving calculator result:", JSON.stringify(resultData, null, 2));
      await calculatorAPI.saveResult(resultData);
      console.log("Calculator result saved successfully!");
    } catch (error) {
      console.error("Error saving calculator result:", error);
      if (error.message) {
        console.error("Error message:", error.message);
      }
      // Don't show error to user - saving is optional
    } finally {
      setIsSaving(false);
    }
  };

  const fetchPastResults = async () => {
    if (!user?.username) {
      Alert.alert("Error", "Please login to view your calculation history");
      return;
    }

    try {
      setLoadingHistory(true);
      const results = await calculatorAPI.getUserResults(user.username);
      setPastResults(results || []);
      setIsHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching past results:", error);
      Alert.alert("Error", "Failed to load calculation history");
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const deleteResult = async (resultId) => {
    Alert.alert(
      "Delete Result",
      "Are you sure you want to delete this calculation result?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await calculatorAPI.deleteResult(resultId);
              // Remove from local state
              setPastResults((prevResults) =>
                prevResults.filter((result) => result.id !== resultId)
              );
              Alert.alert("Success", "Result deleted successfully");
            } catch (error) {
              console.error("Error deleting result:", error);
              Alert.alert("Error", "Failed to delete result");
            }
          },
        },
      ]
    );
  };

  // Score Bar Component
  const ScoreBar = ({ label, score, maxScore, icon }) => {
    const percentage = (score / maxScore) * 100;
    return (
      <View style={styles.scoreBarContainer}>
        <View style={styles.scoreBarHeader}>
          <View style={styles.scoreBarLabelContainer}>
            <MaterialIcons name={icon} size={16} color="#64748b" />
            <Text style={styles.scoreBarLabel}>{label}</Text>
          </View>
          <Text style={styles.scoreBarValue}>
            {score}/{maxScore}
          </Text>
        </View>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={percentage >= 80 ? ["#10b981", "#34d399"] : percentage >= 60 ? ["#3b82f6", "#60a5fa"] : ["#94a3b8", "#cbd5e1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>
    );
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
                <Text style={styles.buttonText}>Calculate Possibility</Text>
              </TouchableOpacity>

              {user && (
                <TouchableOpacity
                  style={styles.historyButton}
                  onPress={fetchPastResults}
                  disabled={loadingHistory}
                >
                  <MaterialIcons name="history" size={20} color="#4a90e2" />
                  <Text style={styles.historyButtonText}>
                    {loadingHistory ? "Loading..." : "View Past Results"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </LinearGradient>

        <Modal visible={isModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <LinearGradient
                  colors={["#ffffff", "#f8f9ff"]}
                  style={styles.modalContent}
                >
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <MaterialIcons name="assessment" size={32} color="#4a90e2" />
                    <Text style={styles.modalTitle}>Scholarship Eligibility Report</Text>
                  </View>

                  {/* Score Circle */}
                  <LinearGradient
                    colors={
                      possibility >= 85
                        ? ["#10b981", "#34d399"]
                        : possibility >= 70
                        ? ["#3b82f6", "#60a5fa"]
                        : possibility >= 50
                        ? ["#f59e0b", "#fbbf24"]
                        : ["#ef4444", "#f87171"]
                    }
                    style={styles.resultCircle}
                  >
                    <Text style={styles.resultText}>{possibility}%</Text>
                    <Text style={styles.resultLabel}>
                      {possibility >= 85
                        ? "Excellent"
                        : possibility >= 70
                        ? "Good"
                        : possibility >= 50
                        ? "Moderate"
                        : "Low"}
                    </Text>
                  </LinearGradient>

                  {/* Main Feedback */}
                  <View style={styles.feedbackCard}>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </View>

                  {/* Score Breakdown */}
                  <View style={styles.breakdownSection}>
                    <View style={styles.sectionHeader}>
                      <FontAwesome5 name="chart-bar" size={18} color="#4a90e2" />
                      <Text style={styles.sectionTitle}>Score Breakdown</Text>
                    </View>

                    <ScoreBar label="Academic (GPA)" score={scoreBreakdown.gpaScore} maxScore={40} icon="school" />
                    <ScoreBar label="Language (IELTS)" score={scoreBreakdown.ieltsScore} maxScore={20} icon="translate" />
                    <ScoreBar label="Research Experience" score={scoreBreakdown.researchScore} maxScore={15} icon="science" />
                    <ScoreBar label="Extracurricular" score={scoreBreakdown.extracurricularScore} maxScore={10} icon="groups" />
                    <ScoreBar label="Financial Need" score={scoreBreakdown.financialScore} maxScore={10} icon="account-balance-wallet" />
                    <ScoreBar label="Field Bonus" score={scoreBreakdown.fieldBonus} maxScore={5} icon="star" />
                  </View>

                  {/* Strengths */}
                  {strengths.length > 0 && (
                    <View style={styles.strengthsSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                        <Text style={[styles.sectionTitle, { color: "#10b981" }]}>Your Strengths</Text>
                      </View>
                      {strengths.map((strength, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons name="checkmark" size={16} color="#10b981" />
                          <Text style={styles.listItemText}>{strength}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Areas for Improvement */}
                  {improvements.length > 0 && (
                    <View style={styles.improvementsSection}>
                      <View style={styles.sectionHeader}>
                        <MaterialIcons name="trending-up" size={20} color="#f59e0b" />
                        <Text style={[styles.sectionTitle, { color: "#f59e0b" }]}>Areas to Improve</Text>
                      </View>
                      {improvements.map((improvement, index) => (
                        <View key={index} style={styles.listItem}>
                          <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
                          <Text style={styles.listItemText}>{improvement}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <View style={styles.recommendationsSection}>
                      <View style={styles.sectionHeader}>
                        <FontAwesome5 name="lightbulb" size={18} color="#8b5cf6" />
                        <Text style={[styles.sectionTitle, { color: "#8b5cf6" }]}>Next Steps</Text>
                      </View>
                      {recommendations.map((recommendation, index) => (
                        <View key={index} style={styles.recommendationCard}>
                          <Text style={styles.recommendationNumber}>{index + 1}</Text>
                          <Text style={styles.recommendationText}>{recommendation}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <LinearGradient
                      colors={["#4a90e2", "#357abd"]}
                      style={styles.closeButtonGradient}
                    >
                      <Text style={styles.closeButtonText}>Close Report</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* History Modal */}
        <Modal visible={isHistoryModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <LinearGradient
                  colors={["#ffffff", "#f8f9ff"]}
                  style={styles.modalContent}
                >
                  {/* Header */}
                  <View style={styles.modalHeader}>
                    <MaterialIcons name="history" size={32} color="#4a90e2" />
                    <Text style={styles.modalTitle}>Calculation History</Text>
                  </View>

                  {pastResults.length === 0 ? (
                    <View style={styles.emptyHistoryContainer}>
                      <MaterialIcons name="inbox" size={64} color="#cbd5e1" />
                      <Text style={styles.emptyHistoryText}>No past calculations found</Text>
                      <Text style={styles.emptyHistorySubtext}>
                        Your calculation history will appear here
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.historyList}>
                      {pastResults.map((result, index) => (
                        <View key={result.id || index} style={styles.historyCard}>
                          <View style={styles.historyCardHeader}>
                            <View style={styles.historyScoreCircle}>
                              <Text style={styles.historyScoreText}>
                                {Math.round(result.totalScore)}
                              </Text>
                              <Text style={styles.historyScoreLabel}>Score</Text>
                            </View>
                            <View style={styles.historyCardInfo}>
                              <Text style={styles.historyDate}>
                                {formatDate(result.calculatedAt)}
                              </Text>
                              <View style={styles.historyDetails}>
                                <View style={styles.historyDetailItem}>
                                  <MaterialIcons name="school" size={16} color="#64748b" />
                                  <Text style={styles.historyDetailText}>
                                    GPA: {result.gpa}
                                  </Text>
                                </View>
                                {result.ielts && (
                                  <View style={styles.historyDetailItem}>
                                    <MaterialIcons name="language" size={16} color="#64748b" />
                                    <Text style={styles.historyDetailText}>
                                      IELTS: {result.ielts}
                                    </Text>
                                  </View>
                                )}
                                {result.country && (
                                  <View style={styles.historyDetailItem}>
                                    <MaterialIcons name="place" size={16} color="#64748b" />
                                    <Text style={styles.historyDetailText}>
                                      {result.country.toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                {result.studyField && (
                                  <View style={styles.historyDetailItem}>
                                    <MaterialIcons name="book" size={16} color="#64748b" />
                                    <Text style={styles.historyDetailText}>
                                      {result.studyField}
                                    </Text>
                                  </View>
                                )}
                              </View>
                            </View>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => deleteResult(result.id)}
                            >
                              <MaterialIcons name="delete" size={24} color="#ef4444" />
                            </TouchableOpacity>
                          </View>

                          {/* Feedback */}
                          {result.feedback && (
                            <View style={styles.historyFeedback}>
                              <Text style={styles.historyFeedbackText}>{result.feedback}</Text>
                            </View>
                          )}

                          {/* Strengths Preview */}
                          {result.strengths && result.strengths.length > 0 && (
                            <View style={styles.historyStrengthsPreview}>
                              <Text style={styles.historyStrengthsTitle}>
                                ✅ {result.strengths.length} Strength{result.strengths.length > 1 ? 's' : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Close Button */}
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsHistoryModalVisible(false)}
                  >
                    <LinearGradient
                      colors={["#4a90e2", "#357abd"]}
                      style={styles.closeButtonGradient}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </ScrollView>
            </View>
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
    color: "#64748b",
    textAlign: "center",
    marginBottom: verticalScale(20),
    fontWeight: "500",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(12),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
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
    backgroundColor: "#4a90e2",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(30),
    borderRadius: moderateScale(30),
    alignItems: "center",
    justifyContent: "center",
    width: "70%",
    maxWidth: scale(300),
    shadowColor: "#4a90e2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: scale(15),
  },
  modalContainer: {
    width: "100%",
    maxWidth: scale(500),
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderRadius: moderateScale(20),
    overflow: "hidden",
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalContent: {
    padding: moderateScale(20),
    borderRadius: moderateScale(20),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: verticalScale(20),
    gap: 10,
  },
  modalTitle: {
    fontSize: moderateScale(22),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1e293b",
  },
  resultCircle: {
    width: moderateScale(140),
    height: moderateScale(140),
    borderRadius: moderateScale(70),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: verticalScale(20),
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  resultText: {
    fontSize: moderateScale(42),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
  },
  resultLabel: {
    fontSize: moderateScale(16),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#fff",
    fontWeight: "600",
    marginTop: 4,
  },
  feedbackCard: {
    backgroundColor: "#f8fafc",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(20),
    borderLeftWidth: 4,
    borderLeftColor: "#4a90e2",
  },
  feedbackText: {
    fontSize: moderateScale(15),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#475569",
    lineHeight: moderateScale(22),
  },
  breakdownSection: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: verticalScale(12),
    gap: 8,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1e293b",
  },
  scoreBarContainer: {
    marginBottom: verticalScale(12),
  },
  scoreBarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  scoreBarLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scoreBarLabel: {
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#64748b",
    fontWeight: "500",
  },
  scoreBarValue: {
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#1e293b",
    fontWeight: "600",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  strengthsSection: {
    backgroundColor: "#f0fdf4",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: "#86efac",
  },
  improvementsSection: {
    backgroundColor: "#fffbeb",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(15),
    borderWidth: 1,
    borderColor: "#fcd34d",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(8),
    gap: 8,
  },
  listItemText: {
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#334155",
    flex: 1,
    lineHeight: moderateScale(18),
  },
  recommendationsSection: {
    backgroundColor: "#faf5ff",
    borderRadius: moderateScale(12),
    padding: moderateScale(15),
    marginBottom: verticalScale(20),
    borderWidth: 1,
    borderColor: "#d8b4fe",
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#fff",
    borderRadius: moderateScale(8),
    padding: moderateScale(12),
    marginBottom: verticalScale(8),
    gap: 10,
    elevation: 1,
  },
  recommendationNumber: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: "#8b5cf6",
    color: "#fff",
    textAlign: "center",
    lineHeight: moderateScale(24),
    fontSize: moderateScale(12),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  recommendationText: {
    flex: 1,
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#334155",
    lineHeight: moderateScale(18),
  },
  closeButton: {
    borderRadius: moderateScale(30),
    overflow: "hidden",
    alignSelf: "center",
    width: "70%",
    maxWidth: scale(250),
    elevation: 4,
    shadowColor: "#4a90e2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  closeButtonGradient: {
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(30),
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  historyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(20),
    borderRadius: moderateScale(30),
    marginTop: verticalScale(12),
    borderWidth: 1.5,
    borderColor: "#4a90e2",
    gap: 8,
    width: "70%",
    maxWidth: scale(300),
  },
  historyButtonText: {
    fontSize: moderateScale(14),
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#4a90e2",
  },
  emptyHistoryContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: verticalScale(60),
  },
  emptyHistoryText: {
    fontSize: moderateScale(18),
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#64748b",
    marginTop: verticalScale(16),
  },
  emptyHistorySubtext: {
    fontSize: moderateScale(14),
    fontFamily: "Roboto",
    color: "#94a3b8",
    marginTop: verticalScale(8),
    textAlign: "center",
  },
  historyList: {
    gap: verticalScale(12),
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: verticalScale(12),
  },
  historyScoreCircle: {
    width: moderateScale(70),
    height: moderateScale(70),
    borderRadius: moderateScale(35),
    backgroundColor: "#4a90e2",
    justifyContent: "center",
    alignItems: "center",
  },
  historyScoreText: {
    fontSize: moderateScale(24),
    fontWeight: "bold",
    fontFamily: "Roboto",
    color: "#fff",
  },
  historyScoreLabel: {
    fontSize: moderateScale(10),
    fontFamily: "Roboto",
    color: "#fff",
    opacity: 0.9,
  },
  historyCardInfo: {
    flex: 1,
    justifyContent: "center",
  },
  historyDate: {
    fontSize: moderateScale(12),
    fontFamily: "Roboto",
    color: "#94a3b8",
    marginBottom: verticalScale(6),
  },
  historyDetails: {
    gap: verticalScale(4),
  },
  historyDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  historyDetailText: {
    fontSize: moderateScale(12),
    fontFamily: "Roboto",
    color: "#64748b",
  },
  historyFeedback: {
    backgroundColor: "#f8fafc",
    borderRadius: moderateScale(8),
    padding: moderateScale(10),
    marginBottom: verticalScale(8),
  },
  historyFeedbackText: {
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    color: "#475569",
    lineHeight: moderateScale(18),
  },
  historyStrengthsPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyStrengthsTitle: {
    fontSize: moderateScale(12),
    fontFamily: "Roboto",
    color: "#10b981",
    fontWeight: "600",
  },
  deleteButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ScholarshipPossibilityCalculator;
