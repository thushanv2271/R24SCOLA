import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { haptic } from "../ui/motion";
import HootAvatar from "./HootAvatar";
import { playSound } from "../../utils/feedback";
import { respond } from "../../utils/hootAssistant";
import { closeHootChat, openHootCustomize, takeHootAsk, useHootChat } from "../../utils/hootChatStore";
import { useGuideProgress } from "../../utils/guideProgress";
import { GUIDE_PHASES, setPetHidden, startSetupGuide, useSetupGuide } from "../../utils/setupGuide";
import { setExploreSearch, setExploreTab } from "../exploreTabStore";

const PAGE_TIPS = ["index", "Profile", "Scholarships", "favourites", "Jobs"];
const PHASE_QUERY = {
  profile: "complete my profile",
  mail: "email message",
  eligibility: "check my eligibility",
  save: "save favourites",
  request: "send a request",
};

// The conversation survives closing the sheet; it resets when the app restarts.
let history = [];
let nextId = 1;
const makeMessage = (msg) => ({ id: String(nextId++), ...msg });

const pageOf = (segments) => {
  if (segments[0] === "(tabs)") return segments[1] || "index";
  return segments[0] || "";
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TypingDots = ({ color }) => {
  const dots = useRef([0, 1, 2].map(() => new Animated.Value(0.3))).current;
  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(d, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 260, useNativeDriver: true }),
          Animated.delay((2 - i) * 140),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [dots]);
  return (
    <View style={styles.dots}>
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: color,
              opacity: d,
              transform: [{ translateY: d.interpolate({ inputRange: [0.3, 1], outputRange: [0, -3] }) }],
            },
          ]}
        />
      ))}
    </View>
  );
};

const Appear = ({ children, style }) => {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [v]);
  return (
    <Animated.View
      style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
};

