import React, { useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { useReducedMotion } from "react-native-reanimated";

// "Getting started" checklist. Collapsed it is one compact card: progress bar
// plus the single next step. "Show all steps" expands the full numbered list.
const DISMISS_KEY = "@scola_journey_dismissed";

const JourneyCard = ({ steps, onStepPress }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(DISMISS_KEY)
      .then((v) => alive && setDismissed(v === "1"))
      .catch(() => alive && setDismissed(false));
    return () => {
      alive = false;
    };
  }, []);

  const dismiss = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setDismissed(true);
    AsyncStorage.setItem(DISMISS_KEY, "1").catch(() => {});
  };

  const doneCount = steps.filter((step) => step.done).length;
  if (dismissed || doneCount === steps.length) return null;

  const currentIndex = steps.findIndex((step) => !step.done);
  const current = steps[currentIndex];
  const percent = Math.round((doneCount / steps.length) * 100);

  const toggle = () => {
    if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.headRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]} accessibilityRole="header">
          {t("home.journeyTitle")}
        </Text>
        <Text style={[styles.progressText, { color: colors.textSecondary }]}>
          {t("home.journeyProgress", { done: String(doneCount), total: String(steps.length) })}
        </Text>
        <TouchableOpacity
          onPress={dismiss}
          style={styles.close}
          accessibilityRole="button"
          accessibilityLabel={t("setup.chat.close")}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: colors.accent }]} />
      </View>

      {!expanded && (
        <TouchableOpacity
          style={[styles.nextRow, { backgroundColor: colors.accentLight }]}
          onPress={() => onStepPress(current)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={t(current.titleKey)}
        >
          <View style={[styles.nextIcon, { backgroundColor: colors.accent }]}>
            <Ionicons name={current.icon} size={18} color="#fff" />
          </View>
          <View style={styles.nextText}>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              {t(current.titleKey)}
            </Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
              {t(current.descriptionKey)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </TouchableOpacity>
      )}

      {expanded && (
        <View style={styles.list}>
          {steps.map((step, index) => {
            const isCurrent = index === currentIndex;
            const isLast = index === steps.length - 1;
            return (
              <TouchableOpacity
                key={step.key}
                style={styles.stepRow}
                onPress={() => onStepPress(step)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`${index + 1}. ${t(step.titleKey)}`}
                accessibilityState={{ checked: step.done }}
              >
                <View style={styles.rail}>
                  <View
                    style={[
                      styles.bullet,
                      step.done
                        ? { backgroundColor: colors.success }
                        : isCurrent
                          ? { backgroundColor: colors.accent }
                          : { borderWidth: 1.5, borderColor: colors.border },
                    ]}
                  >
                    {step.done ? (
                      <Ionicons name="checkmark" size={16} color="#fff" />
                    ) : (
                      <Text style={[styles.bulletText, { color: isCurrent ? "#fff" : colors.textMuted }]}>
                        {index + 1}
                      </Text>
                    )}
                  </View>
                  {!isLast && (
                    <View style={[styles.line, { backgroundColor: step.done ? colors.success : colors.border }]} />
                  )}
                </View>
                <View style={[styles.body, isCurrent && { backgroundColor: colors.accentLight }]}>
                  <View style={styles.bodyText}>
                    <Text
                      style={[styles.stepTitle, { color: step.done ? colors.textSecondary : colors.textPrimary }]}
                    >
                      {t(step.titleKey)}
                    </Text>
                    {isCurrent && (
                      <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>
                        {t(step.descriptionKey)}
                      </Text>
                    )}
                  </View>
                  {!step.done && (
                    <Ionicons name="chevron-forward" size={18} color={isCurrent ? colors.accent : colors.textMuted} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <TouchableOpacity
        style={styles.toggle}
        onPress={toggle}
        activeOpacity={0.7}
        hitSlop={{ top: 6, bottom: 6, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        accessibilityLabel={t(expanded ? "home.journeyHide" : "home.journeyShowAll")}
      >
        <Text style={[styles.toggleText, { color: colors.accent }]}>
          {t(expanded ? "home.journeyHide" : "home.journeyShowAll")}
        </Text>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.accent} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",

  },
  close: { width: 48, height: 48, marginLeft: 4, marginRight: -6, alignItems: "center", justifyContent: "center" },
  progressText: {
    fontSize: 12,
    fontWeight: "700",

  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 14,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  nextIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  nextText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: "700",

    textBreakStrategy: "simple",
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,

    marginTop: 2,
    textBreakStrategy: "simple",
  },
  list: {
    marginTop: -2,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  rail: {
    width: 32,
    alignItems: "center",
  },
  bullet: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletText: {
    fontSize: 14,
    fontWeight: "800",

  },
  line: {
    flex: 1,
    width: 4,
    borderRadius: 2,
    marginVertical: 3,
  },
  body: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    marginLeft: 10,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bodyText: {
    flex: 1,
    marginRight: 6,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginTop: 12,
    minHeight: 48,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "700",

  },
});

export default JourneyCard;
