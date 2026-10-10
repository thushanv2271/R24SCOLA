import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { LanguageContext, LANGUAGES } from "../components/LanguageContext";
import { useInterest } from "../components/InterestContext";
import { useTheme } from "../components/ThemeContext";
import { Colors } from "../constants/Colors";
import ScolaOwl from "../components/blocks/ScolaOwl";
import InterestCard from "../components/blocks/InterestCard";
import { PressableScale, haptic } from "../components/ui/motion";

// Calm, no-overshoot motion for every control on these screens.
const SMOOTH = { duration: 240, easing: Easing.out(Easing.cubic) };
import { declineNotifications, requestNotificationPermission } from "../services/pushNotifications";
import { ONBOARDING_DONE_KEY } from "../constants/onboarding";

// One first-launch setup in a single screen, the way polished apps do it:
// language -> what you're looking for -> look (light/dark) -> notifications.
// Each choice applies live, so you see Scola change as you go, and a progress
// bar at the top shows where you are. The owl comments on every step.
const STEPS = ["language", "interest", "theme", "notifications"];

const GREETINGS = {
  en: "Hello!",
  si: "ආයුබෝවන්!",
  es: "¡Hola!",
  fr: "Bonjour !",
  de: "Hallo!",
  nl: "Hallo!",
  pt: "Olá!",
  it: "Ciao!",
  ru: "Привет!",
  zh: "你好！",
  ja: "こんにちは！",
  ko: "안녕하세요!",
  hi: "नमस्ते!",
  ta: "வணக்கம்!",
};

const OWL_INTEREST = {
  universities: "interest.owlUniversities",
  companies: "interest.owlCompanies",
  both: "interest.owlBoth",
};

// ── Step 1: language ────────────────────────────────────────────────────────
const LanguageCard = ({ lang, selected, index, colors, reduce, onPress }) => {
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.value = reduce ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, SMOOTH);
  }, [selected, reduce, sel]);

  const cardStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(sel.value, [0, 1], [colors.surface, colors.tabBarAccent]),
    borderColor: interpolateColor(sel.value, [0, 1], [colors.border, colors.tabBarAccent]),
  }));
  const nameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textPrimary, "#ffffff"]),
  }));
  const subStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sel.value, [0, 1], [colors.textMuted, "rgba(255,255,255,0.82)"]),
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scale: 0.7 + 0.3 * sel.value }] }));

  return (
    <Animated.View
      style={styles.langWrap}
      entering={reduce ? undefined : FadeInDown.delay(60 + index * 35).duration(320)}
    >
      <PressableScale
        scaleTo={0.97}
        smooth
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={`${lang.name}, ${lang.english}`}
      >
        <Animated.View style={[styles.langCard, cardStyle]}>
          <View style={styles.langText}>
            <Animated.Text style={[styles.langName, nameStyle]} numberOfLines={1}>
              {lang.name}
            </Animated.Text>
            {lang.english !== lang.name && (
              <Animated.Text style={[styles.langSub, subStyle]} numberOfLines={1}>
                {lang.english}
              </Animated.Text>
            )}
          </View>
          <Animated.View style={[styles.check, checkStyle]}>
            <Ionicons name="checkmark" size={14} color={colors.tabBarAccent} />
          </Animated.View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
};

// ── Step 3: look ────────────────────────────────────────────────────────────
// A tiny drawing of the app in a given scheme, so people choose by sight.
const Mock = ({ scheme, split = false }) => {
  const c = Colors[scheme];
  return (
    <View style={[styles.mock, split && styles.mockHalf, { backgroundColor: c.screenBackground }]}>
      <View style={[styles.mockHeader, { backgroundColor: c.tabBarAccent }]} />
      <View style={styles.mockBody}>
        <View style={[styles.mockRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.mockDot, { backgroundColor: c.accent }]} />
          <View style={[styles.mockLine, { backgroundColor: c.textMuted }]} />
        </View>
        <View style={[styles.mockRow, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.mockDot, { backgroundColor: c.accent }]} />
          <View style={[styles.mockLine, { backgroundColor: c.textMuted, width: "40%" }]} />
        </View>
      </View>
      <View style={[styles.mockTabs, { backgroundColor: c.tabBarBackground, borderTopColor: c.tabBarBorder }]}>
        <View style={[styles.mockTab, { backgroundColor: c.tabBarAccent }]} />
        <View style={[styles.mockTab, { backgroundColor: c.tabIconDefault }]} />
        <View style={[styles.mockTab, { backgroundColor: c.tabIconDefault }]} />
      </View>
    </View>
  );
};

