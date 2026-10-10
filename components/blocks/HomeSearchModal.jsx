import React, { useContext, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, ScrollView, Modal, StyleSheet, Keyboard, TouchableOpacity, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { useInterest } from "../InterestContext";
import { PressableScale, haptic } from "../ui/motion";
import { loadListings } from "../../services/listingsCache";
import { KIND_COMPANY, KIND_UNIVERSITY, getCategories } from "../../constants/categories";
import { categoryLook } from "../../constants/categoryColors";

const RECENT_KEY = "home_recent_searches";
const MAX_RECENT = 8;
const MAX_CATEGORY_HITS = 5;
const MAX_LISTING_HITS = 5;
const POPULAR_COUNT = 8;

const tokensOf = (text) => text.toLowerCase().split(/\s+/).filter(Boolean);

// Bold the part of a suggestion that matches what the user typed.
const Highlight = ({ text, query, style, colors }) => {
  const at = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || at < 0) return <Text style={style} numberOfLines={2}>{text}</Text>;
  return (
    <Text style={style} numberOfLines={2}>
      {text.slice(0, at)}
      <Text style={{ fontWeight: "800", color: colors.accent }}>{text.slice(at, at + query.length)}</Text>
      {text.slice(at + query.length)}
    </Text>
  );
};

const Row = ({ icon, iconBg, iconColor, title, caption, query, onPress, colors, trailing, label }) => (
  <PressableScale
    scaleTo={0.98}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label || (caption ? `${title}, ${caption}` : title)}
    style={styles.row}
  >
    <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={18} color={iconColor} />
    </View>
    <View style={styles.rowText}>
      <Highlight text={title} query={query} colors={colors} style={[styles.rowTitle, { color: colors.textPrimary }]} />
      {!!caption && (
        <Text style={[styles.rowCaption, { color: colors.textSecondary }]} numberOfLines={2}>
          {caption}
        </Text>
      )}
    </View>
    {trailing}
  </PressableScale>
);

const SectionLabel = ({ children, colors, action }) => (
  <View style={styles.sectionLabelRow}>
    <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
      {children}
    </Text>
    {action}
  </View>
);

