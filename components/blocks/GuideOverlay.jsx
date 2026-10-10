import React, { useContext, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import HootAvatar from "./HootAvatar";
import HootPet from "./HootPet";
import { haptic } from "../ui/motion";
import { playSound, useFeedbackPrefs } from "../../utils/feedback";
import { useGuideProgress } from "../../utils/guideProgress";
import { measureGuideTarget, revealGuideTarget, subscribeGuideScroll } from "../../utils/guideTargets";
import {
  GUIDE_PHASES,
  GUIDE_STEPS,
  TOUR_PHASES,
  canGuideGoBack,
  endSetupGuide,
  getSetupGuide,
  nextGuideStep,
  prevGuideStep,
  setGuideMinimized,
  useSetupGuide,
} from "../../utils/setupGuide";

const OWL_SIZE = 56;
const OWL_S = OWL_SIZE / 128;
const OWL_PIVOT = { x: 96 * OWL_S, y: 76 * OWL_S };
const STICK_BASE_ANGLE = 24;
const TAB_BAR_SPACE = 92;
const EDGE = 12;
const SCOUT = 40;

const screenKey = (segments) => {
  if (!segments.length) return "";
  if (segments[0] === "(tabs)") return `(tabs)/${segments[1] || "index"}`;
  return segments[0];
};

const goToStep = (router, step, fromScreen) => {
  if (step.route.startsWith("/(tabs)")) router.navigate(step.route);
  else if (fromScreen.startsWith("(tabs)")) router.push(step.route);
  else router.replace(step.route);
};

const sameRect = (a, b) =>
  a && b && Math.abs(a.x - b.x) < 2 && Math.abs(a.y - b.y) < 2 && Math.abs(a.width - b.width) < 2 && Math.abs(a.height - b.height) < 2;

// Hoot, the owl guide: a compact card above every screen. It takes the user to
// the real screen for each step, circles the control to use and points its
// stick at it. Steps move on by themselves when the user does what was asked.
const GuideOverlay = () => {
  const { t, language } = useContext(LanguageContext);
  const { colors, themePreference } = useTheme();
  const feedback = useFeedbackPrefs();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const guide = useSetupGuide();

  const step = GUIDE_STEPS[guide.index];
  const screen = screenKey(segments);
  const onStepScreen = screen === step.screen;
  const onTabs = screen.startsWith("(tabs)");

  const [rect, setRect] = useState(null);
  const [scrolling, setScrolling] = useState(false);
  const [cardH, setCardH] = useState(132);
  const [keyboardUp, setKeyboardUp] = useState(false);
  const [reduce, setReduce] = useState(false);
  const enter = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const ringVis = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const revealedFor = useRef(-1);
  const prevScreen = useRef(screen);
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const snap = useRef({ index: -1 });
  if (snap.current.index !== guide.index) {
    snap.current = { index: guide.index, language, theme: themePreference, sound: feedback.sound, haptics: feedback.haptics };
  }
  const done =
    (step.watch === "language" && language !== snap.current.language) ||
    (step.watch === "theme" && themePreference !== snap.current.theme) ||
    (step.watch === "feedback" &&
      (feedback.sound !== snap.current.sound || feedback.haptics !== snap.current.haptics));

  const stepDoneNow = done || guide.stepDone.includes(step.id);
  const { isPhaseDone } = useGuideProgress();

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardUp(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: guide.active ? 1 : 0,
      duration: guide.active ? 280 : 160,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [guide.active, enter]);

  useEffect(() => {
    if (reduce || !guide.active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, guide.active, pulse]);

  // Crossfade the message when the step (or its done state) changes.
  useEffect(() => {
    textFade.setValue(0);
    Animated.timing(textFade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [guide.index, stepDoneNow, textFade]);

  // Take the user to the screen this step belongs to.
  useEffect(() => {
    if (!guide.active) return;
    if (screenRef.current === step.screen) return;
    goToStep(router, step, screenRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.active, guide.index]);

  // Moving between screens can finish a step: tapping the row we pointed at,
  // or leaving a form page (save or back) once the user has been on it.
  useEffect(() => {
    const prev = prevScreen.current;
    prevScreen.current = screen;
    const g = getSetupGuide();
    if (!g.active) return;
    if (screen === "index" || screen === "login") return endSetupGuide();
    const current = GUIDE_STEPS[g.index];
    if (current.advanceOnScreen && screen === current.advanceOnScreen && prev === current.screen) nextGuideStep();
    else if (current.leaveAdvances && prev === current.screen && screen !== current.screen) nextGuideStep();
  }, [screen]);

  // Fixed targets sit in the tab bar, so lift the card to leave room for the
  // owl that stands on top of the button it is pointing at.
  const bottomOffset = onTabs ? TAB_BAR_SPACE + (step.fixed ? SCOUT + 10 : 0) : insets.bottom + EDGE;
  const cardTop = height - bottomOffset - cardH;

  // Where the target is relative to the visible part of the screen.
  const viewTop = insets.top + 64;
  const viewBottom = cardTop - 8;
  let dir = "here";
  if (rect && !step.fixed) {
    const cy = rect.y + rect.height / 2;
    dir = cy < viewTop ? "up" : cy > viewBottom ? "down" : "here";
  }
  const scoutOn = !!rect && onStepScreen && !!step.target && !guide.minimized && !keyboardUp && guide.active;
  const ringShown = scoutOn && dir === "here" && !scrolling;
  let scoutX = EDGE;
  let scoutY = viewTop;
  if (rect && dir === "here") {
    scoutX = Math.max(EDGE, Math.min(width - EDGE - SCOUT, rect.x + rect.width - 22));
    scoutY = rect.y - SCOUT + 6;
    if (scoutY < insets.top + 4) scoutY = rect.y + rect.height - 8;
  } else if (dir === "down") {
    scoutY = viewBottom - SCOUT - 4;
  }
  useEffect(() => {
    Animated.timing(ringVis, { toValue: ringShown ? 1 : 0, duration: ringShown ? 240 : 120, useNativeDriver: true }).start();
  }, [ringShown, ringVis]);
  const scoutPos = useRef(new Animated.ValueXY({ x: EDGE, y: viewTop })).current;
  const scoutVis = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!scoutOn) {
      Animated.timing(scoutVis, { toValue: 0, duration: 120, useNativeDriver: true }).start();
      return;
    }
    Animated.timing(scoutVis, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (reduce) scoutPos.setValue({ x: scoutX, y: scoutY });
    else Animated.spring(scoutPos, { toValue: { x: scoutX, y: scoutY }, friction: 8, tension: 70, useNativeDriver: true }).start();
  }, [scoutOn, scoutX, scoutY, reduce, scoutPos, scoutVis]);

  // Locate the control once the screen has settled, scroll it into view if the
  // card would hide it, and re-measure after the user stops scrolling.
  useEffect(() => {
    setRect(null);
    setScrolling(false);
    if (!guide.active || !step.target || !onStepScreen) return undefined;
    let cancelled = false;
    let tries = 0;
    let settle;
    const measure = async () => {
      const next = await measureGuideTarget(step.target);
      if (cancelled) return null;
      setRect((prev) => (sameRect(prev, next) ? prev : next));
      return next;
    };
    const attempt = async () => {
      const next = await measure();
      if (cancelled) return;
      if (!next) {
        if (++tries < 8) settle = setTimeout(attempt, 350);
        return;
      }
      if (revealedFor.current !== guide.index) {
        revealedFor.current = guide.index;
        if (!step.fixed && (next.y < insets.top + 70 || next.y + next.height > cardTop - EDGE)) revealGuideTarget(step.target, next);
      }
    };
    settle = setTimeout(attempt, 380);
    let quiet;
    let lastLive = 0;
    const unsubscribe = subscribeGuideScroll(() => {
      setScrolling(true);
      const now = Date.now();
      if (now - lastLive > 90) {
        lastLive = now;
        measure();
      }
      clearTimeout(quiet);
      quiet = setTimeout(async () => {
        await measure();
        if (!cancelled) setScrolling(false);
      }, 140);
    });
    return () => {
      cancelled = true;
      clearTimeout(settle);
      clearTimeout(quiet);
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guide.active, guide.index, onStepScreen, step.target]);

  useEffect(() => {
    if (guide.active && step.kind === "outro") {
      playSound("success");
      haptic("success");
    }
  }, [guide.active, step.kind]);

  const doneSeen = useRef({ index: -1, value: false });
  useEffect(() => {
    const prev = doneSeen.current;
    doneSeen.current = { index: guide.index, value: stepDoneNow };
    if (guide.active && prev.index === guide.index && !prev.value && stepDoneNow) {
      playSound("success");
      haptic("success");
    }
  }, [guide.active, guide.index, stepDoneNow]);

  useEffect(() => {
    if (keyboardUp && guide.active && !guide.minimized) setGuideMinimized(true);
  }, [keyboardUp, guide.active, guide.minimized]);

  if (!guide.active) return <HootPet screen={screen} />;

  let aim = 0;
  if (rect) {
    const pivotX = EDGE + 12 + OWL_PIVOT.x;
    const pivotY = cardTop + 12 + OWL_PIVOT.y;
    const targetX = rect.x + Math.min(rect.width * 0.4, 140);
    const targetY = rect.y + rect.height / 2;
    const angle = (Math.atan2(pivotY - targetY, targetX - pivotX) * 180) / Math.PI;
    aim = Math.max(-80, Math.min(120, angle - STICK_BASE_ANGLE));
  }

  const isIntro = step.kind === "intro";
  const isOutro = step.kind === "outro";
  const isTour = step.group === "tour";
  const isHelp = step.group === "help";
  // The tour shows its own five stops; tasks show the five to-dos.
  const phases = isTour ? TOUR_PHASES : GUIDE_PHASES;
  const phaseIndex = phases.findIndex((p) => p.id === step.phase);
  const phase = phases[phaseIndex];
  const title = phase ? t(phase.titleKey) : t("setup.title");
  const text = isTour
    ? t(step.textKey)
    : isOutro
      ? t("setup.doneOwl")
      : stepDoneNow
        ? t("setup.stepDone")
        : t(`setup.tour.${step.id}`);

  const press = (fn) => () => {
    haptic("select");
    fn();
  };

  const lost = !onStepScreen && !isIntro && !isOutro;
  // One clear primary action per card: Start / Next / Done. Leaving is a
  // separate, plainly named text button ("Skip tour" or "Exit"), never an icon.
  const nextLabel = isOutro
    ? t("setup.doneCta")
    : isIntro
      ? t("setup.start")
      : lost
        ? t("setup.takeMe")
        : isHelp
          ? t("common.close")
          : t("setup.next");
  const canBack = canGuideGoBack(guide.index) && !isOutro;
  const showLeave = !isOutro && !isHelp;
  const leaveLabel = isTour ? t("onboardingFlow.skipTour") : t("onboardingFlow.exit");

  const primary = () => {
    if (isOutro) return endSetupGuide();
    if (lost) return goToStep(router, step, screen);
    nextGuideStep();
  };

  if (guide.minimized) {
    return (
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {!keyboardUp && (
          <TouchableOpacity
            onPress={press(() => setGuideMinimized(false))}
            activeOpacity={0.85}
            style={[styles.chip, { bottom: bottomOffset, backgroundColor: colors.surface, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={t("setup.title")}
          >
            <HootAvatar size={44} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {rect && onStepScreen && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: rect.x - 5,
            top: rect.y - 5,
            width: rect.width + 10,
            height: rect.height + 10,
            opacity: ringVis,
          }}
        >
          <Animated.View
            style={{
              flex: 1,
              borderRadius: 16,
              borderWidth: 2.5,
              borderColor: colors.accent,
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
            }}
          />
        </Animated.View>
      )}

      {step.target && (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.scout,
            { opacity: scoutVis, transform: [{ translateX: scoutPos.x }, { translateY: scoutPos.y }] },
          ]}
        >
          {dir === "here" ? (
            <View pointerEvents="none" style={[styles.scoutOwl, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
              <HootAvatar size={32} calm />
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={press(() => rect && revealGuideTarget(step.target, rect))}
              style={[styles.scoutPill, { backgroundColor: colors.surface, borderColor: colors.accent }]}
              accessibilityRole="button"
              accessibilityLabel={dir === "up" ? t("setup.scrollUp") : t("setup.scrollDown")}
            >
              <View style={[styles.scoutOwl, styles.scoutOwlInline, { backgroundColor: colors.accentLight }]}>
                <HootAvatar size={32} calm />
              </View>
              <Text style={[styles.scoutText, { color: colors.textPrimary }]} numberOfLines={2} maxFontSizeMultiplier={1.15}>
                {dir === "up" ? t("setup.scrollUp") : t("setup.scrollDown")}
              </Text>
              <Animated.View
                style={{
                  transform: [{ translateY: pulse.interpolate({ inputRange: [0, 1], outputRange: dir === "up" ? [1, -4] : [-1, 4] }) }],
                }}
              >
                <Ionicons name={dir === "up" ? "arrow-up" : "arrow-down"} size={20} color={colors.accent} />
              </Animated.View>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}

      <Animated.View
        onLayout={(e) => setCardH(e.nativeEvent.layout.height)}
        style={[
          styles.card,
          {
            left: EDGE,
            width: Math.min(width - EDGE * 2, 520),
            bottom: bottomOffset,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: enter,
            transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
          },
        ]}
      >
        <View style={styles.row}>
          <View style={styles.owl}>
            <HootAvatar tour size={OWL_SIZE} hopKey={guide.index + 1} cheer={isOutro} aim={aim} />
          </View>
          <Animated.View style={[styles.body, { opacity: textFade }]}>
            <Text style={[styles.title, { color: stepDoneNow ? colors.success : colors.accent }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
              {stepDoneNow ? "✓ " : ""}
              {title}
            </Text>
            <Text style={[styles.text, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.25}>
              {text}
            </Text>
          </Animated.View>
          {!isOutro && !isTour && (
            <View style={styles.tools}>
              <TouchableOpacity
                onPress={press(() => setGuideMinimized(true))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t("setup.minimize")}
              >
                <Ionicons name="chevron-down" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <View style={styles.strip} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {phases.map((p, i) => {
              const state = isTour
                ? isOutro || i < phaseIndex
                  ? "done"
                  : i === phaseIndex
                    ? "now"
                    : "todo"
                : isPhaseDone(p.id)
                  ? "done"
                  : i === phaseIndex
                    ? "now"
                    : "todo";
              return (
                <View
                  key={p.id}
                  style={[
                    styles.dot,
                    { borderColor: colors.border },
                    state === "now" && { backgroundColor: colors.accent, borderColor: colors.accent },
                    state === "done" && { backgroundColor: colors.success, borderColor: colors.success },
                  ]}
                >
                  <Ionicons
                    name={state === "done" ? "checkmark" : p.icon}
                    size={state === "now" ? 14 : 13}
                    color={state === "now" || state === "done" ? "#fff" : colors.textMuted}
                  />
                </View>
              );
            })}
          </View>

          <View style={styles.actions}>
          {showLeave && (
            <TouchableOpacity style={styles.ghost} onPress={press(endSetupGuide)} accessibilityRole="button">
              <Text style={[styles.ghostText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2} numberOfLines={1}>
                {leaveLabel}
              </Text>
            </TouchableOpacity>
          )}
          {canBack && (
            <TouchableOpacity
              style={styles.back}
              onPress={press(prevGuideStep)}
              accessibilityRole="button"
              accessibilityLabel={t("setup.back")}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.primary, { backgroundColor: colors.tabBarAccent || colors.accent }]}
            onPress={press(primary)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.primaryText} maxFontSizeMultiplier={1.2} numberOfLines={1}>
              {nextLabel}
            </Text>
          </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: "absolute",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    paddingHorizontal: 12,
    paddingBottom: 10,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  owl: { width: 66, height: OWL_SIZE, marginRight: 8 },
  body: { flex: 1, minHeight: OWL_SIZE },
  title: { fontSize: 12, fontWeight: "800", fontFamily: "Roboto", letterSpacing: 0.3, textTransform: "uppercase" },
  text: { fontSize: 14, lineHeight: 19, fontWeight: "500", fontFamily: "Roboto", marginTop: 2 },
  tools: { alignItems: "center", gap: 6, marginLeft: 6 },
  footer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8, columnGap: 6, rowGap: 6 },
  strip: { flex: 1, minWidth: 146, flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", alignItems: "center", marginLeft: "auto" },
  dot: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  ghost: { height: 38, paddingHorizontal: 8, justifyContent: "center" },
  ghostText: { fontSize: 13, fontWeight: "700", fontFamily: "Roboto" },
  back: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  primary: {
    height: 38,
    minWidth: 84,
    paddingHorizontal: 16,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#fff", fontSize: 14, fontWeight: "800", fontFamily: "Roboto" },
  scout: { position: "absolute", left: 0, top: 0, maxWidth: 300 },
  scoutOwl: {
    width: SCOUT,
    height: SCOUT,
    borderRadius: SCOUT / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  scoutOwlInline: { borderWidth: 0, elevation: 0, shadowOpacity: 0 },
  scoutPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 4,
    paddingRight: 12,
    paddingVertical: 4,
    minHeight: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    maxWidth: 300,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  scoutText: { flexShrink: 1, fontSize: 13, fontWeight: "700", fontFamily: "Roboto" },
  chip: {
    position: "absolute",
    right: EDGE,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
});

export default GuideOverlay;
