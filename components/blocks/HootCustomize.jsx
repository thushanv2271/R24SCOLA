import React, { useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { haptic } from "../ui/motion";
import HootAvatar from "./HootAvatar";
import { closeHootCustomize, useHootChat } from "../../utils/hootChatStore";
import { CHARACTERS, STAGE_AT, setHootCharacter, useHootCharacter, useHootGrowth } from "../../utils/hootPet";
import { setPetHidden, useSetupGuide } from "../../utils/setupGuide";

const HootCustomize = () => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { customize } = useHootChat();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const character = useHootCharacter();
  const growth = useHootGrowth();
  const petHidden = useSetupGuide().petHidden;

  const [mounted, setMounted] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const sheetH = Math.min(height * 0.9, 720);
  const sheetW = Math.min(width, 560);
  const cardW = Math.floor((sheetW - 32 - 20) / 3);
  const charSize = Math.max(44, Math.min(66, cardW - 22));

  useEffect(() => {
    if (customize) {
      setMounted(true);
      Animated.timing(slide, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    } else if (mounted) {
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(
        ({ finished }) => finished && setMounted(false),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customize]);

  useEffect(() => {
    if (!mounted) return;
    Animated.timing(bar, { toValue: growth.done / growth.total, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [mounted, growth.done, growth.total, bar]);

  const pick = (id) => {
    haptic("select");
    setHootCharacter(id);
  };

  const stageName = (i) => t(`setup.pet.stage${i}`);
  const maxed = growth.nextAt == null;

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={closeHootCustomize}>
      <View style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.45)", opacity: slide }]}>
          <Pressable style={styles.fill} onPress={closeHootCustomize} accessibilityLabel={t("setup.chat.close")} />
        </Animated.View>
        <View style={styles.end} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                height: sheetH,
                width: sheetW,
                backgroundColor: colors.surface,
                transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [sheetH, 0] }) }],
              },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                {t("setup.pet.customize")}
              </Text>
              <TouchableOpacity
                onPress={closeHootCustomize}
                style={styles.close}
                accessibilityRole="button"
                accessibilityLabel={t("setup.chat.close")}
              >
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={[styles.body, { paddingBottom: Math.max(insets.bottom, 12) + 12 }]}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={[styles.preview, { backgroundColor: colors.accentLight }]}>
                <View style={styles.previewPet}>
                  <HootAvatar size={104} />
                </View>
                <Text style={[styles.stageName, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                  {stageName(growth.stage)}
                </Text>
                <Text style={[styles.progressText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  {t("setup.pet.progress", { n: String(growth.done), total: String(growth.total) })}
                </Text>
                <View style={[styles.track, { backgroundColor: colors.surface }]}>
                  <Animated.View
                    style={[
                      styles.fillBar,
                      {
                        backgroundColor: colors.success,
                        width: bar.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.nextText, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.2}>
                  {maxed
                    ? t("setup.pet.maxed")
                    : t("setup.pet.next", { name: stageName(growth.stage + 1), k: String(growth.toNext) })}
                </Text>
              </View>

              <Text style={[styles.section, { color: colors.textMuted }]} maxFontSizeMultiplier={1.2}>
                {t("setup.pet.choose")}
              </Text>
              <View style={styles.chars}>
                {CHARACTERS.map((id) => {
                  const on = id === character;
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.charCard,
                        { backgroundColor: colors.surfaceAlt || colors.surface, borderColor: on ? colors.accent : colors.border },
                        on && { borderWidth: 2 },
                      ]}
                      onPress={() => pick(id)}
                      activeOpacity={0.85}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={t(`setup.pet.${id}`)}
                    >
                      <View style={styles.charPet}>
                        <HootAvatar size={charSize} character={id} calm />
                      </View>
                      <Text style={[styles.charName, { color: colors.textPrimary }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>
                        {t(`setup.pet.${id}`)}
                      </Text>
                      {on && (
                        <View style={[styles.tick, { backgroundColor: colors.accent }]}>
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.section, { color: colors.textMuted }]} maxFontSizeMultiplier={1.2}>
                {t("setup.pet.growth")}
              </Text>
              <View style={[styles.stages, { borderColor: colors.border }]}>
                {STAGE_AT.map((at, i) => {
                  const reached = growth.stage >= i;
                  const current = growth.stage === i;
                  return (
                    <View
                      key={at}
                      style={[
                        styles.stageRow,
                        i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                        current && { backgroundColor: colors.accentLight },
                      ]}
                    >
                      <View style={[styles.stagePet, { opacity: reached ? 1 : 0.4 }]}>
                        <HootAvatar size={26 + i * 5} stage={i} calm />
                      </View>
                      <View style={styles.stageInfo}>
                        <Text style={[styles.stageLabel, { color: colors.textPrimary, opacity: reached ? 1 : 0.6 }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                          {stageName(i)}
                        </Text>
                        <Text style={[styles.stageAtText, { color: colors.textMuted }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                          {t("setup.pet.atTasks", { n: String(at) })}
                        </Text>
                      </View>
                      <Ionicons
                        name={reached ? "checkmark-circle" : "lock-closed-outline"}
                        size={20}
                        color={reached ? colors.success : colors.textMuted}
                      />
                    </View>
                  );
                })}
              </View>

              <View style={[styles.toggleRow, { borderColor: colors.border }]}>
                <Ionicons name="eye-outline" size={20} color={colors.accent} />
                <Text style={[styles.toggleText, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.2}>
                  {t("setup.pet.showOn")}
                </Text>
                <Switch
                  value={!petHidden}
                  onValueChange={(v) => setPetHidden(!v)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#ffffff"
                  accessibilityLabel={t("setup.pet.showOn")}
                />
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fill: { flex: 1 },
  end: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  sheet: { alignSelf: "center", borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: "hidden", elevation: 24 },
  scroll: { flex: 1 },
  handle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginTop: 8 },
  header: { flexDirection: "row", alignItems: "center", paddingLeft: 18, paddingRight: 8, paddingTop: 6 },
  title: { flex: 1, fontSize: 18, fontWeight: "800", fontFamily: "Roboto" },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 16, paddingTop: 4 },
  preview: { borderRadius: 20, alignItems: "center", paddingVertical: 16, paddingHorizontal: 16 },
  previewPet: { height: 108, alignItems: "center", justifyContent: "flex-end" },
  stageName: { fontSize: 20, fontWeight: "800", fontFamily: "Roboto", marginTop: 8 },
  progressText: { fontSize: 13, fontFamily: "Roboto", marginTop: 2 },
  track: { alignSelf: "stretch", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 12 },
  fillBar: { height: 8, borderRadius: 4 },
  nextText: { fontSize: 13, fontWeight: "600", fontFamily: "Roboto", marginTop: 8, textAlign: "center" },
  section: { fontSize: 12, fontWeight: "800", fontFamily: "Roboto", letterSpacing: 0.4, textTransform: "uppercase", marginTop: 18, marginBottom: 8 },
  chars: { flexDirection: "row", gap: 10 },
  charCard: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 112,
  },
  charPet: { height: 70, alignItems: "center", justifyContent: "flex-end" },
  charName: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto", marginTop: 6 },
  tick: { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  stages: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, overflow: "hidden" },
  stageRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, minHeight: 56, paddingVertical: 6 },
  stagePet: { width: 48, height: 46, alignItems: "center", justifyContent: "flex-end" },
  stageInfo: { flex: 1 },
  stageLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Roboto" },
  stageAtText: { fontSize: 12, fontFamily: "Roboto", marginTop: 1 },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 18,
    minHeight: 52,
  },
  toggleText: { flex: 1, fontSize: 15, fontWeight: "600", fontFamily: "Roboto" },
});

export default HootCustomize;