// Full-screen search for Home: type to see recent searches, matching fields /
// industries and listings, then submit to land in Explore already filtered.
const HomeSearchModal = ({ visible, kind, onClose, onSearch, onPickCategory, onPickListing }) => {
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [listings, setListings] = useState(null);
  const deferred = useDeferredValue(query.trim());

  useEffect(() => {
    if (!visible) return;
    setQuery("");
    AsyncStorage.getItem(RECENT_KEY)
      .then((raw) => {
        const parsed = raw ? JSON.parse(raw) : [];
        setRecent(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
      })
      .catch(() => setRecent([]));
    loadListings().then(setListings).catch(() => setListings([]));
  }, [visible]);

  const saveRecent = (next) => {
    setRecent(next);
    AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => {});
  };
  const remember = (text) => {
    const clean = text.trim();
    if (!clean) return;
    saveRecent([clean, ...recent.filter((r) => r.toLowerCase() !== clean.toLowerCase())].slice(0, MAX_RECENT));
  };

  // Only search the side the user picked (both, by default).
  const { showUniversities, showCompanies } = useInterest();

  const fields = useMemo(() => {
    const out = [];
    [
      ...(showUniversities ? [KIND_UNIVERSITY] : []),
      ...(showCompanies ? [KIND_COMPANY] : []),
    ].forEach((k) => {
      getCategories(k).forEach((group) => {
        out.push({ kind: k, group: group.name, sub: "", name: group.name });
        group.subcategories.forEach((sub) => out.push({ kind: k, group: group.name, sub, name: sub }));
      });
    });
    return out;
  }, [showUniversities, showCompanies]);

  const popular = useMemo(
    () => getCategories(kind === "companies" ? KIND_COMPANY : KIND_UNIVERSITY).slice(0, POPULAR_COUNT),
    [kind],
  );

  const categoryHits = useMemo(() => {
    if (deferred.length < 2) return [];
    const words = tokensOf(deferred);
    const lower = deferred.toLowerCase();
    return fields
      .filter((f) => words.every((w) => f.name.toLowerCase().includes(w)))
      .sort((a, b) => {
        const aStart = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
        const bStart = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
        return aStart - bStart;
      })
      .slice(0, MAX_CATEGORY_HITS);
  }, [fields, deferred]);

  const listingHits = useMemo(() => {
    if (deferred.length < 2 || !listings) return [];
    const words = tokensOf(deferred);
    const lower = deferred.toLowerCase();
    const seen = new Set();
    const hits = [];
    listings.forEach((item) => {
      if (!item.title) return;
      const isCompanyItem = item.listingKind === KIND_COMPANY;
      if (isCompanyItem ? !showCompanies : !showUniversities) return;
      const hay = `${item.title} ${item.university || ""}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return;
      const key = item.title.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      hits.push(item);
    });
    return hits
      .sort((a, b) => (b.title.toLowerCase().startsWith(lower) ? 1 : 0) - (a.title.toLowerCase().startsWith(lower) ? 1 : 0))
      .slice(0, MAX_LISTING_HITS);
  }, [listings, deferred, showUniversities, showCompanies]);

  const submit = (text, searchKind) => {
    const clean = text.trim();
    if (!clean) return;
    haptic("select");
    remember(clean);
    Keyboard.dismiss();
    onSearch(searchKind, clean);
  };

  const kindLabel = (k) => (k === KIND_COMPANY ? t("explore.companies") : t("explore.universities"));
  const hasQuery = deferred.length > 0;
  const otherKind = kind === "companies" ? "universities" : "companies";

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.textPrimary }]}
              value={query}
              onChangeText={setQuery}
              placeholder={t("home.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => submit(query, kind)}
              accessibilityLabel={t("home.searchPlaceholder")}
            />
            {!!query && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  inputRef.current?.focus();
                }}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t("ui.a11y.dismiss")}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {hasQuery ? (
            <>
              {(showUniversities && showCompanies
                ? [kind === "companies" ? "companies" : "universities", otherKind]
                : [showCompanies ? "companies" : "universities"]
              ).map((k) => (
                <Row
                  key={k}
                  icon="search"
                  iconBg={colors.accentLight}
                  iconColor={colors.accent}
                  title={t(k === "companies" ? "home.searchInCompanies" : "home.searchInUniversities", { query: deferred })}
                  query=""
                  colors={colors}
                  onPress={() => submit(query, k)}
                  trailing={<Ionicons name="arrow-forward" size={18} color={colors.textMuted} />}
                />
              ))}

              {categoryHits.length > 0 && (
                <>
                  <SectionLabel colors={colors}>{t("home.searchCategories")}</SectionLabel>
                  {categoryHits.map((hit) => {
                    const look = categoryLook(hit.group, isDark);
                    return (
                      <Row
                        key={`${hit.kind}:${hit.group}:${hit.sub}`}
                        icon={look.icon}
                        iconBg={look.bg}
                        iconColor={look.fg}
                        title={hit.name}
                        caption={hit.sub ? `${kindLabel(hit.kind)} · ${hit.group}` : kindLabel(hit.kind)}
                        query={deferred}
                        colors={colors}
                        onPress={() => {
                          haptic("select");
                          Keyboard.dismiss();
                          onPickCategory(hit.kind === KIND_COMPANY ? "companies" : "universities", hit.group, hit.sub);
                        }}
                      />
                    );
                  })}
                </>
              )}

              {listingHits.length > 0 && (
                <>
                  <SectionLabel colors={colors}>{t("home.searchListings")}</SectionLabel>
                  {listingHits.map((item) => {
                    const isCompany = item.listingKind === KIND_COMPANY;
                    return (
                      <Row
                        key={String(item.id || item.title)}
                        icon={isCompany ? "briefcase" : "school"}
                        iconBg={colors.surfaceAlt}
                        iconColor={colors.textSecondary}
                        title={item.title}
                        caption={[item.university, item.country].filter(Boolean).join(" · ")}
                        query={deferred}
                        colors={colors}
                        onPress={() => {
                          remember(item.title);
                          onPickListing(isCompany ? "companies" : "universities", item.title);
                        }}
                      />
                    );
                  })}
                </>
              )}
            </>
          ) : (
            <>
              {recent.length > 0 && (
                <>
                  <SectionLabel
                    colors={colors}
                    action={
                      <TouchableOpacity
                        onPress={() => saveRecent([])}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.clearText, { color: colors.accent }]}>
                          {t("home.searchClear")}
                        </Text>
                      </TouchableOpacity>
                    }
                  >
                    {t("home.searchRecent")}
                  </SectionLabel>
                  {recent.map((text) => (
                    <Row
                      key={text}
                      icon="time-outline"
                      iconBg={colors.surfaceAlt}
                      iconColor={colors.textSecondary}
                      title={text}
                      query=""
                      colors={colors}
                      onPress={() => submit(text, kind)}
                      trailing={
                        <TouchableOpacity
                          onPress={() => saveRecent(recent.filter((r) => r !== text))}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          accessibilityRole="button"
                          accessibilityLabel={t("home.searchRemove", { query: text })}
                        >
                          <Ionicons name="close" size={18} color={colors.textMuted} />
                        </TouchableOpacity>
                      }
                    />
                  ))}
                </>
              )}

              <SectionLabel colors={colors}>{t("home.searchPopular")}</SectionLabel>
              <View style={styles.chipRow}>
                {popular.map((group) => {
                  const look = categoryLook(group.name, isDark);
                  return (
                    <PressableScale
                      key={group.name}
                      scaleTo={0.96}
                      onPress={() => {
                        haptic("select");
                        Keyboard.dismiss();
                        onPickCategory(kind, group.name, "");
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={group.name}
                      style={[styles.chip, { backgroundColor: look.bg }]}
                    >
                      <Ionicons name={look.icon} size={16} color={look.fg} />
                      <Text style={[styles.chipText, { color: look.fg }]}>
                        {group.name}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backBtn: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontSize: 16, padding: 0, ...Platform.select({ web: { outlineStyle: "none" } }) },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 20, marginBottom: 6 },
  sectionLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  clearText: { fontSize: 13, fontWeight: "700" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 56, paddingVertical: 6 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: "600" },
  rowCaption: { fontSize: 14, lineHeight: 20, marginTop: 2 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, minHeight: 48, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22 },
  chipText: { fontSize: 14, fontWeight: "700" },
});

export default HomeSearchModal;