const HootChat = () => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const chat = useHootChat();
  const router = useRouter();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { isPhaseDone } = useGuideProgress();
  const petHidden = useSetupGuide().petHidden;

  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState(history);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const listRef = useRef(null);
  const sheetH = Math.min(height * 0.84, 700);

  const push = useCallback((msg) => {
    const m = makeMessage(msg);
    history = [...history, m];
    setMessages(history);
  }, []);

  useEffect(() => {
    if (chat.open) {
      setMounted(true);
      if (!history.length) {
        const page = pageOf(segments);
        push({ from: "hoot", key: "setup.chat.greeting" });
        if (PAGE_TIPS.includes(page)) push({ from: "hoot", label: "setup.onThisPage", key: `setup.pageTip.${page}` });
      }
      Animated.timing(slide, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      const pending = takeHootAsk();
      if (pending) setTimeout(() => ask(pending.query, pending.label), 360);
    } else if (mounted) {
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
        ({ finished }) => finished && setMounted(false),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.open]);

  const ask = async (query, label) => {
    const shown = (label ?? query).trim();
    if (!shown || busy) return;
    push({ from: "me", text: shown });
    setText("");
    setBusy(true);
    haptic("select");
    playSound("send");
    let reply;
    try {
      [reply] = await Promise.all([respond(query), wait(480)]);
    } catch {
      reply = { key: "setup.chat.fallback" };
    }
    push({ from: "hoot", ...reply });
    setBusy(false);
    playSound("receive");
  };

  const runAction = (a) => {
    haptic("select");
    closeHootChat();
    if (a.type === "explore") {
      setExploreTab(a.tab);
      setExploreSearch(a.tab, a.query);
      router.navigate("/(tabs)/Scholarships");
    } else if (a.type === "tour") startSetupGuide(a.step);
    else if (a.type === "route") router.push(a.route);
  };

  const openResult = (r) => runAction({ type: "explore", tab: r.kind === "company" ? "jobs" : "scholarships", query: r.title });

  const togglePet = () => {
    haptic("select");
    setPetHidden(!petHidden);
    push({ from: "hoot", key: petHidden ? "setup.chat.shown" : "setup.chat.hidden" });
  };

  const chips = [
    { id: "uni", label: t("setup.chat.chipScholarships"), query: "find scholarships", icon: "school-outline" },
    { id: "jobs", label: t("setup.chat.chipJobs"), query: "find jobs", icon: "briefcase-outline" },
    ...GUIDE_PHASES.map((p) => ({ id: p.id, label: t(p.titleKey), query: PHASE_QUERY[p.id], icon: p.icon, done: isPhaseDone(p.id) })),
    { id: "coins", label: t("setup.chat.chipCoins"), query: "scola coins wallet", icon: "wallet-outline" },
  ];

  const renderItem = ({ item: m }) => {
    if (m.from === "me") {
      return (
        <Appear style={styles.rowMe}>
          <View style={[styles.bubble, styles.bubbleMe, { backgroundColor: colors.accent }]}>
            <Text style={styles.textMe} maxFontSizeMultiplier={1.3}>
              {m.text}
            </Text>
          </View>
        </Appear>
      );
    }
    const body = m.key ? t(m.key, m.params) : m.text;
    return (
      <Appear style={styles.rowHoot}>
        <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
          <HootAvatar size={26} calm />
        </View>
        <View style={styles.hootCol}>
          <View style={[styles.bubble, styles.bubbleHoot, { backgroundColor: colors.surfaceAlt || colors.accentLight }]}>
            {m.label ? (
              <Text style={[styles.label, { color: colors.accent }]} maxFontSizeMultiplier={1.2}>
                {t(m.label)}
              </Text>
            ) : null}
            <Text style={[styles.textHoot, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.3}>
              {body}
            </Text>
          </View>
          {m.results?.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={[styles.result, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => openResult(r)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={r.title}
            >
              <View style={[styles.resultIcon, { backgroundColor: colors.accentLight }]}>
                <Ionicons name={r.kind === "company" ? "briefcase" : "school"} size={18} color={colors.accent} />
              </View>
              <View style={styles.resultBody}>
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={2} maxFontSizeMultiplier={1.2}>
                  {r.title}
                </Text>
                <Text style={[styles.resultSub, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                  {[r.org, r.country].filter(Boolean).join(" · ")}
                </Text>
                {(r.level || r.funding) && (
                  <Text style={[styles.resultTag, { color: colors.accent }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                    {[r.level, r.funding].filter(Boolean).join(" · ")}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          {m.actions?.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.action, { borderColor: colors.accent }]}
              onPress={() => runAction(a)}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              <Text style={[styles.actionText, { color: colors.accent }]} maxFontSizeMultiplier={1.2}>
                {t(a.label)}
              </Text>
              <Ionicons name="arrow-forward" size={14} color={colors.accent} />
            </TouchableOpacity>
          ))}
        </View>
      </Appear>
    );
  };

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={closeHootChat}>
      <KeyboardAvoidingView behavior="padding" style={[styles.fill, styles.end]}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: slide }]}>
          <Pressable style={styles.fill} onPress={closeHootChat} accessibilityLabel={t("setup.chat.close")} />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetH,
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: colors.surface,
              transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] }) }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View style={[styles.headAvatar, { backgroundColor: colors.accentLight }]}>
              <HootAvatar size={34} calm />
            </View>
            <View style={styles.headText}>
              <Text style={[styles.headTitle, { color: colors.textPrimary }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {t("setup.chat.title")}
              </Text>
              <Text style={[styles.headSub, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {t("setup.assistantTitle")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={closeHootChat}
              style={styles.headBtn}
              accessibilityRole="button"
              accessibilityLabel={t("setup.chat.close")}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={openHootCustomize}
              style={[styles.pill, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={t("setup.pet.customize")}
            >
              <Ionicons name="color-palette-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                {t("setup.pet.customize")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={togglePet}
              style={[styles.pill, { borderColor: colors.border }]}
              accessibilityRole="button"
              accessibilityLabel={petHidden ? t("setup.chat.showPet") : t("setup.hideMe")}
            >
              <Ionicons name={petHidden ? "eye-outline" : "eye-off-outline"} size={16} color={colors.textSecondary} />
              <Text style={[styles.pillText, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                {petHidden ? t("setup.chat.showPet") : t("setup.hideMe")}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderItem}
            style={styles.fill}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            ListFooterComponent={
              busy ? (
                <View style={styles.rowHoot}>
                  <View style={[styles.avatar, { backgroundColor: colors.accentLight }]}>
                    <HootAvatar size={26} calm />
                  </View>
                  <View style={[styles.bubble, styles.bubbleHoot, { backgroundColor: colors.surfaceAlt || colors.accentLight }]}>
                    <TypingDots color={colors.textMuted} />
                  </View>
                </View>
              ) : null
            }
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
          >
            {chips.map((c) => (
              <TouchableOpacity
                key={c.id}
                onPress={() => ask(c.query, c.label)}
                disabled={busy}
                activeOpacity={0.8}
                style={[styles.chip, { backgroundColor: colors.surfaceAlt || colors.accentLight, borderColor: c.done ? colors.success : "transparent" }]}
                accessibilityRole="button"
                accessibilityLabel={c.label}
              >
                <Ionicons name={c.icon} size={15} color={colors.accent} />
                <Text style={[styles.chipText, { color: colors.textPrimary }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                  {c.label}
                </Text>
                {c.done && <Ionicons name="checkmark-circle" size={15} color={colors.success} />}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceAlt || colors.surface }]}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={t("setup.chat.placeholder")}
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.textPrimary }]}
              returnKeyType="send"
              blurOnSubmit={false}
              maxLength={200}
              onSubmitEditing={() => ask(text)}
              accessibilityLabel={t("setup.chat.placeholder")}
            />
            <TouchableOpacity
              onPress={() => ask(text)}
              disabled={busy || !text.trim()}
              activeOpacity={0.85}
              style={[styles.send, { backgroundColor: colors.tabBarAccent || colors.accent, opacity: busy || !text.trim() ? 0.4 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={t("setup.chat.send")}
            >
              <Ionicons name="arrow-up" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  end: { justifyContent: "flex-end" },
  sheet: {
    flexShrink: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    elevation: 24,
  },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 8, paddingBottom: 8 },
  headAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headText: { flex: 1, marginLeft: 10 },
  headTitle: { fontSize: 17, fontWeight: "800", fontFamily: "Roboto" },
  headSub: { fontSize: 12, fontFamily: "Roboto", marginTop: 1 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 14, paddingBottom: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 36,
    maxWidth: "100%",
    flexShrink: 1,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pillText: { flexShrink: 1, fontSize: 13, fontWeight: "700", fontFamily: "Roboto" },
  headBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 14, paddingVertical: 8, gap: 10 },
  rowMe: { alignItems: "flex-end" },
  rowHoot: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  hootCol: { flex: 1, alignItems: "flex-start", gap: 6 },
  bubble: { maxWidth: "88%", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMe: { borderBottomRightRadius: 6 },
  bubbleHoot: { borderTopLeftRadius: 6 },
  textMe: { color: "#fff", fontSize: 15, lineHeight: 21, fontFamily: "Roboto" },
  textHoot: { fontSize: 15, lineHeight: 21, fontFamily: "Roboto" },
  label: { fontSize: 11, fontWeight: "800", fontFamily: "Roboto", letterSpacing: 0.3, textTransform: "uppercase", marginBottom: 2 },
  dots: { flexDirection: "row", gap: 5, paddingVertical: 7, paddingHorizontal: 3 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  result: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  resultIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  resultBody: { flex: 1 },
  resultTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto" },
  resultSub: { fontSize: 12, fontFamily: "Roboto", marginTop: 1 },
  resultTag: { fontSize: 12, fontWeight: "600", fontFamily: "Roboto", marginTop: 2 },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  actionText: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto" },
  chipScroll: { flexGrow: 0, maxHeight: 48 },
  chipRow: { paddingHorizontal: 14, gap: 8, alignItems: "center", paddingVertical: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: "600", fontFamily: "Roboto", maxWidth: 170 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginTop: 8,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: { flex: 1, height: 48, fontSize: 15, fontFamily: "Roboto", paddingVertical: 0 },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
});

export default HootChat;
