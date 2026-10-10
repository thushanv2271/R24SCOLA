import React, { useEffect, useRef } from "react";
import { StyleSheet, Animated, Easing } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const SCATTER_ANGLES = [-55, -15, 15, 55];

// Built on React Native's core Animated API (native-driver, no worklets) —
// this app's current Reanimated build throws on worklet-driven animation
// functions for newly added files, so this sidesteps that entirely.
const ScatterCoin = ({ angleDeg, delay }) => {
  const progress = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.delay(200),
          Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        Animated.timing(progress, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rad = (angleDeg * Math.PI) / 180;
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.sin(rad) * 26],
  });
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });
  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", `${angleDeg}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.scatterCoin,
        { opacity, transform: [{ translateX }, { translateY }, { scale }, { rotate }] },
      ]}
    >
      <MaterialCommunityIcons name="cash-multiple" size={14} color="#f59e0b" />
    </Animated.View>
  );
};

// Multi-coin "spend" burst: a handful of coins scatter upward and fade while
// a "-N Scola Coins" label rises and fades behind them. Mount inside a
// `position: "relative"` wrapper around the button that triggered the spend,
// and bump `triggerKey` (e.g. Date.now()) each time a charge succeeds.
const CoinSpendBurst = ({ triggerKey, amount = 10 }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!triggerKey) return;
    opacity.setValue(0);
    translateY.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(450),
      Animated.timing(opacity, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start();
    Animated.timing(translateY, {
      toValue: -30,
      duration: 950,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [triggerKey]);

  if (!triggerKey) return null;

  return (
    <>
      {SCATTER_ANGLES.map((angle, index) => (
        <ScatterCoin key={`${triggerKey}-${angle}`} angleDeg={angle} delay={index * 30} />
      ))}
      <Animated.Text
        pointerEvents="none"
        style={[styles.text, { opacity, transform: [{ translateY }] }]}
      >
        -{amount} Scola Coins
      </Animated.Text>
    </>
  );
};

const styles = StyleSheet.create({
  scatterCoin: {
    position: "absolute",
    alignSelf: "center",
    top: -8,
  },
  text: {
    position: "absolute",
    alignSelf: "center",
    top: -16,
    fontSize: 12,
    fontWeight: "800",
    color: "#ef4444",
  },
});

export default CoinSpendBurst;
