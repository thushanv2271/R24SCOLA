import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { haptic } from "./ui/motion";
import { playSound, stopSound } from "../utils/feedback";
import { LanguageContext } from "./LanguageContext";

const COIN_TARGET = 1000;
const FLY_COINS = 9;
const FLY_MS = 760;
const FLY_STAGGER = 75;
const LAND_MS = 700; // when the hero coin hits the ground; everything else keys off this
const COUNT_MS = 1500; // matches the counting ticks in assets/sounds/coin-count.wav
const HERO_SIZE = 116;
const RAY_SIZE = 380;
const RAY_COUNT = 6;
const SHOWER_COINS = 22;
const SPARKLES = [
  { x: -92, y: -70, size: 16, delay: 0 },
  { x: 96, y: -54, size: 12, delay: 260 },
  { x: -104, y: 26, size: 11, delay: 520 },
  { x: 90, y: 52, size: 17, delay: 140 },
  { x: -24, y: -104, size: 12, delay: 400 },
  { x: 34, y: 98, size: 11, delay: 640 },
];

const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);

// Realistic gold coin drawn with plain Views: dark rim for thickness, embossed
// inner ring, a soft highlight, and an optional shine strip that sweeps across.
const GoldCoin = ({ size, shine }) => {
  const rim = Math.max(2, size * 0.05);
  const inner = size * 0.7;
  return (
    <View style={{ width: size, height: size }}>
      <View
        style={{
          position: "absolute",
          top: size * 0.045,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#92400e",
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "#fbbf24",
          borderWidth: rim,
          borderColor: "#f59e0b",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            borderWidth: Math.max(1, size * 0.022),
            borderColor: "#fde68a",
            backgroundColor: "#f8b81c",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: size * 0.08,
            left: size * 0.14,
            width: size * 0.42,
            height: size * 0.2,
            borderRadius: size * 0.1,
            backgroundColor: "rgba(255,255,255,0.35)",
            transform: [{ rotate: "-30deg" }],
          }}
        />
        {size >= 40 && (
          <Text style={{ fontSize: size * 0.4, fontWeight: "800", color: "#b45309", fontFamily: "Roboto" }}>S</Text>
        )}
        {shine && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: size * 0.22,
              height: size * 1.6,
              backgroundColor: "rgba(255,255,255,0.6)",
              transform: [{ translateX: shine }, { rotate: "22deg" }],
            }}
          />
        )}
      </View>
    </View>
  );
};

// Flip a coin about its vertical axis: width squeezes to a sliver and back.
const flipScale = (spin, turns) => {
  const inputRange = [];
  const outputRange = [];
  for (let i = 0; i <= turns * 4; i++) {
    inputRange.push(i / 4);
    outputRange.push(i % 2 === 0 ? 1 : 0.08);
  }
  return spin.interpolate({ inputRange, outputRange });
};

// One coin falling under gravity, tumbling as it goes, then gone off-screen.
const ShowerCoin = ({ x, size, delay, duration, sway, turns, height }) => {
  const fall = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.parallel([
      Animated.timing(fall, { toValue: 1, duration, delay, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      Animated.timing(spin, { toValue: turns, duration, delay, easing: Easing.linear, useNativeDriver: true }),
    ]);
    run.start();
    return () => run.stop();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: x,
        opacity: fall.interpolate({ inputRange: [0, 0.02, 1], outputRange: [0, 1, 1] }),
        transform: [
          { translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [-80, height + 60] }) },
          { translateX: fall.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, sway, -sway * 0.6] }) },
          { scaleX: flipScale(spin, turns) },
        ],
      }}
    >
      <GoldCoin size={size} />
    </Animated.View>
  );
};

const Sparkle = ({ x, y, size, delay, active }) => {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active]);
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        transform: [
          { translateX: x },
          { translateY: y },
          { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] }) },
          { rotate: pulse.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] }) },
        ],
        opacity: pulse,
      }}
    >
      <MaterialCommunityIcons name="star-four-points" size={size} color="#fde68a" />
    </Animated.View>
  );
};

