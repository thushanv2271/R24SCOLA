import React, { forwardRef, useEffect, useRef } from "react";
import { Animated, AccessibilityInfo, Easing, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PressableScale } from "../ui/motion";
import { COIN_GOLD } from "../../constants/categoryColors";

// Coin balance chip. Celebrate an earned reward, then settle back to a quiet
// wallet control. Loading an existing balance does not trigger a glow.
const GlowCoinChip = forwardRef(({ coins, ready, celebrate = 0, onPress, accessibilityLabel }, ref) => {
  const pulse = useRef(new Animated.Value(0)).current;
  const played = useRef(false);
  const anim = useRef(null);

  const play = (pulses) => {
    anim.current?.stop();
    pulse.setValue(0);
    AccessibilityInfo.isReduceMotionEnabled()
      .catch(() => false)
      .then((reduce) => {
        if (reduce) return;
        anim.current = Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
            Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          ]),
          { iterations: pulses },
        );
        anim.current.start();
      });
  };

  useEffect(() => {
    if (!ready || played.current) return;
    played.current = true;
  }, [ready]);

  useEffect(() => {
    if (!celebrate) return;
    played.current = true;
    play(4);
  }, [celebrate]);

  useEffect(() => () => anim.current?.stop(), []);

  const glowStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.7] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.25] }) }],
  };
  const haloStyle = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
  };
  const popStyle = {
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }],
  };

  return (
    <View ref={ref} collapsable={false} style={styles.wrap}>
      <Animated.View pointerEvents="none" style={[styles.glow, styles.halo, haloStyle]} />
      <Animated.View pointerEvents="none" style={[styles.glow, glowStyle]} />
      <Animated.View style={popStyle}>
        <PressableScale
          scaleTo={0.94}
          style={styles.chip}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          <Ionicons name="wallet" size={18} color={COIN_GOLD} />
          <Text style={styles.text} maxFontSizeMultiplier={1.2}>
            {coins}
          </Text>
        </PressableScale>
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { justifyContent: "center", flexShrink: 0 },
  glow: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 24,
    backgroundColor: "#fbbf24",
  },
  halo: { backgroundColor: "#fde68a" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  text: { color: "#fff", fontSize: 15, lineHeight: 20, fontWeight: "800", flexShrink: 0, marginLeft: 6 },
});

export default GlowCoinChip;
