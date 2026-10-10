import React, { useContext, useEffect, useRef } from "react";
import { View, Text, Modal, StyleSheet, Dimensions, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { LanguageContext } from "../LanguageContext";
import OrbitLoader from "./OrbitLoader";

const { width } = Dimensions.get("window");

const VARIANTS = {
  default: { titleKey: "ui.loader.title", messageKey: "ui.loader.message" },
  success: { titleKey: "ui.loader.successTitle", messageKey: "ui.loader.successMessage" },
};

// Loading indicator: scholarship and job tiles orbiting in depth around a
// glowing hub (OrbitLoader), all vector so it follows the light/dark theme.
// The success variant swaps the orbit for a check badge.
const LoaderModal = ({ visible = true, variant = "default", title, message }) => {
  const config = VARIANTS[variant] || VARIANTS.default;
  const isSuccess = variant === "success";
  const { colors } = useTheme() || {};
  const { t } = useContext(LanguageContext) || { t: (k) => k };

  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(pop, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }).start();
    } else {
      pop.setValue(0);
    }
  }, [visible, pop]);

  const cardScale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] });
  const surface = colors?.surface || "#fff";

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={() => {}} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: surface, opacity: pop, transform: [{ scale: cardScale }] },
            colors && { borderColor: colors.border },
          ]}
          accessibilityRole="progressbar"
          accessibilityLiveRegion="polite"
          accessibilityLabel={title || t(config.titleKey)}
        >
          <View style={styles.stage}>
            {isSuccess ? (
              <View style={[styles.successBadge, { backgroundColor: colors?.successLight || "#dcfce7" }]}>
                <Ionicons name="checkmark-circle" size={58} color={colors?.success || "#16a34a"} />
              </View>
            ) : (
              visible && <OrbitLoader />
            )}
          </View>

          <Text style={[styles.title, { color: colors?.textPrimary || "#111827" }]}>{title || t(config.titleKey)}</Text>
          <Text style={[styles.message, { color: colors?.textSecondary || "#64748b" }]}>
            {message || t(config.messageKey)}
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    paddingHorizontal: 24,
  },
  card: {
    width: Math.min(width * 0.82, 320),
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 26,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  stage: {
    width: 168,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  successBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    fontFamily: "Roboto",
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: 14,
    fontFamily: "Roboto",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default LoaderModal;
