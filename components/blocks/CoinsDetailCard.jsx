import React, { useContext, useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Pressable, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { AuthContext } from "../AuthContext";
import { LanguageContext } from "../LanguageContext";
import ScolaCoin from "../wallet/ScolaCoin";
import { useTheme } from "../ThemeContext";

const formatUsd = (value) =>
  `$${Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

// variant="compact" (default) — Profile's clean white-card teaser, matching
// the rest of that page's icon-circle language.
// variant="hero" — Home's more eye-catching version: amber gradient, a
// pulsing glow behind the chest icon, and a looping light-shimmer sweep, so
// the coin balance actually draws the eye on the screen users land on most.
const CoinsDetailCard = ({ variant = "compact" }) => {
  const router = useRouter();
  const { wallet } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isHero = variant === "hero";

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isHero) return undefined;

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    );
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    pulseLoop.start();
    shimmerLoop.start();
    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [isHero, pulseAnim, shimmerAnim]);

  if (!wallet) return null;

  const coins = wallet.coins ?? 0;
  const valueUsd = wallet.valueUsd ?? 0;

  const glowScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const glowOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const shimmerTranslate = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [-140, 260] });

  const handlePressIn = () =>
    Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(pressScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();

  const inner = (
    <>
      <View style={[styles.iconWrap, isHero && styles.iconWrapHero]}>
        {isHero && (
          <Animated.View
            pointerEvents="none"
            style={[styles.glow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]}
          />
        )}
        <ScolaCoin size={isHero ? 42 : 40} spin={isHero} />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.balanceUnit, isHero && styles.balanceUnitHero]} numberOfLines={1}>
          {t("wallet.scolaCoins")}
        </Text>
        <Text style={[styles.balanceValue, isHero && styles.balanceValueHero]} numberOfLines={1}>
          {coins.toLocaleString()}
        </Text>
      </View>
      <View style={styles.valueWrap}>
        <Text style={[styles.valueText, isHero && styles.valueTextHero]} numberOfLines={1}>
          {formatUsd(valueUsd)}
        </Text>
        <Text style={[styles.balanceSubtitle, isHero && styles.balanceSubtitleHero]} numberOfLines={1}>
          {t("wallet.worth")}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={isHero ? "rgba(255,255,255,0.85)" : colors.textMuted} />
    </>
  );

  if (!isHero) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/Wallet")} style={styles.card}>
        {inner}
      </TouchableOpacity>
    );
  }

  return (
    <Pressable onPress={() => router.push("/Wallet")} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <LinearGradient
          colors={["#f59e0b", "#d97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.card, styles.cardHero]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              { transform: [{ translateX: shimmerTranslate }, { rotate: "20deg" }] },
            ]}
          />
          {inner}
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const createStyles = (colors) => StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHero: {
    paddingVertical: 16,
    overflow: "hidden",
    shadowColor: "#d97706",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  shimmer: {
    position: "absolute",
    top: -40,
    bottom: -40,
    width: 70,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapHero: {
    backgroundColor: "rgba(255,255,255,0.22)",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  glow: {
    position: "absolute",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#fff",
  },
  textWrap: {
    flex: 1,
  },
  valueWrap: {
    alignItems: "flex-end",
  },
  valueText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  valueTextHero: {
    color: "#fff",
  },
  balanceValue: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  balanceValueHero: {
    fontSize: 24,
    color: "#fff",
  },
  balanceUnit: {
    fontSize: 12.5,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  balanceUnitHero: {
    color: "rgba(255,255,255,0.9)",
  },
  balanceSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  balanceSubtitleHero: {
    color: "rgba(255,255,255,0.85)",
  },
});

export default CoinsDetailCard;