// A small coin that arcs from the celebration to the wallet chip, shrinking
// as it goes, and reports when it lands.
const FlyCoin = ({ sx, sy, tx, ty, size, delay, side, onLand }) => {
  const p = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = Animated.parallel([
      Animated.timing(p, { toValue: 1, duration: FLY_MS, delay, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(spin, { toValue: 2, duration: FLY_MS, delay, easing: Easing.linear, useNativeDriver: true }),
    ]);
    run.start(({ finished }) => {
      if (finished) onLand?.();
    });
    return () => run.stop();
  }, []);

  const dx = tx - sx;
  const dy = ty - sy;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: sx - size / 2,
        top: sy - size / 2,
        opacity: p.interpolate({ inputRange: [0, 0.01, 0.88, 1], outputRange: [0, 1, 1, 0] }),
        transform: [
          { translateX: p.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, dx / 2 + side, dx] }) },
          { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
          { scale: p.interpolate({ inputRange: [0, 1], outputRange: [1, 0.35] }) },
          { scaleX: flipScale(spin, 2) },
        ],
      }}
    >
      <GoldCoin size={size} />
    </Animated.View>
  );
};

// Full-screen reward celebration — plays once, on the first Home visit after
// a brand-new account is created (see index.jsx). Built on React Native's
// core Animated API (native driver): this app's Reanimated build throws on
// worklet-driven animations in newly added files.
const TreasureChestModal = ({ visible, onContinue, getTarget, onArrive }) => {
  const { t } = useContext(LanguageContext);
  const { height, width } = useWindowDimensions();
  const [displayCoins, setDisplayCoins] = useState(0);
  const [showShower, setShowShower] = useState(false);
  const [fly, setFly] = useState(null);
  const stageRef = useRef(null);
  const busy = useRef(false);
  const arrived = useRef(0);

  const overlay = useRef(new Animated.Value(0)).current;
  const heroDrop = useRef(new Animated.Value(0)).current;
  const heroSpin = useRef(new Animated.Value(0)).current;
  const heroSquash = useRef(new Animated.Value(1)).current;
  const heroShine = useRef(new Animated.Value(-HERO_SIZE)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const rays = useRef(new Animated.Value(0)).current;
  const raysSpin = useRef(new Animated.Value(0)).current;
  const textIn = useRef(new Animated.Value(0)).current;
  const buttonIn = useRef(new Animated.Value(0)).current;
  const amountPulse = useRef(new Animated.Value(1)).current;
  const stageOut = useRef(new Animated.Value(1)).current;

  const shower = useMemo(
    () =>
      Array.from({ length: SHOWER_COINS }, (_, i) => ({
        id: i,
        x: Math.random() * Math.max(width - 30, 1),
        size: 20 + Math.round(Math.random() * 14),
        delay: Math.round(Math.random() * 900),
        duration: 1500 + Math.round(Math.random() * 800),
        sway: (Math.random() - 0.5) * 60,
        turns: 3 + Math.round(Math.random() * 3),
      })),
    [width, visible],
  );

  useEffect(() => {
    if (!visible) {
      overlay.setValue(0);
      heroDrop.setValue(0);
      heroSpin.setValue(0);
      heroSquash.setValue(1);
      heroShine.setValue(-HERO_SIZE);
      glow.setValue(0);
      ring.setValue(0);
      rays.setValue(0);
      raysSpin.setValue(0);
      textIn.setValue(0);
      buttonIn.setValue(0);
      amountPulse.setValue(1);
      stageOut.setValue(1);
      setDisplayCoins(0);
      setShowShower(false);
      setFly(null);
      busy.current = false;
      arrived.current = 0;
      return undefined;
    }

    let cancelled = false;
    const timers = [];
    let raf = null;
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const anims = [];
    const go = (a) => {
      anims.push(a);
      a.start();
    };

    const celebrate = (reduceMotion) => {
      if (cancelled) return;

      if (reduceMotion) {
        playSound("coins");
        overlay.setValue(1);
        heroDrop.setValue(1);
        heroSpin.setValue(2);
        glow.setValue(1);
        textIn.setValue(1);
        buttonIn.setValue(1);
        setDisplayCoins(COIN_TARGET);
        return;
      }

      go(Animated.timing(overlay, { toValue: 1, duration: 260, useNativeDriver: true }));

      // The coin drops, tumbles and lands.
      go(
        Animated.sequence([
          Animated.delay(120),
          Animated.timing(heroDrop, { toValue: 1, duration: LAND_MS - 120, easing: Easing.in(Easing.quad), useNativeDriver: true }),
          Animated.timing(heroDrop, { toValue: 1.08, duration: 110, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(heroDrop, { toValue: 1, duration: 110, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
      );
      go(Animated.timing(heroSpin, { toValue: 3, duration: LAND_MS - 120, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }));

      // Impact.
      later(() => {
        if (cancelled) return;
        playSound("coins");
        haptic("light");
        go(
          Animated.sequence([
            Animated.timing(heroSquash, { toValue: 0.9, duration: 70, useNativeDriver: true }),
            Animated.spring(heroSquash, { toValue: 1, damping: 7, stiffness: 180, mass: 0.7, useNativeDriver: true }),
          ]),
        );
        go(Animated.timing(ring, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
        go(Animated.timing(glow, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }));
        go(Animated.timing(rays, { toValue: 1, duration: 900, useNativeDriver: true }));
        go(
          Animated.loop(
            Animated.timing(raysSpin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true }),
          ),
        );
        go(Animated.timing(heroShine, { toValue: HERO_SIZE * 1.4, duration: 700, delay: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: true }));
        setShowShower(true);
      }, LAND_MS);

      later(() => {
        go(Animated.timing(textIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }));
      }, LAND_MS + 150);

      // Balance counts up, easing to a stop as the chime lands.
      later(() => {
        const start = Date.now();
        const tick = () => {
          if (cancelled) return;
          const p = Math.min(1, (Date.now() - start) / COUNT_MS);
          setDisplayCoins(Math.round(COIN_TARGET * easeOutCubic(p)));
          if (p < 1) {
            raf = requestAnimationFrame(tick);
          } else {
            haptic("success");
            go(
              Animated.sequence([
                Animated.timing(amountPulse, { toValue: 1.12, duration: 140, useNativeDriver: true }),
                Animated.spring(amountPulse, { toValue: 1, damping: 8, stiffness: 160, useNativeDriver: true }),
              ]),
            );
            go(Animated.timing(buttonIn, { toValue: 1, duration: 360, delay: 200, useNativeDriver: true }));
          }
        };
        raf = requestAnimationFrame(tick);
      }, LAND_MS);
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then(celebrate)
      .catch(() => celebrate(false));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      if (raf) cancelAnimationFrame(raf);
      anims.forEach((a) => a.stop());
      stopSound("coins");
    };
  }, [visible]);

  // Continue: the coins stream into the wallet chip on Home, then the overlay
  // hands over. Falls back to a plain close if the chip cannot be located.
  const handleContinue = async () => {
    if (busy.current) return;
    busy.current = true;
    const reduce = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    const target = reduce || !getTarget ? null : await getTarget().catch(() => null);
    const origin = await new Promise((resolve) => {
      if (!stageRef.current) return resolve(null);
      stageRef.current.measureInWindow((x, y, w, h) => resolve({ x: x + w / 2, y: y + h / 2 }));
    });
    if (!target || !origin) {
      onArrive?.();
      onContinue?.();
      return;
    }
    setShowShower(false);
    setFly({ origin, target });
    Animated.parallel([
      Animated.timing(textIn, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(buttonIn, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(stageOut, { toValue: 0, duration: 300, useNativeDriver: true }),
      Animated.timing(overlay, { toValue: 0, duration: 650, delay: 350, useNativeDriver: true }),
    ]).start();
  };

  const flyCoins = useMemo(
    () =>
      Array.from({ length: FLY_COINS }, (_, i) => ({
        id: i,
        ox: (Math.random() - 0.5) * 70,
        oy: (Math.random() - 0.5) * 50,
        size: 26 + Math.round(Math.random() * 8),
        delay: i * FLY_STAGGER,
        side: (Math.random() - 0.5) * 120,
      })),
    [visible],
  );

  const handleLand = () => {
    arrived.current += 1;
    if (arrived.current === 1) {
      haptic("light");
      onArrive?.();
    }
    if (arrived.current === FLY_COINS) {
      haptic("success");
      setTimeout(() => onContinue?.(), 450);
    }
  };

  const heroStyle = {
    opacity: heroDrop.interpolate({ inputRange: [0, 0.15], outputRange: [0, 1], extrapolate: "clamp" }),
    transform: [
      { translateY: heroDrop.interpolate({ inputRange: [0, 1, 1.08], outputRange: [-height * 0.45, 0, -16] }) },
      { scaleX: flipScale(heroSpin, 3) },
      { scaleY: heroSquash },
    ],
  };
  const heroShadow = {
    opacity: heroDrop.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35], extrapolate: "clamp" }),
    transform: [{ scaleX: heroDrop.interpolate({ inputRange: [0, 1, 1.08], outputRange: [0.4, 1, 0.85] }) }],
  };
  const raysStyle = {
    opacity: rays,
    transform: [{ rotate: raysSpin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }) }],
  };
  const glowStyle = (scaleTo) => ({
    opacity: glow,
    transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, scaleTo] }) }],
  });
  const ringStyle = {
    opacity: ring.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.7, 0] }),
    transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [0.8, 2.4] }) }],
  };
  const textStyle = {
    opacity: textIn,
    transform: [{ translateY: textIn.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.root}>
      <Animated.View style={[styles.overlay, { opacity: overlay }]}>
        {showShower && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {shower.map((coin) => (
              <ShowerCoin key={coin.id} {...coin} height={height} />
            ))}
          </View>
        )}

        <Animated.View style={{ opacity: stageOut }}>
        <View ref={stageRef} collapsable={false} style={styles.stage}>
          <Animated.View pointerEvents="none" style={[styles.glow, styles.glowOuter, glowStyle(1.15)]} />
          <Animated.View pointerEvents="none" style={[styles.glow, styles.glowMid, glowStyle(1.1)]} />
          <Animated.View pointerEvents="none" style={[styles.glow, styles.glowInner, glowStyle(1.05)]} />

          <Animated.View pointerEvents="none" style={[styles.rays, raysStyle]}>
            {Array.from({ length: RAY_COUNT }, (_, i) => (
              <LinearGradient
                key={i}
                colors={["rgba(251,191,36,0)", "rgba(251,191,36,0.2)", "rgba(251,191,36,0)"]}
                style={[styles.ray, { transform: [{ rotate: `${(180 / RAY_COUNT) * i}deg` }] }]}
              />
            ))}
          </Animated.View>

          <Animated.View pointerEvents="none" style={[styles.ring, ringStyle]} />
          <Animated.View pointerEvents="none" style={[styles.shadow, heroShadow]} />

          <Animated.View style={heroStyle} accessible accessibilityLabel={t("ui.treasure.title")}>
            <GoldCoin size={HERO_SIZE} shine={heroShine} />
          </Animated.View>

          {SPARKLES.map((s, i) => (
            <Sparkle key={i} {...s} active={showShower} />
          ))}
        </View>
        </Animated.View>

        <Animated.View style={[styles.textBlock, textStyle]}>
          <Text style={styles.title}>{t("ui.treasure.title")}</Text>
          <Animated.Text style={[styles.coinsText, { transform: [{ scale: amountPulse }] }]}>
            {t("ui.treasure.coins", { amount: displayCoins.toLocaleString() })}
          </Animated.Text>
          <Text style={styles.subtitle}>{t("ui.treasure.subtitle")}</Text>

          <Animated.View style={{ opacity: buttonIn }}>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleContinue}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={styles.continueButtonText}>{t("ui.treasure.continue")}</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Animated.View>
      {fly && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {flyCoins.map((c) => (
            <FlyCoin
              key={c.id}
              sx={fly.origin.x + c.ox}
              sy={fly.origin.y + c.oy}
              tx={fly.target.x}
              ty={fly.target.y}
              size={c.size}
              delay={c.delay}
              side={c.side}
              onLand={handleLand}
            />
          ))}
        </View>
      )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(6, 16, 40, 0.94)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  stage: {
    width: 260,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  glow: { position: "absolute", borderRadius: 999, backgroundColor: "#fbbf24" },
  glowOuter: { width: 330, height: 330, backgroundColor: "rgba(251,191,36,0.06)" },
  glowMid: { width: 240, height: 240, backgroundColor: "rgba(251,191,36,0.10)" },
  glowInner: { width: 170, height: 170, backgroundColor: "rgba(251,191,36,0.16)" },
  rays: { position: "absolute", width: RAY_SIZE, height: RAY_SIZE, alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 18, height: RAY_SIZE },
  ring: {
    position: "absolute",
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
    borderWidth: 2,
    borderColor: "#fde68a",
  },
  shadow: {
    position: "absolute",
    bottom: 22,
    width: HERO_SIZE * 0.9,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#000",
  },
  textBlock: {
    alignItems: "center",
    marginTop: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    fontFamily: "Roboto",
  },
  coinsText: {
    fontSize: 34,
    fontWeight: "800",
    color: "#fbbf24",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.78)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
    fontFamily: "Roboto",
    lineHeight: 20,
  },
  continueButton: {
    marginTop: 24,
    minHeight: 48,
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    paddingHorizontal: 44,
    borderRadius: 28,
  },
  continueButtonText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "800",
    fontFamily: "Roboto",
  },
});

export default TreasureChestModal;
