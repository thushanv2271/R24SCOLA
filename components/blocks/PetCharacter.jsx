import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import Svg, { Circle, Ellipse, Polygon, Path } from "react-native-svg";
import { Badge, Cap, Scarf, Sparkles } from "./petParts";

// The fox and the penguin: same size, pose and growth accessories as the owl,
// so any character can stand in for Hoot. Core Animated, native driver.
const W = 150;
const H = 128;
const DARK = "#1b1b2f";
const BEAK = "#f59e0b";

// Per-character placement of the shared accessories.
const FIT = {
  fox: { scarfY: 80, scarfW: 40, capY: 25, capK: 0.62, badgeY: 102, eyes: 56 },
  penguin: { scarfY: 80, scarfW: 42, capY: 26, capK: 0.72, badgeY: 102, eyes: 54 },
};

const Fox = () => (
  <>
    <Ellipse cx={104} cy={96} rx={12} ry={26} fill="#e8782a" transform="rotate(28 104 96)" />
    <Ellipse cx={113} cy={74} rx={6} ry={9} fill="#ffffff" transform="rotate(28 113 74)" />
    <Ellipse cx={48} cy={116} rx={9} ry={4} fill="#7a3a12" />
    <Ellipse cx={72} cy={116} rx={9} ry={4} fill="#7a3a12" />
    <Ellipse cx={60} cy={84} rx={31} ry={33} fill="#e8782a" />
    <Ellipse cx={60} cy={94} rx={18} ry={22} fill="#fbe7c6" />
    <Polygon points="28,44 33,8 56,32" fill="#e8782a" />
    <Polygon points="92,44 87,8 64,32" fill="#e8782a" />
    <Polygon points="34,36 36,17 48,31" fill="#7a3a12" />
    <Polygon points="86,36 84,17 72,31" fill="#7a3a12" />
    <Ellipse cx={60} cy={58} rx={33} ry={27} fill="#e8782a" />
    <Ellipse cx={60} cy={69} rx={22} ry={14} fill="#fbe7c6" />
    <Ellipse cx={60} cy={64} rx={4.5} ry={3.5} fill={DARK} />
    <Path d="M60 68 q0 5 -5 6 M60 68 q0 5 5 6" stroke={DARK} strokeWidth={1.8} strokeLinecap="round" fill="none" />
  </>
);

const Penguin = () => (
  <>
    <Ellipse cx={46} cy={116} rx={10} ry={4} fill={BEAK} />
    <Ellipse cx={74} cy={116} rx={10} ry={4} fill={BEAK} />
    <Ellipse cx={24} cy={86} rx={8} ry={22} fill="#26304a" transform="rotate(12 24 86)" />
    <Ellipse cx={96} cy={86} rx={8} ry={22} fill="#26304a" transform="rotate(-12 96 86)" />
    <Ellipse cx={60} cy={80} rx={33} ry={37} fill="#2f3b52" />
    <Ellipse cx={60} cy={90} rx={22} ry={27} fill="#ffffff" />
    <Ellipse cx={60} cy={52} rx={30} ry={27} fill="#2f3b52" />
    <Ellipse cx={60} cy={60} rx={23} ry={17} fill="#ffffff" />
    <Circle cx={40} cy={64} r={4.5} fill="#f9a8a8" opacity={0.65} />
    <Circle cx={80} cy={64} r={4.5} fill="#f9a8a8" opacity={0.65} />
    <Polygon points="54,62 66,62 60,71" fill={BEAK} />
  </>
);

const PetCharacter = ({ character = "fox", size = 104, stage = 4, hopKey = 0, cheer = false, calm = false }) => {
  const s = size / H;
  const fit = FIT[character] || FIT.fox;
  const [reduce, setReduce] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (reduce || calm) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bob, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, calm, bob]);

  useEffect(() => {
    if (reduce) return undefined;
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(blink, { toValue: 0.08, duration: 90, useNativeDriver: true }),
          Animated.timing(blink, { toValue: 1, duration: 120, useNativeDriver: true }),
        ]).start(schedule);
      }, 2400 + Math.random() * 2200);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [reduce, blink]);

  useEffect(() => {
    if (reduce) return undefined;
    if (cheer) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(hop, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(hop, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.delay(120),
        ]),
        { iterations: 6 },
      );
      loop.start();
      return () => loop.stop();
    }
    if (!hopKey) return undefined;
    Animated.sequence([
      Animated.timing(hop, { toValue: 1, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, damping: 8, stiffness: 220, useNativeDriver: true }),
    ]).start();
    return undefined;
  }, [hopKey, cheer, reduce, hop]);

  const eyeY = fit.eyes;
  const eyeDx = character === "fox" ? 14 : 12;

  return (
    <View style={{ width: W * s, height: H * s }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View
        style={{
          width: W * s,
          height: H * s,
          transform: [
            { translateY: bob.interpolate({ inputRange: [0, 1], outputRange: [0, -3 * s] }) },
            { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -14 * s] }) },
          ],
        }}
      >
        <Svg width={W * s} height={H * s} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
          {character === "penguin" ? <Penguin /> : <Fox />}
          {stage >= 1 && <Scarf y={fit.scarfY} w={fit.scarfW} />}
          {stage >= 3 && <Badge cy={fit.badgeY} />}
          {stage >= 2 && <Cap cy={fit.capY} k={fit.capK} />}
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 36 * s,
            top: (eyeY - 10) * s,
            width: 48 * s,
            height: 20 * s,
            transform: [{ scaleY: blink }],
          }}
        >
          <Svg width={48 * s} height={20 * s} viewBox={`36 ${eyeY - 10} 48 20`}>
            <Circle cx={60 - eyeDx} cy={eyeY} r={5.6} fill={DARK} />
            <Circle cx={60 + eyeDx} cy={eyeY} r={5.6} fill={DARK} />
            <Circle cx={60 - eyeDx + 2} cy={eyeY - 2} r={1.9} fill="#ffffff" />
            <Circle cx={60 + eyeDx + 2} cy={eyeY - 2} r={1.9} fill="#ffffff" />
          </Svg>
        </Animated.View>

        {stage >= 4 && <Sparkles s={s} reduce={reduce} />}
      </Animated.View>
    </View>
  );
};

export default PetCharacter;