const ThemeCard = ({ mode, label, selected, index, colors, reduce, onPress }) => {
  const sel = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    sel.value = reduce ? (selected ? 1 : 0) : withTiming(selected ? 1 : 0, SMOOTH);
  }, [selected, reduce, sel]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -4 * sel.value }],
    borderColor: interpolateColor(sel.value, [0, 1], [colors.border, colors.tabBarAccent]),
  }));
  const checkStyle = useAnimatedStyle(() => ({ opacity: sel.value, transform: [{ scale: 0.7 + 0.3 * sel.value }] }));

  return (
    <Animated.View
      style={styles.themeWrap}
      entering={reduce ? undefined : FadeInDown.delay(80 + index * 90).duration(360)}
    >
      <PressableScale
        scaleTo={0.98}
        smooth
        onPress={onPress}
        accessibilityRole="radio"
        accessibilityState={{ selected }}
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.themeCard, { backgroundColor: colors.surface }, cardStyle]}>
          {mode === "system" ? (
            <View style={styles.mockSplit}>
              <Mock scheme="light" split />
              <Mock scheme="dark" split />
            </View>
          ) : (
            <Mock scheme={mode} />
          )}
          <View style={styles.themeLabelRow}>
            <Text style={[styles.themeLabel, { color: colors.textPrimary }]} numberOfLines={1}>
              {label}
            </Text>
          </View>
          <Animated.View style={[styles.themeCheck, { backgroundColor: colors.tabBarAccent }, checkStyle]}>
            <Ionicons name="checkmark" size={14} color="#fff" />
          </Animated.View>
        </Animated.View>
      </PressableScale>
    </Animated.View>
  );
};

