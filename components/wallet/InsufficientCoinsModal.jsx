import React, { useContext, useEffect, useRef } from "react";
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "../ThemeContext";
import { LanguageContext } from "../LanguageContext";

// Shown whenever a charge comes back 402 (INSUFFICIENT_COINS). A brief
// "glitch" shake + red flash on the chest makes the failure register
// instantly, before the reader even reaches the balance numbers below it.
// Built on React Native's core Animated API (native-driver, no worklets) —
// this app's current Reanimated build throws on worklet-driven animation
// functions for newly added files, so this sidesteps that entirely.
const InsufficientCoinsModal = ({ visible, coins = 0, required = 0, onClose }) => {
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);
  const shakeX = useRef(new Animated.Value(0)).current;
  const flash = useRef(new Animated.Value(0)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) {
      shakeX.setValue(0);
      flash.setValue(0);
      cardOpacity.setValue(0);
      cardScale.setValue(0.92);
      return;
    }

    Animated.timing(cardOpacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    Animated.timing(cardScale, { toValue: 1, duration: 220, useNativeDriver: true }).start();

    const shakeStep = (toValue) =>
      Animated.timing(shakeX, { toValue, duration: 45, useNativeDriver: true });

    Animated.sequence([
      Animated.delay(150),
      shakeStep(-7),
      shakeStep(7),
      shakeStep(-5),
      shakeStep(5),
      shakeStep(-7),
      shakeStep(7),
      shakeStep(-5),
      shakeStep(5),
      shakeStep(0),
    ]).start();

    Animated.sequence([
      Animated.delay(150),
      Animated.timing(flash, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(flash, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  const cardStyle = { opacity: cardOpacity, transform: [{ scale: cardScale }] };
  const chestStyle = { transform: [{ translateX: shakeX }] };
  const flashOpacity = flash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] });

  const shortfall = Math.max(required - coins, 0);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}>
          <Animated.View pointerEvents="none" style={[styles.flash, { opacity: flashOpacity }]} />
          <TouchableOpacity
            style={[styles.closeIcon, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Animated.View style={[styles.chestWrap, chestStyle]}>
            <MaterialCommunityIcons name="treasure-chest-outline" size={48} color="#ef4444" />
            <View style={styles.chestBadge}>
              <Ionicons name="close" size={14} color="#fff" />
            </View>
          </Animated.View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("ui.insufficient.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("ui.insufficient.message", { required, coins, shortfall })}
          </Text>

          <View style={[styles.balanceRow, { backgroundColor: colors.surfaceAlt }]}>
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>{t("ui.insufficient.youHave")}</Text>
              <Text style={[styles.balanceValue, { color: colors.textPrimary }]}>{coins}</Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.textMuted} />
            <View style={styles.balanceItem}>
              <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>{t("ui.insufficient.needed")}</Text>
              <Text style={[styles.balanceValue, styles.balanceValueNeeded, { color: colors.danger }]}>{required}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.walletButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            onPress={() => {
              onClose?.();
              router.push("/Wallet");
            }}
          >
            <MaterialCommunityIcons name="wallet-outline" size={16} color="#fff" />
            <Text style={styles.walletButtonText}>{t("ui.insufficient.viewWallet")}</Text>
          </TouchableOpacity>

        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(17, 24, 39, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: "center",
    overflow: "hidden",
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#ef4444",
  },
  chestWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  chestBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  closeIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Roboto",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    color: "#666",
    fontFamily: "Roboto",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 19,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 18,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  balanceItem: {
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  balanceValue: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Roboto",
    marginTop: 2,
  },
  balanceValueNeeded: {
    color: "#ef4444",
  },
  walletButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#004aad",
    borderRadius: 24,
    minHeight: 44,
    paddingHorizontal: 26,
    marginTop: 20,
  },
  walletButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
});

export default InsufficientCoinsModal;
