import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  Extrapolation,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../ThemeContext";

// Animated artwork for the first-launch intro. Each piece loops only while its
// slide is visible and shows a still frame under "reduce motion".

const AMBER = "#f59e0b";
const GREEN = "#10b981";
const ART = 260;

const useLoop = (active, duration, rest = 0) => {
  const p = useSharedValue(rest);
  const reduce = useReducedMotion();
  useEffect(() => {
    cancelAnimation(p);
    if (active && !reduce) {
      p.value = 0;
      p.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    } else {
      p.value = rest;
    }
    return () => cancelAnimation(p);
  }, [active, reduce]);
  return p;
};

const clamp = Extrapolation.CLAMP;

// Slide 1: universities and jobs orbiting the Scola mark.
const WelcomeArt = ({ active }) => {
  const { colors } = useTheme();
  const pulse = useLoop(active, 3200);
  const orbit = useLoop(active, 26000);
  const bob = useLoop(active, 3600);

  const ringA = useAnimatedStyle(() => ({
    opacity: 0.32 * (1 - pulse.value),
    transform: [{ scale: 0.85 + 0.75 * pulse.value }],
  }));
  const ringB = useAnimatedStyle(() => {
    const q = (pulse.value + 0.5) % 1;
    return { opacity: 0.32 * (1 - q), transform: [{ scale: 0.85 + 0.75 * q }] };
  });
  const centre = useAnimatedStyle(() => ({
    transform: [{ translateY: Math.sin(bob.value * Math.PI * 2) * 5 }],
  }));
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value * 360}deg` }] }));
  const counterSpin = useAnimatedStyle(() => ({ transform: [{ rotate: `${-orbit.value * 360}deg` }] }));

  const R = 100;
  const badges = [
    { icon: "briefcase", color: AMBER, angle: -90 },
    { icon: "ribbon", color: GREEN, angle: 30 },
    { icon: "business", color: colors.accent, angle: 150 },
  ];

  return (
    <View style={styles.art}>
      <View style={[styles.orbitTrack, { borderColor: colors.border }]} />
      <Animated.View style={[styles.ring, { backgroundColor: colors.accent }, ringA]} />
      <Animated.View style={[styles.ring, { backgroundColor: colors.accent }, ringB]} />

      <Animated.View style={[styles.orbit, spin]}>
        {badges.map((b) => {
          const rad = (b.angle * Math.PI) / 180;
          return (
            <Animated.View
              key={b.icon}
              style={[
                styles.badge,
                {
                  left: ART / 2 + R * Math.cos(rad) - 22,
                  top: ART / 2 + R * Math.sin(rad) - 22,
                  backgroundColor: colors.surface,
                  borderColor: b.color,
                },
                counterSpin,
              ]}
            >
              <Ionicons name={b.icon} size={22} color={b.color} />
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.centre, { backgroundColor: colors.accent }, centre]}>
        <Ionicons name="school" size={44} color="#fff" />
      </Animated.View>
    </View>
  );
};

// Slide 2: a tap on the request button, with a ripple.
const RequestArt = ({ active }) => {
  const { colors } = useTheme();
  const p = useLoop(active, 3200, 0.62);

  const finger = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.12, 0.5, 0.62, 0.8], [0, 1, 1, 1, 0], clamp),
    transform: [
      { translateX: interpolate(p.value, [0, 0.45, 0.55, 0.62], [46, 0, 0, 4], clamp) },
      { translateY: interpolate(p.value, [0, 0.45, 0.55, 0.62], [46, 0, 0, 4], clamp) },
      { scale: interpolate(p.value, [0.45, 0.55, 0.65], [1, 0.86, 1], clamp) },
    ],
  }));
  const button = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.5, 0.56, 0.7], [1, 0.9, 1], clamp) }],
  }));
  const ripple = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.55, 0.62, 1], [0, 0.4, 0], clamp),
    transform: [{ scale: interpolate(p.value, [0.55, 1], [1, 2.4], clamp) }],
  }));
  const tick = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.6, 0.7, 0.95, 1], [0, 1, 1, 0], clamp),
    transform: [{ scale: interpolate(p.value, [0.6, 0.72, 0.8], [0.4, 1.2, 1], clamp) }],
  }));

  return (
    <View style={styles.art}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHead}>
          <View style={[styles.cardLogo, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="school" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={[styles.line, { width: "80%", backgroundColor: colors.border }]} />
            <View style={[styles.line, { width: "55%", backgroundColor: colors.border, marginTop: 8 }]} />
          </View>
        </View>
        <View style={[styles.line, { width: "100%", height: 8, backgroundColor: colors.border, marginTop: 18 }]} />
        <View style={[styles.line, { width: "70%", height: 8, backgroundColor: colors.border, marginTop: 8 }]} />
      </View>

      <View style={styles.requestSpot}>
        <Animated.View style={[styles.rippleDot, { backgroundColor: colors.accent }, ripple]} />
        <Animated.View style={[styles.requestButton, { backgroundColor: colors.accent }, button]}>
          <Ionicons name="paper-plane" size={24} color="#fff" />
        </Animated.View>
        <Animated.View style={[styles.tick, { backgroundColor: GREEN }, tick]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </Animated.View>
        <Animated.View style={[styles.finger, finger]} pointerEvents="none">
          <Ionicons name="hand-left" size={30} color={colors.textPrimary} style={styles.fingerIcon} />
        </Animated.View>
      </View>
    </View>
  );
};

// Slide 3: the email flies from your outbox to the university.
const SendArt = ({ active }) => {
  const { colors } = useTheme();
  const p = useLoop(active, 3400, 0.9);
  const bob = useLoop(active, 3000);

  const plane = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.1, 0.62, 0.72], [0, 1, 1, 0], clamp),
    transform: [
      { translateX: interpolate(p.value, [0.05, 0.7], [0, 118], clamp) },
      { translateY: interpolate(p.value, [0.05, 0.35, 0.7], [0, -34, -84], clamp) },
      { rotate: "-20deg" },
      { scale: interpolate(p.value, [0.05, 0.7], [1, 0.75], clamp) },
    ],
  }));
  const mail = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(bob.value * Math.PI * 2) * 3 },
      { scale: interpolate(p.value, [0, 0.06, 0.16], [1, 0.94, 1], clamp) },
    ],
  }));
  const school = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(p.value, [0.66, 0.78, 0.9], [1, 1.14, 1], clamp) }],
  }));
  const tick = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0.7, 0.78, 0.96, 1], [0, 1, 1, 0], clamp),
    transform: [{ scale: interpolate(p.value, [0.7, 0.82, 0.9], [0.4, 1.2, 1], clamp) }],
  }));

  return (
    <View style={styles.art}>
      <View style={[styles.dash, { borderColor: colors.border }]} />

      <Animated.View
        style={[styles.mailCard, { backgroundColor: colors.surface, borderColor: colors.border }, mail]}
      >
        <Ionicons name="mail" size={34} color={colors.accent} />
      </Animated.View>

      <Animated.View
        style={[styles.schoolCard, { backgroundColor: colors.accent }, school]}
      >
        <Ionicons name="school" size={34} color="#fff" />
        <Animated.View style={[styles.tickCorner, { backgroundColor: GREEN }, tick]}>
          <Ionicons name="checkmark" size={14} color="#fff" />
        </Animated.View>
      </Animated.View>

      <Animated.View style={[styles.plane, plane]} pointerEvents="none">
        <Ionicons name="paper-plane" size={26} color={AMBER} />
      </Animated.View>
    </View>
  );
};

const OnboardingArt = ({ index, active }) => {
  if (index === 0) return <WelcomeArt active={active} />;
  if (index === 1) return <RequestArt active={active} />;
  return <SendArt active={active} />;
};

const styles = StyleSheet.create({
  art: {
    width: ART,
    height: ART,
    alignItems: "center",
    justifyContent: "center",
  },

  orbitTrack: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ring: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  orbit: {
    position: "absolute",
    width: ART,
    height: ART,
  },
  badge: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  centre: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  card: {
    width: 210,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginBottom: 26,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardLogo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    height: 10,
    borderRadius: 5,
  },
  requestSpot: {
    position: "absolute",
    right: 22,
    bottom: 28,
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  requestButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  rippleDot: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  tick: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  finger: {
    position: "absolute",
    left: 22,
    top: 26,
  },
  fingerIcon: {
    transform: [{ rotate: "-20deg" }],
  },

  dash: {
    position: "absolute",
    width: 150,
    height: 0,
    borderTopWidth: 2,
    borderStyle: "dashed",
    transform: [{ rotate: "-36deg" }],
  },
  mailCard: {
    position: "absolute",
    left: 22,
    bottom: 44,
    width: 78,
    height: 78,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  schoolCard: {
    position: "absolute",
    right: 22,
    top: 44,
    width: 78,
    height: 78,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  tickCorner: {
    position: "absolute",
    top: -7,
    right: -7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  plane: {
    position: "absolute",
    left: 84,
    bottom: 84,
  },
});

export default OnboardingArt;