// ── Step 4: notifications ───────────────────────────────────────────────────
const RingingBell = ({ colors, reduce }) => {
  const swing = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduce) return;
    swing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 120 }),
        withTiming(-1, { duration: 240 }),
        withTiming(1, { duration: 240 }),
        withTiming(0, { duration: 120 }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
    );
    pulse.value = withRepeat(withTiming(1, { duration: 1800 }), -1, false);
  }, [reduce, swing, pulse]);

  const bellStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${swing.value * 16}deg` }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.35 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.7 }],
  }));

  return (
    <View style={styles.bellWrap}>
      <Animated.View style={[styles.bellRing, { backgroundColor: colors.tabBarAccent }, ringStyle]} />
      <View style={[styles.bellCircle, { backgroundColor: colors.tabBarAccent }]}>
        <Animated.View style={bellStyle}>
          <Ionicons name="notifications" size={52} color="#fff" />
        </Animated.View>
      </View>
    </View>
  );
};

// ── Progress ────────────────────────────────────────────────────────────────
// A segment is filled exactly when its step has been reached. The fill is
// simply present or absent (it slides in from the left / back out), so the bar
// always matches the current step whichever way you move, however fast.
const Segment = ({ done, colors, reduce }) => (
  <View style={[styles.segment, { backgroundColor: colors.border }]}>
    {done && (
      <Animated.View
        entering={reduce ? undefined : SlideInLeft.duration(280)}
        exiting={reduce ? undefined : SlideOutLeft.duration(200)}
        style={[styles.segmentFill, { backgroundColor: colors.tabBarAccent }]}
      />
    )}
  </View>
);

const Onboarding = () => {
  const router = useRouter();
  const reduce = useReducedMotion();
  const { language, setLanguage, t } = useContext(LanguageContext);
  const { interest, interestConfigured, setInterest } = useInterest();
  const { colors, themePreference, setThemePreference } = useTheme();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [pickedInterest, setPickedInterest] = useState(interestConfigured ? interest : null);
  const [hop, setHop] = useState(0);
  const [cheer, setCheer] = useState(false);
  const leaving = useRef(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const go = (next) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setHop((n) => n + 1);
  };

  // Android back steps back through the setup instead of leaving the app.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step > 0 && !leaving.current) {
        setDirection(-1);
        setStep((s) => s - 1);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [step]);

  const finish = () => {
    if (leaving.current) return;
    leaving.current = true;
    haptic("success");
    setCheer(true);
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, "1").catch(() => {});
    timer.current = setTimeout(() => router.replace("/login"), reduce ? 0 : 800);
  };

  const chooseLanguage = (code) => {
    haptic("select");
    setHop((n) => n + 1);
    setLanguage(code, { silent: true });
  };
  const chooseInterest = (value) => {
    haptic("select");
    setPickedInterest(value);
    setHop((n) => n + 1);
  };
  const chooseTheme = (mode) => {
    if (mode === themePreference) return;
    haptic("select");
    setHop((n) => n + 1);
    setThemePreference(mode);
  };

  const next = () => {
    if (step === 0) {
      setLanguage(language, { silent: true }); // persist even the default
      go(1);
    } else if (step === 1) {
      if (!pickedInterest) return;
      haptic("select");
      setInterest(pickedInterest);
      go(2);
    } else if (step === 2) {
      haptic("select");
      setThemePreference(themePreference); // marks the theme as chosen
      go(3);
    }
  };

  const enableNotifications = async () => {
    if (leaving.current) return;
    haptic("select");
    await requestNotificationPermission();
    finish();
  };
  const skipNotifications = async () => {
    if (leaving.current) return;
    await declineNotifications();
    finish();
  };

  const stepName = STEPS[step];
  const titles = {
    language: t("settings.languageTitle"),
    interest: t("interest.title"),
    theme: t("settings.appearance"),
    notifications: t("settings.notifications"),
  };
  const subtitles = {
    language: null,
    interest: t("interest.subtitle"),
    theme: t("onboardingFlow.themeSubtitle"),
    notifications: t("onboardingFlow.notifSubtitle"),
  };
  const bubble = {
    language: GREETINGS[language] || GREETINGS.en,
    interest: t(pickedInterest ? OWL_INTEREST[pickedInterest] : "interest.owlIdle"),
    theme: t("onboardingFlow.owlTheme"),
    notifications: t("onboardingFlow.owlNotif"),
  }[stepName];

  const interestOptions = [
    { value: "universities", title: t("explore.universities"), description: t("interest.universitiesDesc") },
    { value: "companies", title: t("explore.companies"), description: t("interest.companiesDesc") },
    { value: "both", title: t("interest.both"), description: t("interest.bothDesc") },
  ];
  const themeOptions = [
    { mode: "light", label: t("settings.themeLight") },
    { mode: "dark", label: t("settings.themeDark") },
    { mode: "system", label: t("settings.themeSystem") },
  ];

  const entering = reduce ? undefined : direction > 0 ? SlideInRight.duration(300) : SlideInLeft.duration(300);
  const exiting = reduce ? undefined : direction > 0 ? SlideOutLeft.duration(220) : SlideOutRight.duration(220);
  const canContinue = stepName !== "interest" || !!pickedInterest;

  return (
    <SafeAreaView edges={["top", "bottom", "left", "right"]} style={[styles.screen, { backgroundColor: colors.screenBackground }]}>
      <StatusBar barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"} />

      <View style={styles.topBar}>
        <View style={styles.backSlot}>
          {step > 0 && (
            <TouchableOpacity
              onPress={() => {
                haptic("select");
                go(step - 1);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t("ui.a11y.back")}
              style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}
            >
              <Ionicons name="arrow-back" size={25} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.progress} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: step + 1 }}>
          {STEPS.map((name, i) => (
            <Segment key={name} done={i <= step} colors={colors} reduce={reduce} />
          ))}
        </View>
        <View style={styles.backSlot} />
      </View>

      <View style={styles.hero}>
        <Animated.View entering={reduce ? undefined : FadeIn.duration(400)}>
          <ScolaOwl size={92} hopKey={hop} cheer={cheer} />
        </Animated.View>
        <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.bubbleTail, { backgroundColor: colors.surface, borderColor: colors.border }]} />
          <Animated.Text
            key={`${stepName}:${bubble}`}
            style={[styles.bubbleText, { color: colors.tabBarAccent }]}
            entering={reduce ? undefined : FadeIn.duration(250)}
          >
            {bubble}
          </Animated.Text>
        </View>
      </View>

      <Animated.View key={stepName} style={styles.stage} entering={entering} exiting={exiting}>
        <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
          {titles[stepName]}
        </Text>
        {subtitles[stepName] ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitles[stepName]}</Text>
        ) : null}

        {stepName === "language" && (
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang, index) => (
              <LanguageCard
                key={lang.code}
                lang={lang}
                index={index}
                selected={language === lang.code}
                colors={colors}
                reduce={reduce}
                onPress={() => chooseLanguage(lang.code)}
              />
            ))}
          </ScrollView>
        )}

        {stepName === "interest" && (
          <ScrollView contentContainerStyle={styles.interestList} showsVerticalScrollIndicator={false}>
            {interestOptions.map((option, index) => (
              <View key={option.value} style={styles.interestGap}>
                <InterestCard
                  value={option.value}
                  title={option.title}
                  description={option.description}
                  selected={pickedInterest === option.value}
                  index={index}
                  onPress={() => chooseInterest(option.value)}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {stepName === "theme" && (
          <View style={styles.themeRow} accessibilityRole="radiogroup">
            {themeOptions.map((option, index) => (
              <ThemeCard
                key={option.mode}
                mode={option.mode}
                label={option.label}
                index={index}
                selected={themePreference === option.mode}
                colors={colors}
                reduce={reduce}
                onPress={() => chooseTheme(option.mode)}
              />
            ))}
          </View>
        )}

        {stepName === "notifications" && (
          <View style={styles.bellStage}>
            <RingingBell colors={colors} reduce={reduce} />
          </View>
        )}
      </Animated.View>

      <Animated.View style={styles.footer} entering={reduce ? undefined : FadeInUp.delay(450).duration(380)}>
        {stepName === "notifications" ? (
          <>
            <PressableScale
              scaleTo={0.98}
              smooth
              onPress={enableNotifications}
              accessibilityRole="button"
              accessibilityLabel={t("onboardingFlow.notifOn")}
              style={[styles.button, { backgroundColor: colors.tabBarAccent }]}
            >
              <Ionicons name="notifications" size={20} color="#fff" />
              <Text style={[styles.buttonText, styles.buttonTextLeft]}>{t("onboardingFlow.notifOn")}</Text>
            </PressableScale>
            <TouchableOpacity
              onPress={skipNotifications}
              style={styles.ghost}
              accessibilityRole="button"
              accessibilityLabel={t("onboardingFlow.notifLater")}
            >
              <Text style={[styles.ghostText, { color: colors.textSecondary }]}>{t("onboardingFlow.notifLater")}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <PressableScale
            scaleTo={0.98}
            smooth
            onPress={next}
            disabled={!canContinue}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canContinue }}
            accessibilityLabel={t("common.continue")}
            style={[styles.button, { backgroundColor: colors.tabBarAccent, opacity: canContinue ? 1 : 0.4 }]}
          >
            <Text style={styles.buttonText}>{t("common.continue")}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </PressableScale>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  backSlot: { width: 52, alignItems: "flex-start" },
  // Same back button as the in-app screens (ScreenHeader): 44px round, arrow-back.
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  progress: { flex: 1, flexDirection: "row", gap: 6 },
  segment: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  segmentFill: { width: "100%", height: "100%", borderRadius: 3 },
  hero: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: 20, paddingTop: 12 },
  bubble: {
    flexShrink: 1,
    minWidth: 130,
    marginLeft: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bubbleTail: {
    position: "absolute",
    left: -7,
    top: "50%",
    marginTop: -7,
    width: 14,
    height: 14,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    transform: [{ rotate: "45deg" }],
  },
  bubbleText: { fontSize: 16, lineHeight: 22, fontWeight: "800", textAlign: "center" },
  stage: { flex: 1, paddingTop: 12 },
  title: { paddingHorizontal: 24, fontSize: 22, lineHeight: 30, fontWeight: "800", textAlign: "center" },
  subtitle: { marginTop: 4, paddingHorizontal: 24, fontSize: 14, lineHeight: 20, textAlign: "center" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  langWrap: { width: "48%", marginTop: 10 },
  langCard: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  langText: { flex: 1, marginRight: 6 },
  langName: { fontSize: 16, lineHeight: 22, fontWeight: "700" },
  langSub: { marginTop: 1, fontSize: 12, lineHeight: 16 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  interestList: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  interestGap: { marginBottom: 12 },
  themeRow: { flexDirection: "row", paddingHorizontal: 16, paddingTop: 22, gap: 10 },
  themeWrap: { flex: 1 },
  themeCard: { borderRadius: 18, borderWidth: 2, padding: 8, overflow: "visible" },
  themeLabelRow: { paddingTop: 8, paddingBottom: 4, alignItems: "center" },
  themeLabel: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  themeCheck: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mock: { height: 132, borderRadius: 10, overflow: "hidden" },
  mockHalf: { flex: 1 },
  mockSplit: { flexDirection: "row", gap: 2, borderRadius: 10, overflow: "hidden" },
  mockHeader: { height: 24 },
  mockBody: { flex: 1, padding: 6, gap: 5 },
  mockRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 24,
    paddingHorizontal: 5,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  mockDot: { width: 9, height: 9, borderRadius: 5 },
  mockLine: { width: "60%", height: 4, borderRadius: 2, marginLeft: 5, opacity: 0.6 },
  mockTabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mockTab: { width: 12, height: 5, borderRadius: 3 },
  bellStage: { flex: 1, alignItems: "center", justifyContent: "center" },
  bellWrap: { width: 160, height: 160, alignItems: "center", justifyContent: "center" },
  bellRing: { position: "absolute", width: 120, height: 120, borderRadius: 60 },
  bellCircle: { width: 120, height: 120, borderRadius: 60, alignItems: "center", justifyContent: "center" },
  footer: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
    borderRadius: 16,
  },
  buttonText: { marginRight: 8, fontSize: 16, lineHeight: 22, fontWeight: "700", color: "#fff" },
  buttonTextLeft: { marginRight: 0, marginLeft: 10 },
  ghost: { alignSelf: "center", minHeight: 48, justifyContent: "center", paddingHorizontal: 20, marginTop: 4 },
  ghostText: { fontSize: 15, lineHeight: 20, fontWeight: "700" },
});

export default Onboarding;
