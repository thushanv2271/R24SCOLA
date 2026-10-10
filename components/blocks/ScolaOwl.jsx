import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Rect } from "react-native-svg";
import { Badge, Cap, Scarf, Sparkles } from "./petParts";

// Scola's mascot: an owl in a graduation cap holding a pointing stick. It
// bobs, blinks, and sways its stick toward whatever it is explaining. `hopKey`
// makes it hop when it changes (e.g. a new step); `cheer` makes it celebrate.
// Core Animated only, native driver; purely decorative.

const W = 150;
const H = 128;
const PIVOT = { x: 96, y: 76 };
const REACH = 46;
const STICK_LEN = 42;
const STICK_ANGLE = 24; // degrees above horizontal, toward the speech bubble

const BODY = "#9a6a3f";
const WING = "#7d5230";
const BELLY = "#f1d4a5";
const FACE = "#f8e8cc";
const BEAK = "#f59e0b";
const GOLD = "#f5b301";

const rad = (deg) => (deg * Math.PI) / 180;

const ScolaOwl = ({ size = 104, hopKey = 0, cheer = false, aim = 0, calm = false, stage = 4 }) => {
  const s = size / H;
  const [reduce, setReduce] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const sway = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const aimAnim = useRef(new Animated.Value(aim)).current;

  // aim: extra degrees to raise (positive) or lower (negative) the stick.
  useEffect(() => {
    Animated.spring(aimAnim, { toValue: aim, damping: 12, stiffness: 120, useNativeDriver: true }).start();
  }, [aim, aimAnim]);

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
    if (reduce || calm) return undefined;
    const half = cheer ? 220 : 650;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: half, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, calm, cheer, sway]);

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

  const tipX = REACH + STICK_LEN * Math.cos(rad(STICK_ANGLE));
  const tipY = REACH - STICK_LEN * Math.sin(rad(STICK_ANGLE));
  const swing = cheer ? 22 : 7;

  return (
    <View
      style={{ width: W * s, height: H * s }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
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
          <Ellipse cx={48} cy={116} rx={9} ry={4} fill={BEAK} />
          <Ellipse cx={72} cy={116} rx={9} ry={4} fill={BEAK} />
          <Ellipse cx={26} cy={84} rx={9} ry={22} fill={WING} transform="rotate(10 26 84)" />
          <Ellipse cx={60} cy={76} rx={36} ry={40} fill={BODY} />
          <Ellipse cx={60} cy={90} rx={23} ry={25} fill={BELLY} />
          <Path d="M48 82 q4 4 8 0 M60 82 q4 4 8 0 M54 92 q4 4 8 0 M42 94 q4 4 8 0 M66 94 q4 4 8 0 M54 103 q4 4 8 0" stroke="#d9b27c" strokeWidth={2} strokeLinecap="round" fill="none" />
          <Circle cx={45} cy={60} r={14} fill={FACE} />
          <Circle cx={75} cy={60} r={14} fill={FACE} />
          <Polygon points="55,65 65,65 60,76" fill={BEAK} />
          {stage >= 1 && <Scarf y={77} w={44} />}
          {stage >= 3 && <Badge cy={103} />}
          {stage >= 2 && <Cap />}
        </Svg>

        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 30 * s,
            top: 46 * s,
            width: 60 * s,
            height: 28 * s,
            transform: [{ scaleY: blink }],
          }}
        >
          <Svg width={60 * s} height={28 * s} viewBox="30 46 60 28">
            <Circle cx={45} cy={60} r={10} fill="#ffffff" />
            <Circle cx={75} cy={60} r={10} fill="#ffffff" />
            <Circle cx={48.5} cy={61} r={5.2} fill="#1b1b2f" />
            <Circle cx={78.5} cy={61} r={5.2} fill="#1b1b2f" />
            <Circle cx={50.5} cy={59} r={1.8} fill="#ffffff" />
            <Circle cx={80.5} cy={59} r={1.8} fill="#ffffff" />
          </Svg>
        </Animated.View>

        {stage >= 3 && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: (PIVOT.x - REACH) * s,
            top: (PIVOT.y - REACH) * s,
            width: REACH * 2 * s,
            height: REACH * 2 * s,
            transform: [
              { rotate: aimAnim.interpolate({ inputRange: [-180, 180], outputRange: ["180deg", "-180deg"] }) },
              {
                rotate: sway.interpolate({
                  inputRange: [0, 1],
                  outputRange: [`${-swing}deg`, `${swing}deg`],
                }),
              },
            ],
          }}
        >
          <Svg width={REACH * 2 * s} height={REACH * 2 * s} viewBox={`0 0 ${REACH * 2} ${REACH * 2}`}>
            <G>
              <Line x1={REACH - 6} y1={REACH + 3} x2={tipX} y2={tipY} stroke="#7a4a1e" strokeWidth={4} strokeLinecap="round" />
              <Circle cx={tipX} cy={tipY} r={4.5} fill={GOLD} />
              <Ellipse cx={REACH} cy={REACH} rx={9} ry={7} fill={WING} />
            </G>
          </Svg>
        </Animated.View>
        )}

        {stage >= 4 && <Sparkles s={s} reduce={reduce} />}
      </Animated.View>
    </View>
  );
};

export default ScolaOwl;
