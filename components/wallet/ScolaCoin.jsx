import React, { useEffect } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, Ellipse, LinearGradient, Path, RadialGradient, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

// The Scola coin: a minted gold coin with a graduation-cap emblem. Drawn as
// vector so it stays sharp at any size. With `spin` it floats and does a slow
// full turn every few seconds (skipped when the system asks for reduced motion).
const CoinArt = ({ size, uid }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <LinearGradient id={`${uid}rim`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#fff3b0" />
        <Stop offset="0.5" stopColor="#f5a524" />
        <Stop offset="1" stopColor="#a8560a" />
      </LinearGradient>
      <LinearGradient id={`${uid}edge`} x1="1" y1="1" x2="0" y2="0">
        <Stop offset="0" stopColor="#fde68a" />
        <Stop offset="1" stopColor="#b45309" />
      </LinearGradient>
      <RadialGradient id={`${uid}face`} cx="0.35" cy="0.3" r="0.85">
        <Stop offset="0" stopColor="#fde68a" />
        <Stop offset="0.6" stopColor="#fbbf24" />
        <Stop offset="1" stopColor="#d97706" />
      </RadialGradient>
    </Defs>
    <Circle cx={50} cy={50} r={48} fill={`url(#${uid}rim)`} />
    <Circle cx={50} cy={50} r={43} fill={`url(#${uid}edge)`} />
    <Circle cx={50} cy={50} r={39.5} fill={`url(#${uid}face)`} />
    <Circle
      cx={50}
      cy={50}
      r={34}
      fill="none"
      stroke="#b45309"
      strokeOpacity={0.45}
      strokeWidth={1.2}
      strokeDasharray="1.6 3.2"
    />
    {/* graduation cap */}
    <Path d="M50 27 L77 40 L50 53 L23 40 Z" fill="#7c2d12" />
    <Path d="M35 48.5 V60 C35 66 65 66 65 60 V48.5 L50 56 Z" fill="#9a3412" />
    <Path d="M74 42.5 V58" stroke="#7c2d12" strokeWidth={2.4} strokeLinecap="round" />
    <Circle cx={74} cy={60} r={3} fill="#7c2d12" />
    <Path d="M50 27 L77 40 L50 53" fill="none" stroke="#fde68a" strokeOpacity={0.55} strokeWidth={1} />
    {/* highlight */}
    <Ellipse cx={34} cy={28} rx={15} ry={8} fill="#fff" fillOpacity={0.3} rotation={-35} origin="34, 28" />
  </Svg>
);

let coinCounter = 0;

const ScolaCoin = ({ size = 48, spin = false, style }) => {
  const uid = React.useRef(`sc${coinCounter++}`).current;
  const reduce = useReducedMotion();
  const turn = useSharedValue(0);
  const lift = useSharedValue(0);

  useEffect(() => {
    if (!spin || reduce) return undefined;
    turn.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(360, { duration: 1500, easing: Easing.inOut(Easing.cubic) })),
        withTiming(0, { duration: 0 }),
      ),
      -1,
    );
    lift.value = withRepeat(
      withSequence(
        withTiming(-size * 0.05, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    return undefined;
  }, [spin, reduce, size, turn, lift]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.value }, { perspective: 700 }, { rotateY: `${turn.value}deg` }],
  }));

  return (
    <View style={[{ width: size, height: size }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={animatedStyle}>
        <CoinArt size={size} uid={uid} />
      </Animated.View>
    </View>
  );
};

export default ScolaCoin;
