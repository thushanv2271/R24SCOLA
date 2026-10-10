import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from "react-native-svg";

// Accessories every pet character earns as it grows. All drawn in the shared
// 150 x 128 pet viewBox.
const GOLD = "#f5b301";
const CAP = "#2b3a6e";
const CAP_DARK = "#1f2a52";

export const Scarf = ({ y, w, color = "#e11d48" }) => (
  <G>
    <Rect x={60 - w / 2} y={y} width={w} height={9} rx={4.5} fill={color} />
    <Rect x={60 + w / 2 - 16} y={y + 5} width={9} height={18} rx={3} fill={color} />
    <Rect x={60 + w / 2 - 16} y={y + 14} width={9} height={3} fill="#ffffff" opacity={0.35} />
  </G>
);

export const Cap = ({ cy = 32, k = 1 }) => (
  <G transform={`translate(60 ${cy}) scale(${k}) translate(-60 -32)`}>
    <Rect x={42} y={36} width={36} height={13} rx={4} fill={CAP_DARK} />
    <Polygon points="16,32 60,14 104,32 60,50" fill={CAP} stroke={CAP_DARK} strokeWidth={1.5} strokeLinejoin="round" />
    <Circle cx={60} cy={32} r={3} fill={GOLD} />
    <Path d="M60 32 L97 33 L97 54" stroke={GOLD} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <Ellipse cx={97} cy={57} rx={3.5} ry={5} fill={GOLD} />
  </G>
);

const starPoints = (cx, cy, outer, inner, n) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / n - Math.PI / 2;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");

export const Badge = ({ cx = 60, cy = 100 }) => (
  <G>
    <Polygon points={starPoints(cx, cy, 8, 3.4, 5)} fill={GOLD} stroke="#c98a00" strokeWidth={1} strokeLinejoin="round" />
  </G>
);

export const Sparkles = ({ s, reduce }) => {
  const tw = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(tw, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(tw, { toValue: 0.3, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, tw]);
  return (
    <Animated.View pointerEvents="none" style={{ position: "absolute", left: 0, top: 0, width: 150 * s, height: 128 * s, opacity: tw }}>
      <Svg width={150 * s} height={128 * s} viewBox="0 0 150 128">
        <Polygon points={starPoints(14, 26, 7, 2.4, 4)} fill={GOLD} />
        <Polygon points={starPoints(108, 14, 6, 2, 4)} fill={GOLD} />
        <Polygon points={starPoints(118, 62, 4.5, 1.6, 4)} fill={GOLD} />
      </Svg>
    </Animated.View>
  );
};
