import React, { useContext, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  PanResponder,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import HootAvatar from "./HootAvatar";
import { haptic } from "../ui/motion";
import { playSound } from "../../utils/feedback";
import { openHootChat, useHootChat } from "../../utils/hootChatStore";
import { useHeaderSpace } from "../../utils/hootHeaderSpace";
import { getCelebrated, setCelebrated, useHootGrowth } from "../../utils/hootPet";
import { getSetupGuide, markGuideSeen, useSetupGuide } from "../../utils/setupGuide";

// Hoot lives in the free strip of the header (between the logo and the icon
// buttons). The strip's width decides how big the pet is.
const MAX_H = 44;
const MIN_H = 28;
const RATIO = 150 / 128;
const PAD = 2;
const EDGE = 2;
const HOP_MS = 300;
const HOP_PX = 9;
const MIN_SPACE = Math.ceil(MIN_H * RATIO) + PAD * 2 + EDGE * 2;
const PAGE_TIPS = ["index", "Profile", "Scholarships", "favourites", "Jobs"];

let lastX = null;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const timing = (value, toValue, duration, easing = Easing.inOut(Easing.quad)) =>
  Animated.timing(value, { toValue, duration, easing, useNativeDriver: true });

// Hoot as a desktop-pet style companion: it idles, breathes, wanders around the
// screen, can be dragged anywhere, and opens the chat when tapped. All motion
// is core Animated on the native driver; reduce-motion keeps it still.
const Pet = ({ screen, space }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const petH = clamp(Math.floor((space.w - (PAD + EDGE) * 2) / RATIO), MIN_H, MAX_H);
  const petW = Math.round(petH * RATIO);
  const boxW = petW + PAD * 2;
  const boxH = petH + PAD * 2;
  const { done, total, stage } = useHootGrowth();
  const remaining = total - done;

  const [ready, setReady] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [place, setPlace] = useState({ right: true, max: 220 });
  const [bubbleText, setBubbleText] = useState(null);

  const posX = useRef(new Animated.Value(0)).current;
  const posY = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  const wiggle = useRef(new Animated.Value(0)).current;
  const face = useRef(new Animated.Value(-1)).current;
  const squash = useRef(new Animated.Value(0)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;
  const vis = useRef(new Animated.Value(0)).current;
  const bub = useRef(new Animated.Value(0)).current;
  const grow = useRef(new Animated.Value(done)).current;
  const prevStage = useRef(stage);

  const cur = useRef({ x: 0, y: 0 });
  const facing = useRef(-1);
  const bounds = useRef({ minX: EDGE, maxX: 300, minY: 0, maxY: 0 });
  const busy = useRef(false);
  const anim = useRef(null);
  const dragStart = useRef(null);
  const bubbleTimer = useRef(null);
  const bubbleShown = useRef(false);

  const minX = space.x + EDGE;
  const rowY = space.y + (space.h - boxH) / 2;
  bounds.current = {
    minX,
    maxX: Math.max(minX, space.x + space.w - boxW - EDGE),
    minY: rowY,
    maxY: rowY,
  };

  const settle = (x, y) => {
    cur.current = { x, y };
    lastX = x;
    const right = x + boxW / 2 > width / 2;
    setPlace({ right, max: Math.max(120, Math.min(220, right ? x + boxW - 8 : width - x - 8)) });
  };

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduce)
      .catch(() => {});
  }, []);

  // Start in the header strip, where the pet was last standing if possible.
  useEffect(() => {
    const b = bounds.current;
    const x = clamp(lastX ?? b.maxX, b.minX, b.maxX);
    posX.setValue(x);
    posY.setValue(b.minY);
    facing.current = x + boxW / 2 > width / 2 ? -1 : 1;
    face.setValue(facing.current);
    settle(x, b.minY);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Another screen's header (or a rotation) changes the strip: slide into it.
  useEffect(() => {
    if (!ready) return;
    const b = bounds.current;
    const x = clamp(cur.current.x, b.minX, b.maxX);
    const y = b.minY;
    if (Math.abs(x - cur.current.x) < 0.5 && Math.abs(y - cur.current.y) < 0.5) return;
    anim.current?.stop();
    anim.current = null;
    busy.current = false;
    Animated.parallel([timing(posX, x, 240, Easing.out(Easing.cubic)), timing(posY, y, 240, Easing.out(Easing.cubic))]).start();
    settle(x, y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, space.x, space.y, space.w, space.h, width]);

  useEffect(() => {
    if (!ready) return;
    Animated.spring(vis, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }).start();
  }, [ready, vis]);

  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(
      Animated.sequence([timing(breath, 1, 1700, Easing.inOut(Easing.sin)), timing(breath, 0, 1700, Easing.inOut(Easing.sin))]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduce, breath]);

  const run = (animation, onEnd) => {
    busy.current = true;
    anim.current = animation;
    animation.start(({ finished }) => {
      if (anim.current === animation) {
        anim.current = null;
        busy.current = false;
      }
      if (finished) onEnd?.();
    });
  };

  const rest = () => {
    Animated.parallel([
      Animated.spring(wiggle, { toValue: 0, friction: 6, tension: 140, useNativeDriver: true }),
      Animated.spring(hop, { toValue: 0, friction: 7, tension: 160, useNativeDriver: true }),
      Animated.spring(squash, { toValue: 0, friction: 5, tension: 160, useNativeDriver: true }),
    ]).start();
  };

  const land = () => {
    Animated.sequence([timing(squash, 1, 70, Easing.out(Easing.quad)), Animated.spring(squash, { toValue: 0, friction: 4, tension: 170, useNativeDriver: true })]).start();
  };

  const turn = (dir) => {
    if (facing.current === dir) return null;
    facing.current = dir;
    return timing(face, dir, 170, Easing.inOut(Easing.cubic));
  };

  const hopSteps = (n, height0 = 1) => {
    const steps = [];
    for (let i = 0; i < n; i++) {
      steps.push(timing(hop, height0, HOP_MS / 2, Easing.out(Easing.quad)));
      steps.push(timing(hop, 0, HOP_MS / 2, Easing.in(Easing.quad)));
    }
    return steps;
  };

  const wiggleSteps = (n) => {
    const steps = [];
    for (let i = 0; i < n; i++) steps.push(timing(wiggle, i % 2 ? 1 : -1, HOP_MS, Easing.inOut(Easing.sin)));
    steps.push(timing(wiggle, 0, 120));
    return steps;
  };

  const walk = () => {
    const b = bounds.current;
    const c = cur.current;
    const sign = Math.random() < 0.5 ? -1 : 1;
    const dist = 40 + Math.random() * 110;
    let tx = clamp(c.x + sign * dist, b.minX, b.maxX);
    if (Math.abs(tx - c.x) < 14) tx = clamp(c.x - sign * dist, b.minX, b.maxX);
    const ty = b.minY;
    const travel = Math.abs(tx - c.x);
    if (travel < 14) return;
    const n = Math.max(1, Math.round(travel / 48));
    const duration = n * HOP_MS;
    const turning = turn(tx >= c.x ? 1 : -1);
    const go = Animated.parallel([
      timing(posX, tx, duration, Easing.linear),
      timing(posY, ty, duration, Easing.inOut(Easing.quad)),
      Animated.sequence(hopSteps(n)),
      Animated.sequence(wiggleSteps(n)),
    ]);
    run(turning ? Animated.sequence([turning, go]) : go, () => {
      if (cur.current) {
        settle(tx, ty);
        land();
      }
    });
  };

  const lookAround = () => {
    const home = facing.current;
    run(
      Animated.sequence([
        timing(face, -home, 170),
        Animated.delay(550),
        timing(face, home, 170),
        Animated.delay(250),
        timing(face, -home, 170),
        Animated.delay(350),
        timing(face, home, 170),
      ]),
    );
  };

  const doubleHop = () => run(Animated.parallel([Animated.sequence(hopSteps(2, 0.8)), Animated.sequence(wiggleSteps(2))]), land);

  const shake = () => {
    const steps = [];
    for (let i = 0; i < 5; i++) steps.push(timing(wiggle, i % 2 ? 1 : -1, 90));
    steps.push(timing(wiggle, 0, 100));
    run(Animated.sequence(steps));
  };

  const showBubble = (text, ms = 6000) => {
    if (bubbleShown.current) return false;
    bubbleShown.current = true;
    setBubbleText(text);
    Animated.spring(bub, { toValue: 1, friction: 7, tension: 120, useNativeDriver: true }).start();
    haptic("light");
    clearTimeout(bubbleTimer.current);
    bubbleTimer.current = setTimeout(hideBubble, ms);
    return true;
  };

  const hideBubble = () => {
    clearTimeout(bubbleTimer.current);
    Animated.timing(bub, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      bubbleShown.current = false;
      setBubbleText(null);
    });
  };

  useEffect(() => () => clearTimeout(bubbleTimer.current), []);

  // Wander, look around, hop and shake now and then.
  useEffect(() => {
    if (reduce || !ready) return undefined;
    let timer;
    const tick = () => {
      timer = setTimeout(() => {
        if (!busy.current && !dragStart.current && !bubbleShown.current) {
          const r = Math.random();
          if (r < 0.45) walk();
          else if (r < 0.65) lookAround();
          else if (r < 0.85) doubleHop();
          else shake();
        }
        tick();
      }, 6500 + Math.random() * 6500);
    };
    tick();
    return () => {
      clearTimeout(timer);
      anim.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce, ready]);

  // Say hi once, then give a short tip the first time each page is visited.
  const prevScreen = useRef(null);
  useEffect(() => {
    if (!ready) return undefined;
    const changed = prevScreen.current !== null && prevScreen.current !== screen;
    prevScreen.current = screen;
    if (changed && !reduce && !busy.current && !dragStart.current) doubleHop();
    const page = screen.replace("(tabs)/", "");
    const timer = setTimeout(() => {
      const seen = getSetupGuide().seen;
      if (!seen.includes("pethint")) {
        if (showBubble(t("setup.petHint"))) markGuideSeen("pethint");
      } else if (PAGE_TIPS.includes(page) && !seen.includes(`tip_${page}`)) {
        if (showBubble(t(`setup.pageTip.${page}`), 7000)) markGuideSeen(`tip_${page}`);
      }
    }, 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, screen]);

  // Grow a little with every finished task; cheer once for each new step.
  useEffect(() => {
    if (!ready) return undefined;
    Animated.spring(grow, { toValue: done, friction: 7, tension: 70, useNativeDriver: true }).start();
    let alive = true;
    getCelebrated().then((prev) => {
      if (!alive) return;
      if (prev == null) {
        setCelebrated(done);
        prevStage.current = stage;
        return;
      }
      if (done <= prev) {
        prevStage.current = stage;
        return;
      }
      setCelebrated(done);
      const leveled = stage > prevStage.current;
      prevStage.current = stage;
      if (!reduce) {
        anim.current?.stop();
        anim.current = null;
        busy.current = false;
        const n = leveled ? 3 : 2;
        run(Animated.parallel([Animated.sequence(hopSteps(n, 1.2)), Animated.sequence(wiggleSteps(n))]), land);
      }
      haptic("success");
      playSound("success");
      setTimeout(() => {
        if (!alive) return;
        showBubble(
          leveled ? t("setup.pet.levelUp", { stage: t(`setup.pet.stage${stage}`) }) : t("setup.pet.taskDone"),
          5000,
        );
      }, 300);
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, done]);

  const fixFace = () => timing(face, facing.current, 120).start();

  const onTap = () => {
    haptic("select");
    hideBubble();
    anim.current?.stop();
    anim.current = null;
    busy.current = false;
    fixFace();
    posX.stopAnimation((x) => posY.stopAnimation((y) => settle(x, y)));
    Animated.parallel([
      Animated.sequence(hopSteps(1, 1.4)),
      Animated.sequence([timing(wiggle, -1, 90), timing(wiggle, 1, 120), timing(wiggle, 0, 90)]),
    ]).start();
    setTimeout(openHootChat, 140);
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        anim.current?.stop();
        anim.current = null;
        busy.current = true;
        dragStart.current = null;
        fixFace();
        posX.stopAnimation((x) =>
          posY.stopAnimation((y) => {
            dragStart.current = { x, y, moved: false };
          }),
        );
        Animated.spring(lift, { toValue: 1, friction: 6, tension: 180, useNativeDriver: true }).start();
      },
      onPanResponderMove: (_, g) => {
        const s = dragStart.current;
        if (!s) return;
        if (!s.moved && Math.hypot(g.dx, g.dy) > 6) {
          s.moved = true;
          haptic("light");
        }
        if (!s.moved) return;
        const b = bounds.current;
        posX.setValue(clamp(s.x + g.dx, b.minX, b.maxX));
        posY.setValue(clamp(s.y + g.dy, b.minY, b.maxY));
        const dir = g.vx >= 0.15 ? 1 : g.vx <= -0.15 ? -1 : 0;
        if (dir && dir !== facing.current) {
          facing.current = dir;
          timing(face, dir, 140).start();
        }
        wiggle.setValue(clamp(g.vx / 2, -1, 1));
      },
      onPanResponderRelease: (_, g) => {
        const s = dragStart.current;
        dragStart.current = null;
        busy.current = false;
        Animated.spring(lift, { toValue: 0, friction: 6, tension: 160, useNativeDriver: true }).start();
        rest();
        if (s && s.moved) {
          const b = bounds.current;
          const x = clamp(s.x + g.dx, b.minX, b.maxX);
          const y = clamp(s.y + g.dy, b.minY, b.maxY);
          settle(x, y);
          land();
          haptic("select");
        } else {
          onTap();
        }
      },
      onPanResponderTerminate: () => {
        dragStart.current = null;
        busy.current = false;
        Animated.spring(lift, { toValue: 0, useNativeDriver: true }).start();
        rest();
        posX.stopAnimation((x) => posY.stopAnimation((y) => settle(x, y)));
      },
    }),
  ).current;

  if (!ready) return null;

  const faceScale = face.interpolate({ inputRange: [-1, 0, 1], outputRange: [-1, 0.06, 1] });
  const bubbleAnchor = place.right ? { right: 0 } : { left: 0 };
  const bubbleVertical = { top: boxH + 2 };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Animated.View
        pointerEvents="box-none"
        style={[styles.box, { width: boxW, height: boxH, transform: [{ translateX: posX }, { translateY: posY }] }]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              left: boxW / 2 - petW * 0.3,
              width: petW * 0.6,
              opacity: Animated.multiply(vis, hop.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.12], extrapolate: "clamp" })),
              transform: [
                { scaleX: hop.interpolate({ inputRange: [0, 1], outputRange: [1, 0.65], extrapolate: "clamp" }) },
                { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 0.8] }) },
              ],
            },
          ]}
        />
        <Animated.View
          {...pan.panHandlers}
          accessible
          accessibilityRole="button"
          accessibilityLabel={t("setup.chat.title")}
          accessibilityHint={t("setup.petHint")}
          accessibilityActions={[{ name: "activate" }]}
          onAccessibilityAction={openHootChat}
          style={[
            styles.pet,
            {
              width: petW,
              height: petH,
              opacity: vis,
              transform: [
                { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -HOP_PX] }) },
                { translateY: breath.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] }) },
                { translateY: squash.interpolate({ inputRange: [0, 1], outputRange: [0, 2.5] }) },
                { rotate: wiggle.interpolate({ inputRange: [-1, 1], outputRange: ["-7deg", "7deg"] }) },
                { rotate: lift.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "-8deg"] }) },
                { scaleX: faceScale },
                { scaleX: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) },
                { scaleY: squash.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] }) },
                { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
                { scale: vis.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
                { translateY: grow.interpolate({ inputRange: [0, 8], outputRange: [6.2, -0.9], extrapolate: "clamp" }) },
                { scale: grow.interpolate({ inputRange: [0, 8], outputRange: [0.72, 1.04], extrapolate: "clamp" }) },
              ],
            },
          ]}
        >
          <HootAvatar size={petH} calm />
        </Animated.View>

        {remaining > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.badge,
              {
                backgroundColor: colors.accent,
                borderColor: colors.surface,
                opacity: vis,
                transform: [{ translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -HOP_PX] }) }],
              },
            ]}
          >
            <Text style={styles.badgeText} maxFontSizeMultiplier={1.1}>
              {remaining}
            </Text>
          </Animated.View>
        )}

        {bubbleText ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              bubbleAnchor,
              bubbleVertical,
              {
                width: place.max,
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: bub,
                transform: [{ scale: bub.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}
          >
            <Text style={[styles.bubbleText, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
              {bubbleText}
            </Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </View>
  );
};

const HootPet = ({ screen }) => {
  const guide = useSetupGuide();
  const chat = useHootChat();
  const space = useHeaderSpace();
  const [keyboardUp, setKeyboardUp] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardUp(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardUp(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const visible =
    !guide.active &&
    !guide.petHidden &&
    !chat.open &&
    !chat.customize &&
    !keyboardUp &&
    screen.startsWith("(tabs)") &&
    screen !== "(tabs)/Chats" &&
    !!space &&
    space.w >= MIN_SPACE;
  return visible ? <Pet screen={screen} space={space} /> : null;
};

const styles = StyleSheet.create({
  box: { position: "absolute", left: 0, top: 0 },
  pet: { position: "absolute", left: PAD, top: PAD },
  shadow: {
    position: "absolute",
    bottom: 1,
    height: 4,
    borderRadius: 3,
    backgroundColor: "#000",
  },
  badge: {
    position: "absolute",
    right: -2,
    top: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    elevation: 12,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", fontFamily: "Roboto" },
  bubble: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  bubbleText: { fontSize: 13, lineHeight: 18, fontWeight: "600", fontFamily: "Roboto" },
});

export default HootPet;
