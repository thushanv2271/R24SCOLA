import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { calculatorAPI } from "../services/apiService";
import AlertModal from "../components/AlertModal";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import LoaderModal from "../components/ui/LoaderModal";
import PickerField from "../components/ui/PickerField";
import { LanguageContext, getLocale } from "../components/LanguageContext";
import ReAnimated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useCountUp, haptic } from "../components/ui/motion";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const scale = (size) => (SCREEN_WIDTH / 375) * size;
const verticalScale = (size) => (SCREEN_HEIGHT / 667) * size;
const moderateScale = (size, factor = 0.5) =>
  Math.min(
    Math.max(size + (scale(size) - size) * factor, size * 0.8),
    size * 1.5,
  );

const AnimatedGradient = ReAnimated.createAnimatedComponent(LinearGradient);

const ScoreBar = ({ label, score, maxScore, icon }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percentage = Math.max(0, Math.min(100, (score / maxScore) * 100));
  const fill = useSharedValue(0);
  useEffect(() => {
    fill.value = withDelay(150, withTiming(percentage, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [percentage]);
  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));
  return (
    <View
      style={styles.scoreBarContainer}
      accessible
      accessibilityLabel={`${label}: ${score} / ${maxScore}`}
    >
      <View style={styles.scoreBarHeader}>
        <View style={styles.scoreBarLabelContainer}>
          <MaterialIcons name={icon} size={16} color={colors.textSecondary} />
          <Text style={styles.scoreBarLabel}>{label}</Text>
        </View>
        <Text style={styles.scoreBarValue}>
          {score}/{maxScore}
        </Text>
      </View>
      <View style={styles.progressBarBackground}>
        <AnimatedGradient
          colors={
            percentage >= 70
              ? ["#004aad", "#0d64c8"]
              : percentage >= 40
                ? ["#eb6834", "#f0885c"]
                : ["#ef4444", "#f87171"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressBarFill, fillStyle]}
        />
      </View>
    </View>
  );
};

// Staged processing indicator shown while the eligibility engine runs.
// Labels describe what the scoring algorithm genuinely does — profile
// analysis, requirement checks, factor scoring, recommendations.
const PROCESSING_STEP_MS = 700;
const PROCESSING_STEPS = [
  { icon: "person-circle-outline", labelKey: "calculator.stepProfile" },
  { icon: "globe-outline", labelKey: "calculator.stepRequirements" },
  { icon: "stats-chart-outline", labelKey: "calculator.stepScoring" },
  { icon: "bulb-outline", labelKey: "calculator.stepRecommendations" },
];

const ScholarshipPossibilityCalculator = () => {
  const { user } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [historyError, setHistoryError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [calculationError, setCalculationError] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });
  const reportFromHistory = useRef(false);
  const [possibility, setPossibility] = useState(0);
  const animatedPossibility = useCountUp(possibility, 900);
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
  const [answeredKeys, setAnsweredKeys] = useState({});
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const fieldY = useRef({});
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBackPress = () => {
    router?.back();
  };

  const showAlert = (title, message, type = "info", actions = []) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      actions,
    });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  const clearFieldError = (field) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const countryLabel = (code) => t(`calculator.countries.${code}`, code);

  const countryOptions = [
    "usa",
    "uk",
    "canada",
    "australia",
    "germany",
    "france",
    "japan",
    "netherlands",
    "sweden",
    "newzealand",
  ].map((code) => ({ label: countryLabel(code), value: code }));

  const gpaOptions = [
    { label: t("calculator.opt.gpa40"), value: 4.0 },
    { label: t("calculator.opt.gpa38"), value: 3.8 },
    { label: t("calculator.opt.gpa35"), value: 3.5 },
    { label: t("calculator.opt.gpa30"), value: 3.0 },
    { label: t("calculator.opt.gpa25"), value: 2.5 },
  ];

  const ieltsOptions = [
    { label: t("calculator.opt.ielts85"), value: 8.5 },
    { label: t("calculator.opt.ielts725"), value: 7.25 },
    { label: t("calculator.opt.ielts625"), value: 6.25 },
    { label: t("calculator.opt.ielts525"), value: 5.25 },
    { label: t("calculator.opt.ielts45"), value: 4.5 },
    { label: t("calculator.opt.ieltsNA"), value: null },
  ];

  const researchOptions = [
    { label: t("calculator.opt.research3"), value: 3 },
    { label: t("calculator.opt.research2"), value: 2 },
    { label: t("calculator.opt.research1"), value: 1 },
    { label: t("calculator.opt.none"), value: 0 },
  ];

  const fieldOptions = [
    { label: t("calculator.opt.stem"), value: "stem" },
    { label: t("calculator.opt.business"), value: "business" },
    { label: t("calculator.opt.arts"), value: "arts" },
    { label: t("calculator.opt.social"), value: "social" },
    { label: t("calculator.opt.health"), value: "health" },
  ];

  const extracurricularOptions = [
    { label: t("calculator.opt.extra3"), value: 3 },
    { label: t("calculator.opt.extra2"), value: 2 },
    { label: t("calculator.opt.extra1"), value: 1 },
    { label: t("calculator.opt.none"), value: 0 },
  ];

  const financialNeedOptions = [
    { label: t("calculator.opt.fin3"), value: 3 },
    { label: t("calculator.opt.fin2"), value: 2 },
    { label: t("calculator.opt.fin1"), value: 1 },
    { label: t("calculator.opt.fin0"), value: 0 },
  ];

  const answerMap = {
    country,
    gpa,
    ielts,
    studyField,
    researchInterest,
    extracurriculars,
    financialNeed,
  };

  const setterMap = {
    country: setCountry,
    gpa: setGpa,
    ielts: setIelts,
    studyField: setStudyField,
    researchInterest: setResearchInterest,
    extracurriculars: setExtracurriculars,
    financialNeed: setFinancialNeed,
  };

  const baseQuestions = {
    country: {
      key: "country",
      icon: "flag-outline",
      label: t("calculator.lblCountry"),
      hint: t("calculator.q.countrySub"),
      options: countryOptions,
    },
    studyField: {
      key: "studyField",
      icon: "book-outline",
      label: t("calculator.lblField"),
      hint: t("calculator.q.fieldSub"),
      options: fieldOptions,
    },
    gpa: {
      key: "gpa",
      icon: "school-outline",
      label: t("calculator.lblGpa"),
      hint: t("calculator.q.gpaSub"),
      options: gpaOptions,
    },
    ielts: {
      key: "ielts",
      icon: "language-outline",
      label: t("calculator.lblIelts"),
      hint: t("calculator.q.ieltsSub"),
      options: ieltsOptions,
    },
    researchInterest: {
      key: "researchInterest",
      icon: "flask-outline",
      label: t("calculator.lblResearch"),
      hint: t("calculator.q.researchSub"),
      options: researchOptions,
    },
    extracurriculars: {
      key: "extracurriculars",
      icon: "people-outline",
      label: t("calculator.lblExtra"),
      hint: t("calculator.q.extraSub"),
      options: extracurricularOptions,
    },
    financialNeed: {
      key: "financialNeed",
      icon: "wallet-outline",
      label: t("calculator.lblFinancial"),
      hint: t("calculator.q.financialSub"),
      options: financialNeedOptions,
    },
  };

  const formSections = [
    { id: "destination", icon: "earth", title: t("calculator.sectionDestination"), keys: ["country", "studyField"] },
    { id: "academics", icon: "school", title: t("calculator.sectionAcademics"), keys: ["gpa", "ielts"] },
    { id: "background", icon: "briefcase", title: t("calculator.sectionBackground"), keys: ["researchInterest", "extracurriculars", "financialNeed"] },
  ].map((section) => ({
    ...section,
    keys: section.keys.filter((key) => !(key === "ielts" && country === "japan")),
  }));

  const requiredKeys = formSections.flatMap((section) => section.keys);
  const answeredCount = requiredKeys.filter((key) => !!answeredKeys[key]).length;

  // Dropdown values are strings; the raw answer (number / null) is looked up.
  const optionKey = (value) => (value === null ? "na" : String(value));

  useEffect(() => {
    if (country === "japan") {
      setIelts(null);
      setAnsweredKeys((prev) => ({ ...prev, ielts: true }));
    } else {
      setAnsweredKeys((prev) => {
        if (prev.ielts && ielts === null) {
          const next = { ...prev };
          delete next.ielts;
          return next;
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);

  const handleSelectOption = (key, value) => {
    setterMap[key](value);
    setAnsweredKeys((prev) => ({ ...prev, [key]: true }));
    clearFieldError(key);
  };

  const validateFields = () => {
    const errors = {};
    if (gpa === null) errors.gpa = t("calculator.errGpa");
    if (country === null) errors.country = t("calculator.errCountry");
    if (ielts === null && country !== "japan")
      errors.ielts = t("calculator.errIelts");
    if (researchInterest === null)
      errors.researchInterest = t("calculator.errResearch");
    if (studyField === null) errors.studyField = t("calculator.errField");
    if (extracurriculars === null)
      errors.extracurriculars = t("calculator.errExtra");
    if (financialNeed === null)
      errors.financialNeed = t("calculator.errFinancial");
    return errors;
  };

  const [isCalculating, setIsCalculating] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const processingTimers = useRef([]);

  useEffect(
    () => () => {
      processingTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const calculatePossibility = () => {
    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstKey = requiredKeys.find((key) => errors[key]);
      const section = formSections.find((sec) => sec.keys.includes(firstKey));
      if (section) {
        const y = (sectionY.current[section.id] || 0) + (fieldY.current[firstKey] || 0);
        scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
      }
      return;
    }
    setFieldErrors({});
    setCalculationError("");

    // Walk through the processing steps, then run the actual scoring.
    processingTimers.current.forEach(clearTimeout);
    processingTimers.current = [];
    setProcessingStep(0);
    setIsCalculating(true);
    PROCESSING_STEPS.forEach((_, index) => {
      if (index === 0) return;
      processingTimers.current.push(
        setTimeout(() => setProcessingStep(index), index * PROCESSING_STEP_MS),
      );
    });
    processingTimers.current.push(
      setTimeout(
        () => {
          setIsCalculating(false);
          // Small delay so the overlay fully dismisses before the results
          // modal opens (stacked transparent modals misbehave on Android).
          processingTimers.current.push(setTimeout(runCalculation, 300));
        },
        PROCESSING_STEPS.length * PROCESSING_STEP_MS + 400,
      ),
    );
  };

  const runCalculation = () => {
    try {
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
      feedbackText.push(
        t("calculator.fb.gpaBelowMin", { min: reqs.gpa, country: countryLabel(country) }),
      );
      improvementsList.push(t("calculator.fb.gpaImproveMin", { min: reqs.gpa }));
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }
    if (reqs.ielts && ielts !== null && ielts < reqs.ielts) {
      feedbackText.push(
        t("calculator.fb.ieltsBelowMin", { min: reqs.ielts, country: countryLabel(country) }),
      );
      improvementsList.push(t("calculator.fb.ieltsImproveMin", { min: reqs.ielts }));
      setPossibility(0);
      setFeedback(feedbackText.join("\n"));
      setIsModalVisible(true);
      return;
    }

    // GPA Scoring (40 points max)
    const gpaScore = Math.min((gpa - 2.0) / 2.0, 1) * 40;
    score += gpaScore;
    if (gpa >= 3.7) {
      strengthsList.push(t("calculator.fb.sGpaExcellent"));
    } else if (gpa >= 3.4) {
      strengthsList.push(t("calculator.fb.sGpaStrong"));
    } else if (gpa < 3.3) {
      improvementsList.push(t("calculator.fb.iGpaImprove"));
    }

    // IELTS Scoring (20 points max)
    let ieltsScore = 0;
    if (country === "japan" && ielts === null) {
      ieltsScore = 20;
      strengthsList.push(t("calculator.fb.sIeltsJapan"));
    } else if (ielts !== null) {
      ieltsScore = Math.min((ielts - 4.0) / 5.0, 1) * 20;
      if (ielts >= 7.5) {
        strengthsList.push(t("calculator.fb.sIeltsOutstanding"));
      } else if (ielts >= 7.0) {
        strengthsList.push(t("calculator.fb.sIeltsVeryGood"));
      } else if (ielts < 6.5 && reqs.ielts) {
        improvementsList.push(t("calculator.fb.iIeltsImprove"));
      }
    }
    score += ieltsScore;

    // Research Experience (15 points max)
    const researchScore = (researchInterest / 3) * 15;
    score += researchScore;
    if (researchInterest === 3) {
      strengthsList.push(t("calculator.fb.sResearchPublished"));
    } else if (researchInterest === 2) {
      strengthsList.push(t("calculator.fb.sResearchExperience"));
    } else if (researchInterest < 2 && studyField === "stem") {
      improvementsList.push(t("calculator.fb.iResearchStem"));
    }

    // Extracurricular Activities (10 points max)
    const extraScore = (extracurriculars / 3) * 10;
    score += extraScore;
    if (extracurriculars === 3) {
      strengthsList.push(t("calculator.fb.sExtraStrong"));
    } else if (extracurriculars < 2) {
      improvementsList.push(t("calculator.fb.iExtraImprove"));
    }

    // Financial Need (10 points max)
    const needScore = (financialNeed / 3) * 10;
    score += needScore;
    if (financialNeed === 3) {
      strengthsList.push(t("calculator.fb.sFinancialHigh"));
    } else if (financialNeed === 0) {
      improvementsList.push(t("calculator.fb.iFinancialNone"));
    }

    // Field Competitiveness Bonus (5 points max)
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
    const fieldBonus = 5 * fieldComp;
    score += fieldBonus;

    const finalScore = Math.min(Math.round(score), 100);
    setPossibility(finalScore);
    haptic("success");

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
      feedbackText.push(t("calculator.fb.overallExcellent"));
    } else if (finalScore >= 70) {
      feedbackText.push(t("calculator.fb.overallGood"));
    } else if (finalScore >= 50) {
      feedbackText.push(t("calculator.fb.overallModerate"));
    } else {
      feedbackText.push(t("calculator.fb.overallLow"));
    }

    // Generate recommendations based on profile
    if (finalScore >= 70) {
      recommendationsList.push(t("calculator.fb.rPrepare"));
      recommendationsList.push(t("calculator.fb.rResearch"));
      recommendationsList.push(t("calculator.fb.rLetters"));
    }

    if (studyField === "stem") {
      recommendationsList.push(t("calculator.fb.rFellowships"));
    }

    if (
      country === "germany" ||
      country === "netherlands" ||
      country === "sweden"
    ) {
      recommendationsList.push(t("calculator.fb.rTuitionFree"));
    }

    if (financialNeed >= 2) {
      recommendationsList.push(t("calculator.fb.rNeedBased"));
      recommendationsList.push(t("calculator.fb.rCrowdfund"));
    }

    if (country === "usa" && finalScore >= 60) {
      recommendationsList.push(t("calculator.fb.rUsa"));
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
        feedbackText.join("\n"),
      );
    }

    setIsModalVisible(true);
    } catch (error) {
      console.error("Error calculating possibility:", error);
      setCalculationError(t("calculator.calcError"));
    }
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
    feedbackMessage,
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

      await calculatorAPI.saveResult(resultData);
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
    if (!user?.username) return;

    try {
      setLoadingHistory(true);
      setHistoryError("");
      const results = await calculatorAPI.getUserResults(user.username);
      setPastResults(results || []);
      setIsHistoryModalVisible(true);
    } catch (error) {
      console.error("Error fetching past results:", error);
      setHistoryError(t("calculator.historyLoadFailed"));
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(getLocale(language), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const levelInfo = (score) =>
    score >= 85
      ? { label: t("calculator.levelExcellent"), color: "#15803d" }
      : score >= 70
        ? { label: t("calculator.levelGood"), color: "#004aad" }
        : score >= 50
          ? { label: t("calculator.levelModerate"), color: "#eb6834" }
          : { label: t("calculator.levelLow"), color: "#ef4444" };

  // Re-open a saved result in the full report sheet; closing it returns to the list.
  const openHistoryResult = (result) => {
    setPossibility(Math.round(result.totalScore || 0));
    setFeedback(result.feedback || "");
    setScoreBreakdown({
      gpaScore: result.gpaScore || 0,
      ieltsScore: result.ieltsScore || 0,
      researchScore: result.researchScore || 0,
      extracurricularScore: result.extracurricularScore || 0,
      financialScore: result.financialScore || 0,
      fieldBonus: result.fieldBonus || 0,
    });
    setStrengths(result.strengths || []);
    setImprovements(result.improvements || []);
    setRecommendations(result.recommendations || []);
    reportFromHistory.current = true;
    setIsHistoryModalVisible(false);
    setTimeout(() => setIsModalVisible(true), 300);
  };

  const closeReport = () => {
    setIsModalVisible(false);
    if (reportFromHistory.current) {
      reportFromHistory.current = false;
      setTimeout(() => setIsHistoryModalVisible(true), 300);
    }
  };

  const deleteResult = async (resultId) => {
    showAlert(
      t("calculator.deleteTitle"),
      t("calculator.deleteConfirm"),
      "warning",
      [
        {
          text: t("common.cancel"),
          onPress: () => {},
        },
        {
          text: t("common.delete"),
          destructive: true,
          onPress: async () => {
            try {
              await calculatorAPI.deleteResult(resultId);
              // Remove from local state
              setPastResults((prevResults) =>
                prevResults.filter((result) => result.id !== resultId),
              );
            } catch (error) {
              console.error("Error deleting result:", error);
              showAlert(t("common.error"), t("calculator.deleteFailed"), "error");
            }
          },
        },
      ],
    );
  };

  // Score Bar Component
  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <StatusBar
          barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"}
          backgroundColor={colors.screenBackground}
        />
        <View style={styles.headerContainer}>
          <ScreenHeader
            onBack={handleBackPress}
            onMenuPress={() => setMenuVisible(true)}
          />
        </View>
        <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

        <View style={styles.gradient}>
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={true}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleTexts}>
                <Text style={styles.pageTitle}>{t("calculator.title")}</Text>
                <Text style={styles.pageSubtitle}>{t("calculator.introSubtitle")}</Text>
              </View>
              {user && (
                <TouchableOpacity
                  style={styles.historyChip}
                  onPress={fetchPastResults}
                  disabled={loadingHistory}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t("calculator.viewPast")}
                >
                  {loadingHistory ? (
                    <ActivityIndicator size="small" color={colors.accent} />
                  ) : (
                    <MaterialIcons name="history" size={18} color={colors.accent} />
                  )}
                  <Text style={styles.historyChipText} numberOfLines={1}>
                    {t("calculator.pastShort")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formProgressCard}>
              <View style={styles.formProgressMeta}>
                <Text style={styles.formProgressText}>
                  {t("calculator.answeredOf", { done: answeredCount, total: requiredKeys.length })}
                </Text>
                <Text style={styles.formProgressPct}>
                  {Math.round((answeredCount / requiredKeys.length) * 100)}%
                </Text>
              </View>
              <View style={styles.formTrack}>
                <View
                  style={[
                    styles.formTrackFill,
                    { width: `${(answeredCount / requiredKeys.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            {Object.keys(fieldErrors).length > 0 && (
              <View style={styles.formBanner} accessibilityLiveRegion="polite">
                <Ionicons name="alert-circle" size={18} color={colors.danger} />
                <Text style={styles.formBannerText}>{t("calculator.fixErrors")}</Text>
              </View>
            )}

            {formSections.map((section) => (
              <View
                key={section.id}
                style={styles.formCard}
                onLayout={(e) => {
                  sectionY.current[section.id] = e.nativeEvent.layout.y;
                }}
              >
                <View style={styles.formCardHead}>
                  <Ionicons name={section.icon} size={16} color={colors.accent} />
                  <Text style={styles.formCardTitle}>{section.title}</Text>
                </View>
                {section.keys.map((key) => {
                  const question = baseQuestions[key];
                  const error = fieldErrors[key];
                  const answered = !!answeredKeys[key];
                  return (
                    <View
                      key={key}
                      style={styles.formField}
                      onLayout={(e) => {
                        fieldY.current[key] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={styles.formLabel}>{question.label}</Text>
                      <PickerField
                        value={answered ? optionKey(answerMap[key]) : ""}
                        options={question.options.map((o) => ({ value: optionKey(o.value), label: o.label }))}
                        onChange={(picked) => {
                          const option = question.options.find((o) => optionKey(o.value) === picked);
                          if (option) handleSelectOption(key, option.value);
                        }}
                        placeholder={t("calculator.selectPlaceholder")}
                        title={question.label}
                        invalid={!!error}
                        leadingIcon={<Ionicons name={question.icon} size={20} color={colors.textMuted} />}
                      />
                      {error ? (
                        <View style={styles.formMessageRow} accessibilityLiveRegion="polite">
                          <Ionicons name="alert-circle" size={15} color={colors.danger} />
                          <Text style={[styles.formMessageText, { color: colors.danger }]}>{error}</Text>
                        </View>
                      ) : (
                        <Text style={styles.formHint}>{question.hint}</Text>
                      )}
                    </View>
                  );
                })}
                {section.id === "academics" && country === "japan" && (
                  <View style={styles.formMessageRow}>
                    <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
                    <Text style={[styles.formMessageText, { color: colors.textSecondary }]}>
                      {t("calculator.q.ieltsSub")}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {!!calculationError && (
              <Text style={styles.historyErrorText}>{calculationError}</Text>
            )}
            {!!historyError && (
              <Text style={styles.historyErrorText}>{historyError}</Text>
            )}
          </ScrollView>

          <View style={[styles.actionBar, { paddingBottom: insets.bottom + 20 }]}>
            <TouchableOpacity
              style={styles.primaryAction}
              onPress={calculatePossibility}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.primaryActionText} numberOfLines={1}>
                {t("calculator.calculate")}
              </Text>
              <Ionicons name="sparkles" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Processing overlay */}
        <Modal
          visible={isCalculating}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => {}}
        >
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={styles.processingTitle}>{t("calculator.calculating")}</Text>
              <Text style={styles.processingSubtitle}>{t("calculator.calculatingSub")}</Text>
              <View style={styles.processingBarTrack}>
                <View
                  style={[
                    styles.processingBarFill,
                    {
                      width: `${((processingStep + 1) / PROCESSING_STEPS.length) * 100}%`,
                    },
                  ]}
                />
              </View>
              <View style={styles.processingSteps}>
                {PROCESSING_STEPS.map((step, index) => {
                  const done = index < processingStep;
                  const active = index === processingStep;
                  return (
                    <View key={step.labelKey} style={styles.processingStepRow}>
                      <Ionicons
                        name={done ? "checkmark-circle" : step.icon}
                        size={18}
                        color={
                          done ? "#1baf7a" : active ? colors.accent : colors.border
                        }
                      />
                      <Text
                        style={[
                          styles.processingStepText,
                          done && styles.processingStepTextDone,
                          active && styles.processingStepTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {t(step.labelKey)}
                      </Text>
                      {active && (
                        <ActivityIndicator size="small" color={colors.accent} />
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isModalVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={closeReport}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={closeReport}
            />
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />

              {/* Header */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <View style={styles.sheetHeaderIcon}>
                    <MaterialIcons
                      name="assessment"
                      size={18}
                      color={colors.accent}
                    />
                  </View>
                  <Text style={styles.sheetTitle}>{t("calculator.reportTitle")}</Text>
                </View>
                <TouchableOpacity
                  style={styles.sheetCloseBtn}
                  onPress={closeReport}
                  accessibilityRole="button"
                  accessibilityLabel={t("calculator.closeReportA11y")}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.sheetDivider} />

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetScrollContent}
              >
                <View>
                  {/* Score + feedback */}
                  <View style={styles.heroCard}>
                    <LinearGradient
                      colors={
                        possibility >= 85
                          ? ["#15803d", "#22c55e"]
                          : possibility >= 70
                            ? ["#004aad", "#0d64c8"]
                            : possibility >= 50
                              ? ["#eb6834", "#f0885c"]
                              : ["#ef4444", "#f87171"]
                      }
                      style={styles.resultCircle}
                    >
                      <Text style={styles.resultText}>{animatedPossibility}%</Text>
                    </LinearGradient>
                    <Text style={styles.resultLevel}>
                      {possibility >= 85
                        ? t("calculator.levelExcellent")
                        : possibility >= 70
                          ? t("calculator.levelGood")
                          : possibility >= 50
                            ? t("calculator.levelModerate")
                            : t("calculator.levelLow")}
                    </Text>
                    <Text style={styles.feedbackText}>{feedback}</Text>
                  </View>

                  {/* Score Breakdown */}
                  <View style={styles.breakdownSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="stats-chart"
                        size={20}
                        color={colors.accent}
                      />
                      <Text style={styles.sectionTitle}>{t("calculator.scoreBreakdown")}</Text>
                    </View>

                    <ScoreBar
                      label={t("calculator.barGpa")}
                      score={scoreBreakdown.gpaScore}
                      maxScore={40}
                      icon="school"
                    />
                    <ScoreBar
                      label={t("calculator.barIelts")}
                      score={scoreBreakdown.ieltsScore}
                      maxScore={20}
                      icon="translate"
                    />
                    <ScoreBar
                      label={t("calculator.barResearch")}
                      score={scoreBreakdown.researchScore}
                      maxScore={15}
                      icon="science"
                    />
                    <ScoreBar
                      label={t("calculator.barExtracurricular")}
                      score={scoreBreakdown.extracurricularScore}
                      maxScore={10}
                      icon="groups"
                    />
                    <ScoreBar
                      label={t("calculator.barFinancial")}
                      score={scoreBreakdown.financialScore}
                      maxScore={10}
                      icon="account-balance-wallet"
                    />
                    <ScoreBar
                      label={t("calculator.barField")}
                      score={scoreBreakdown.fieldBonus}
                      maxScore={5}
                      icon="star"
                    />
                  </View>

                  {/* Strengths */}
                  {strengths.length > 0 && (
                    <View style={styles.strengthsSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.success}
                        />
                        <Text
                          style={[styles.sectionTitle, { color: colors.success }]}
                        >
                          {t("calculator.strengthsTitle")}
                        </Text>
                      </View>
                      {strengths.map((strength, index) => (
                        <View key={index} style={styles.listItem}>
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color={colors.success}
                          />
                          <Text style={styles.listItemText}>{strength}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Areas for Improvement */}
                  {improvements.length > 0 && (
                    <View style={styles.improvementsSection}>
                      <View style={styles.sectionHeader}>
                        <MaterialIcons
                          name="trending-up"
                          size={20}
                          color="#eb6834"
                        />
                        <Text
                          style={[styles.sectionTitle, { color: "#eb6834" }]}
                        >
                          {t("calculator.improveTitle")}
                        </Text>
                      </View>
                      {improvements.map((improvement, index) => (
                        <View key={index} style={styles.listItem}>
                          <MaterialIcons
                            name="arrow-forward"
                            size={16}
                            color="#eb6834"
                          />
                          <Text style={styles.listItemText}>{improvement}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Recommendations */}
                  {recommendations.length > 0 && (
                    <View style={styles.recommendationsSection}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="bulb"
                          size={20}
                          color={colors.accent}
                        />
                        <Text
                          style={[styles.sectionTitle, { color: colors.accent }]}
                        >
                          {t("calculator.nextSteps")}
                        </Text>
                      </View>
                      {recommendations.map((recommendation, index) => (
                        <View key={index} style={styles.recommendationCard}>
                          <Text style={styles.recommendationNumber}>
                            {index + 1}
                          </Text>
                          <Text style={styles.recommendationText}>
                            {recommendation}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                </View>
              </ScrollView>

            </View>
          </View>
        </Modal>

        {/* History Modal */}
        <Modal
          visible={isHistoryModalVisible}
          transparent
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setIsHistoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              activeOpacity={1}
              onPress={() => setIsHistoryModalVisible(false)}
            />
            <View style={styles.modalSheet}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <View style={styles.sheetHeaderIcon}>
                    <MaterialIcons name="history" size={18} color={colors.accent} />
                  </View>
                  <Text style={styles.sheetTitle}>{t("calculator.historyTitle")}</Text>
                  {pastResults.length > 0 && (
                    <View style={styles.sheetCountBadge}>
                      <Text style={styles.sheetCountBadgeText}>
                        {pastResults.length}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => setIsHistoryModalVisible(false)}
                  style={styles.sheetCloseBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t("calculator.closeHistoryA11y")}
                >
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.sheetScroll}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.historyScrollContent}
              >
                {pastResults.length === 0 ? (
                  <View style={styles.emptyHistoryContainer}>
                    <View style={styles.emptyHistoryIcon}>
                      <MaterialIcons name="history" size={36} color={colors.accent} />
                    </View>
                    <Text style={styles.emptyHistoryText}>
                      {t("calculator.noHistory")}
                    </Text>
                    <Text style={styles.emptyHistorySubtext}>
                      {t("calculator.noHistorySub")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Text style={styles.historyHint}>{t("calculator.historyHint")}</Text>
                    <View style={styles.historyList}>
                      {pastResults.map((result, index) => {
                        const score = Math.round(result.totalScore || 0);
                        const level = levelInfo(score);
                        const summary = [
                          t("calculator.gpaValue", { value: result.gpa }),
                          result.ielts ? t("calculator.ieltsValue", { value: result.ielts }) : null,
                          result.country ? countryLabel(result.country) : null,
                          result.studyField || null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return (
                          <View key={result.id || index} style={styles.historyCard}>
                            <TouchableOpacity
                              style={styles.historyMain}
                              onPress={() => openHistoryResult(result)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`${score}% ${level.label}, ${formatDate(result.calculatedAt)}`}
                            >
                              <View style={[styles.historyScoreCircle, { backgroundColor: level.color }]}>
                                <Text style={styles.historyScoreText}>{score}%</Text>
                              </View>
                              <View style={styles.historyCardInfo}>
                                <View style={styles.historyTitleRow}>
                                  <Text style={[styles.historyLevel, { color: level.color }]}>
                                    {level.label}
                                  </Text>
                                  <Text style={styles.historyDate} numberOfLines={1}>
                                    {formatDate(result.calculatedAt)}
                                  </Text>
                                </View>
                                <Text style={styles.historySummary} numberOfLines={2}>
                                  {summary}
                                </Text>
                              </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => deleteResult(result.id)}
                              accessibilityRole="button"
                              accessibilityLabel={t("calculator.deleteA11y")}
                            >
                              <MaterialIcons name="delete-outline" size={22} color={colors.textMuted} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <LoaderModal visible={loadingHistory} />

        {/* Alert Modal */}
        <AlertModal
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          actions={alertConfig.actions}
          onClose={closeAlert}
        />
      </SafeAreaView>
    </PaperProvider>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  headerContainer: {
    paddingHorizontal: 16,
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
    backgroundColor: colors.surfaceAlt,
    elevation: 2,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
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
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  titleTexts: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    textBreakStrategy: "simple",
  },
  pageSubtitle: {
    fontSize: 13,
    fontFamily: "Roboto",
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
    textBreakStrategy: "simple",
  },
  historyChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 44,
    maxWidth: "45%",
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: colors.accentLight,
  },
  historyChipText: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.accent,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.screenBackground,
  },
  formProgressCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  formProgressMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  formProgressText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: colors.textSecondary,
  },
  formProgressPct: {
    fontSize: 13,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.accent,
  },
  formTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    overflow: "hidden",
  },
  formTrackFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  formBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
  },
  formBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: colors.danger,
    textBreakStrategy: "simple",
  },
  formCard: {
    marginTop: 14,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  formCardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formCardTitle: {
    fontSize: 12.5,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.accent,
  },
  formField: {
    marginTop: 14,
  },
  formLabel: {
    fontSize: 13.5,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: "Roboto",
    color: colors.textMuted,
    marginTop: 6,
    textBreakStrategy: "simple",
  },
  formMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 5,
    marginTop: 8,
  },
  formMessageText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  primaryAction: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
  },
  primaryActionText: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
    textBreakStrategy: "simple",
  },
  historyErrorText: {
    color: colors.danger,
    fontSize: moderateScale(12),
    fontFamily: "Roboto",
    textAlign: "center",
    marginTop: verticalScale(8),
  },
  button: {
    backgroundColor: "#004aad",
    paddingVertical: moderateScale(14),
    paddingHorizontal: moderateScale(30),
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    shadowColor: "#004aad",
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
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalSheet: {
    width: "100%",
    maxHeight: SCREEN_HEIGHT * 0.88,
    backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sheetHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  sheetHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentLight,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textPrimary,
  },
  sheetCountBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  sheetCountBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  sheetCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  sheetDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: 20,
  },
  sheetScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resultCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  resultText: {
    fontSize: 34,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: "#fff",
  },
  resultLevel: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    marginBottom: 6,
    textBreakStrategy: "simple",
  },
  feedbackText: {
    fontSize: 14,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: "center",
  },
  breakdownSection: {
    backgroundColor: colors.surface,
    borderRadius: moderateScale(12),
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textPrimary,
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
    color: colors.textSecondary,
    fontWeight: "500",
  },
  scoreBarValue: {
    fontSize: moderateScale(13),
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textPrimary,
    fontWeight: "600",
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: colors.divider,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  strengthsSection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  improvementsSection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: verticalScale(8),
    gap: 8,
  },
  listItemText: {
    fontSize: 14,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  recommendationsSection: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  recommendationNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    overflow: "hidden",
    backgroundColor: colors.accent,
    color: "#fff",
    textAlign: "center",
    lineHeight: 26,
    fontSize: 13,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: colors.textPrimary,
    lineHeight: 20,
  },
  historyScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 28,
  },
  emptyHistoryContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyHistoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyHistoryText: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    marginTop: 16,
    textAlign: "center",
  },
  emptyHistorySubtext: {
    fontSize: 13.5,
    fontFamily: "Roboto",
    color: colors.textMuted,
    marginTop: 6,
    textAlign: "center",
    lineHeight: 20,
  },
  historyHint: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: colors.textMuted,
    marginBottom: 10,
    marginHorizontal: 4,
  },
  historyList: {
    gap: 10,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    minHeight: 72,
  },
  historyScoreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  historyScoreText: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: "#fff",
  },
  historyCardInfo: {
    flex: 1,
  },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 8,
  },
  historyLevel: {
    fontSize: 15,
    fontWeight: "800",
    fontFamily: "Roboto",
    flexShrink: 0,
  },
  historyDate: {
    flexShrink: 1,
    fontSize: 11.5,
    fontFamily: "Roboto",
    color: colors.textMuted,
  },
  historySummary: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: colors.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  deleteButton: {
    width: 44,
    height: 44,
    marginRight: 4,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  processingOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  processingCard: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  processingTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textPrimary,
    marginTop: 14,
    textBreakStrategy: "simple",
  },
  processingSubtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 18,
    textBreakStrategy: "simple",
  },
  processingBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.divider,
    marginTop: 18,
    overflow: "hidden",
  },
  processingBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  processingSteps: {
    width: "100%",
    marginTop: 16,
    gap: 11,
  },
  processingStepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 20,
  },
  processingStepText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: colors.textMuted,
    textBreakStrategy: "simple",
  },
  processingStepTextDone: {
    color: colors.textPrimary,
  },
  processingStepTextActive: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
});

export default ScholarshipPossibilityCalculator;
