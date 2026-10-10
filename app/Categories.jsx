import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Keyboard, LayoutAnimation, AccessibilityInfo, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import ScreenHeader from "../components/blocks/ScreenHeader";
import ExploreSwitch from "../components/ui/ExploreSwitch";
import { useInterest } from "../components/InterestContext";
import SkeletonBlock from "../components/ui/SkeletonBlock";
import { PressableScale, haptic } from "../components/ui/motion";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { setExploreTab, setExploreCategory } from "../components/exploreTabStore";
import { loadListings } from "../services/listingsCache";
import { KIND_COMPANY, KIND_UNIVERSITY, getCategories } from "../constants/categories";
import { categoryLook } from "../constants/categoryColors";
import { fold, tokenize, matchRange, withinEdits } from "../utils/listingSearch";

const SCREEN_PADDING = 16;
const GAP = 12;
const MAX_WIDTH = 720;
const VIEW_KEY = "@categories_view_mode";
const VIEW_MODES = [
  { value: "list", icon: "list-outline", labelKey: "explore.listView" },
  { value: "card", icon: "albums-outline", labelKey: "explore.cardView" },
  { value: "grid", icon: "grid-outline", labelKey: "explore.gridView" },
];
const LEVELS = ["Masters", "PhD"];
const RAIL = 2;
const RAIL_INSET = 31;
const BRANCH_WIDTH = 18;
const ROW_MID = 28;

const Hl = ({ text, query, style, accent }) => {
  const range = matchRange(text, query);
  if (!range) return <Text style={style} maxFontSizeMultiplier={1.3}>{text}</Text>;
  return (
    <Text style={style} maxFontSizeMultiplier={1.3}>
      {text.slice(0, range[0])}
      <Text style={{ fontWeight: "800", color: accent }}>{text.slice(range[0], range[1])}</Text>
      {text.slice(range[1])}
    </Text>
  );
};

const Chip = ({ label, selected, onPress, colors }) => (
  <PressableScale
    scaleTo={0.96}
    onPress={onPress}
    accessibilityRole="radio"
    accessibilityState={{ selected }}
    style={[
      styles.chip,
      selected
        ? { backgroundColor: colors.accent, borderColor: colors.accent }
        : { backgroundColor: colors.surface, borderColor: colors.border },
    ]}
  >
    <Text style={[styles.chipText, { color: selected ? "#fff" : colors.textPrimary }]} maxFontSizeMultiplier={1.3}>
      {label}
    </Text>
  </PressableScale>
);

const ViewToggle = ({ value, onChange, colors, t }) => (
  <View style={[styles.viewToggle, { backgroundColor: colors.surfaceAlt }]} accessibilityRole="radiogroup">
    {VIEW_MODES.map((m) => {
      const selected = m.value === value;
      return (
        <Pressable
          key={m.value}
          onPress={() => onChange(m.value)}
          hitSlop={{ top: 4, bottom: 4 }}
          accessibilityRole="radio"
          accessibilityState={{ selected }}
          accessibilityLabel={t(m.labelKey)}
          style={[styles.viewSegment, selected && [styles.viewSegmentOn, { backgroundColor: colors.surface }]]}
        >
          <Ionicons name={m.icon} size={18} color={selected ? colors.accent : colors.textSecondary} />
        </Pressable>
      );
    })}
  </View>
);

const SkeletonList = () => (
  <View>
    {[0, 1, 2, 3, 4, 5, 6].map((i) => (
      <SkeletonBlock key={i} style={{ height: 64, borderRadius: 16, marginBottom: 10 }} />
    ))}
  </View>
);

// A child row hangs off the parent's vertical rail by a short horizontal branch.
const Branch = ({ isFirst, isLast, tint, children }) => (
  <View style={[styles.branchWrap, !isLast && styles.branchGap]}>
    <View style={styles.branchGutter} pointerEvents="none">
      <View
        style={[
          styles.rail,
          { backgroundColor: tint, top: isFirst ? -10 : 0 },
          isLast ? { height: ROW_MID + RAIL + (isFirst ? 10 : 0) } : { bottom: 0 },
        ]}
      />
      <View style={[styles.branch, { backgroundColor: tint }]} />
    </View>
    <View style={styles.branchBody}>{children}</View>
  </View>
);

export default function Categories() {
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState("list");
  const reduceMotion = useRef(false);

  const [chosenKind, setKind] = useState(params.kind === "companies" ? "companies" : "universities");
  // A single interest pins the page to that side and removes the switch.
  const { interest, isBoth } = useInterest();
  const kind = isBoth ? chosenKind : interest;
  const [level, setLevel] = useState(LEVELS.includes(params.level) ? params.level : "");
  const [open, setOpen] = useState(typeof params.category === "string" ? params.category : "");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState(null);
  const scrollRef = useRef(null);
  const offsets = useRef({});

  const isUni = kind === "universities";
  const listingKind = isUni ? KIND_UNIVERSITY : KIND_COMPANY;
  const groups = useMemo(() => getCategories(listingKind), [listingKind]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotion.current = v; }).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(VIEW_KEY)
      .then((saved) => {
        if (VIEW_MODES.some((m) => m.value === saved)) setMode(saved);
      })
      .catch(() => {});
  }, []);

  const changeMode = (next) => {
    if (next === mode) return;
    haptic("select");
    setMode(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {});
  };

  useEffect(() => {
    let cancelled = false;
    loadListings()
      .then((data) => !cancelled && setListings(data))
      .catch(() => !cancelled && setListings([]));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (open && listings) {
      const y = offsets.current[open];
      if (y != null) setTimeout(() => scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true }), 60);
    }
  }, [listings]);

  const counts = useMemo(() => {
    const byGroup = new Map();
    const bySub = new Map();
    (listings || []).forEach((item) => {
      if (item.listingKind !== listingKind) return;
      if (isUni && level && item.level !== level) return;
      byGroup.set(item.category, (byGroup.get(item.category) || 0) + 1);
      const key = `${item.category}|${item.major}`;
      bySub.set(key, (bySub.get(key) || 0) + 1);
    });
    return { byGroup, bySub };
  }, [listings, listingKind, isUni, level]);

  const countText = (n) => (n === 0 ? t("home.browseNone") : n === 1 ? t("home.browseCountOne") : t("home.browseCount", { count: n }));
  const memberText = (n) =>
    isUni
      ? n === 1 ? t("home.catSubjectsOne") : t("home.catSubjects", { count: n })
      : n === 1 ? t("home.catSectorsOne") : t("home.catSectors", { count: n });

  const switchKind = (next) => {
    if (next === kind || !isBoth) return;
    setKind(next);
    setOpen("");
    setQuery("");
  };

  const openExplore = (groupName, subName) => {
    haptic("select");
    Keyboard.dismiss();
    const tab = isUni ? "scholarships" : "jobs";
    setExploreTab(tab);
    setExploreCategory(tab, groupName, subName || "", isUni ? level : "");
    router.push("/Scholarships");
  };

  const toggleGroup = (name) => {
    haptic("select");
    const next = open === name ? "" : name;
    if (!reduceMotion.current) LayoutAnimation.configureNext(LayoutAnimation.create(180, "easeInEaseOut", "opacity"));
    setOpen(next);
    if (next) {
      setTimeout(() => {
        const y = offsets.current[next];
        if (y != null) scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
      }, 40);
    }
  };

  const tokens = useMemo(() => tokenize(query), [query]);
  const searchTree = useMemo(() => {
    if (!tokens.length) return null;
    const run = (fuzzy) => {
      const has = (text, tk) =>
        text.includes(tk) ||
        (fuzzy && tk.length >= 4 && text.split(/\s+/).some((w) => w[0] === tk[0] && withinEdits(w, tk, tk.length >= 8 ? 2 : 1)));
      const out = [];
      groups.forEach((g) => {
        const gf = fold(g.name);
        const groupHit = tokens.every((tk) => has(gf, tk));
        const subs = g.subcategories
          .map((s) => ({ s, sf: fold(s) }))
          .filter(({ sf }) => tokens.some((tk) => has(sf, tk)) && tokens.every((tk) => has(sf, tk) || has(gf, tk)))
          .sort((a, b) => {
            const phrase = tokens.join(" ");
            return (a.sf.startsWith(phrase) ? 0 : 1) - (b.sf.startsWith(phrase) ? 0 : 1);
          })
          .map(({ s }) => s);
        if (groupHit || subs.length) out.push({ group: g, groupHit, subs });
      });
      return out.sort((a, b) => (b.groupHit ? 1 : 0) - (a.groupHit ? 1 : 0));
    };
    let out = run(false);
    if (!out.length && tokens.some((tk) => tk.length >= 4)) out = run(true);
    return out;
  }, [groups, tokens]);

  const resultCount = searchTree ? searchTree.reduce((n, r) => n + (r.subs.length || 1), 0) : 0;

  const contentW = Math.min(width, MAX_WIDTH);
  const tileW = Math.floor((contentW - SCREEN_PADDING * 2 - GAP) / 2);
  const subTileW = Math.floor((contentW - SCREEN_PADDING * 2 - 24 - 10) / 2);

  const subInfo = (groupName, sub, isAll) => {
    const n = isAll ? counts.byGroup.get(groupName) || 0 : counts.bySub.get(`${groupName}|${sub}`) || 0;
    const title = isAll ? t("home.catViewAll", { name: groupName }) : sub;
    return { n, title, label: `${groupName}, ${title}, ${countText(n)}` };
  };

  const renderSubRow = (g, sub, isAll, isFirst, isLast, look) => {
    const { n, title, label } = subInfo(g.name, sub, isAll);
    return (
      <Branch key={isAll ? "all" : sub} isFirst={isFirst} isLast={isLast} tint={look.fg}>
        <PressableScale
          scaleTo={0.98}
          onPress={() => openExplore(g.name, isAll ? "" : sub)}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[
            styles.subRow,
            isAll
              ? { backgroundColor: look.bg, borderColor: look.bg }
              : { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.subText}>
            {isAll ? (
              <Text style={[styles.subTitle, { color: colors.textPrimary, fontWeight: "700" }]} maxFontSizeMultiplier={1.3}>
                {title}
              </Text>
            ) : (
              <Hl text={title} query={query} accent={colors.accent} style={[styles.subTitle, { color: colors.textPrimary }]} />
            )}
          </View>
          <Text style={[styles.subCount, { color: n > 0 ? look.fg : colors.textMuted }]} maxFontSizeMultiplier={1.3}>
            {n === 0 ? t("home.browseNone") : n}
          </Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </PressableScale>
      </Branch>
    );
  };

  const renderSubCard = (g, sub, isAll, look) => {
    const { n, title, label } = subInfo(g.name, sub, isAll);
    return (
      <PressableScale
        key={isAll ? "all" : sub}
        scaleTo={0.98}
        onPress={() => openExplore(g.name, isAll ? "" : sub)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.subCard,
          { backgroundColor: isAll ? look.bg : colors.surface, borderColor: isAll ? look.bg : colors.border },
        ]}
      >
        <View style={[styles.accentStrip, { backgroundColor: look.fg }]} />
        <View style={styles.subText}>
          {isAll ? (
            <Text style={[styles.subCardTitle, { color: colors.textPrimary }]} maxFontSizeMultiplier={1.3}>{title}</Text>
          ) : (
            <Hl text={title} query={query} accent={colors.accent} style={[styles.subCardTitle, { color: colors.textPrimary }]} />
          )}
          <Text style={[styles.subCardMeta, { color: n > 0 ? look.fg : colors.textMuted }]} maxFontSizeMultiplier={1.3}>
            {countText(n)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableScale>
    );
  };

  const renderSubTile = (g, sub, isAll, look) => {
    const { n, title, label } = subInfo(g.name, sub, isAll);
    return (
      <PressableScale
        key={isAll ? "all" : sub}
        scaleTo={0.96}
        onPress={() => openExplore(g.name, isAll ? "" : sub)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[
          styles.subTile,
          { width: subTileW, backgroundColor: colors.surface, borderColor: isAll ? look.fg : colors.surface },
          isAll && { borderWidth: 2 },
        ]}
      >
        {isAll ? (
          <Text style={[styles.subTileTitle, { color: colors.textPrimary, fontWeight: "800" }]} numberOfLines={3} maxFontSizeMultiplier={1.3}>{title}</Text>
        ) : (
          <Hl text={title} query={query} accent={colors.accent} style={[styles.subTileTitle, { color: colors.textPrimary }]} />
        )}
        <Text style={[styles.subTileMeta, { color: n > 0 ? look.fg : colors.textMuted }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          {countText(n)}
        </Text>
      </PressableScale>
    );
  };

  const renderSubs = (g, subs, look) => {
    const rows = [{ all: true }, ...subs.map((sub) => ({ sub }))];
    if (mode === "grid") {
      return (
        <View style={[styles.panel, { backgroundColor: look.bg }]}>
          {rows.map((r) => renderSubTile(g, r.sub, !!r.all, look))}
        </View>
      );
    }
    if (mode === "card") {
      return <View style={styles.cardSubs}>{rows.map((r) => renderSubCard(g, r.sub, !!r.all, look))}</View>;
    }
    return (
      <View style={styles.tree}>
        {rows.map((r, i) => renderSubRow(g, r.sub, !!r.all, i === 0, i === rows.length - 1, look))}
      </View>
    );
  };

  // variant: how the category itself is drawn (list row / big card / half-width tile).
  const renderGroupHeader = (g, variant, expanded, forceOpen, groupHit) => {
    const look = categoryLook(g.name, isDark);
    const n = counts.byGroup.get(g.name) || 0;
    const press = () => {
      if (forceOpen) {
        setQuery("");
        setOpen(g.name);
      } else {
        toggleGroup(g.name);
      }
    };
    const common = {
      onPress: press,
      accessibilityRole: "button",
      accessibilityState: { expanded },
      accessibilityLabel: `${g.name}, ${memberText(g.subcategories.length)}, ${countText(n)}`,
    };
    const nameNode = (style) => (
      <Hl text={g.name} query={groupHit ? query : ""} accent={colors.accent} style={style} />
    );

    if (variant === "tile") {
      return (
        <PressableScale
          key={g.name}
          {...common}
          scaleTo={0.96}
          style={[styles.tile, { width: tileW, backgroundColor: look.bg, borderColor: expanded ? look.fg : look.bg }]}
        >
          <View style={styles.tileTop}>
            <View style={[styles.coinSmall, { backgroundColor: colors.surface }]}>
              <Ionicons name={look.icon} size={20} color={look.fg} />
            </View>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={18} color={look.fg} />
          </View>
          <View>
            {nameNode([styles.tileName, { color: colors.textPrimary }])}
            <Text style={[styles.tileMeta, { color: look.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {memberText(g.subcategories.length)}
            </Text>
            <Text style={[styles.tileCount, { color: look.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {countText(n)}
            </Text>
          </View>
        </PressableScale>
      );
    }

    if (variant === "card") {
      return (
        <PressableScale
          key={g.name}
          {...common}
          scaleTo={0.985}
          style={[styles.bigCard, { backgroundColor: look.bg, borderColor: expanded ? look.fg : look.bg }]}
        >
          <View style={[styles.coinLarge, { backgroundColor: colors.surface }]}>
            <Ionicons name={look.icon} size={26} color={look.fg} />
          </View>
          <View style={styles.groupText}>
            {nameNode([styles.bigName, { color: colors.textPrimary }])}
            <Text style={[styles.groupMeta, { color: look.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {memberText(g.subcategories.length)}
            </Text>
            <Text style={[styles.bigCount, { color: look.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {countText(n)}
            </Text>
          </View>
          <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={look.fg} />
        </PressableScale>
      );
    }

    return (
      <PressableScale
        key={g.name}
        {...common}
        scaleTo={0.985}
        style={[
          styles.groupRow,
          { backgroundColor: expanded ? look.bg : colors.surface, borderColor: expanded ? look.bg : colors.border },
        ]}
      >
        <View style={[styles.coin, { backgroundColor: expanded ? colors.surface : look.bg }]}>
          <Ionicons name={look.icon} size={21} color={look.fg} />
        </View>
        <View style={styles.groupText}>
          {nameNode([styles.groupName, { color: colors.textPrimary }])}
          <Text style={[styles.groupMeta, { color: colors.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            {memberText(g.subcategories.length)} · {countText(n)}
          </Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={expanded ? look.fg : colors.textMuted} />
      </PressableScale>
    );
  };

  const track = (names) => (e) => {
    const y = e.nativeEvent.layout.y;
    names.forEach((n) => {
      offsets.current[n] = y;
    });
  };

  const renderBrowse = () => {
    if (mode === "grid") {
      const rows = [];
      for (let i = 0; i < groups.length; i += 2) {
        const pair = groups.slice(i, i + 2);
        const openGroup = pair.find((g) => g.name === open);
        rows.push(
          <View key={pair[0].name} style={styles.gridBlock} onLayout={track(pair.map((g) => g.name))}>
            <View style={styles.tileRow}>
              {pair.map((g) => renderGroupHeader(g, "tile", g.name === open, false, true))}
            </View>
            {openGroup && renderSubs(openGroup, openGroup.subcategories, categoryLook(openGroup.name, isDark))}
          </View>,
        );
      }
      return rows;
    }
    return groups.map((g) => {
      const expanded = open === g.name;
      return (
        <View key={g.name} style={mode === "card" ? styles.cardGroup : styles.group} onLayout={track([g.name])}>
          {renderGroupHeader(g, mode, expanded, false, true)}
          {expanded && renderSubs(g, g.subcategories, categoryLook(g.name, isDark))}
        </View>
      );
    });
  };

  const renderSearch = () =>
    searchTree.map((r) => (
      <View key={r.group.name} style={mode === "list" ? styles.group : styles.cardGroup}>
        {renderGroupHeader(r.group, mode === "list" ? "list" : "card", true, true, r.groupHit)}
        {renderSubs(r.group, r.subs, categoryLook(r.group.name, isDark))}
      </View>
    ));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <View style={[styles.headerWrap, styles.centered]}>
        <ScreenHeader onBack={() => router.back()} />
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.content, styles.centered]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <LinearGradient
          colors={["#004aad", "#0d64c8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroTitle} accessibilityRole="header" maxFontSizeMultiplier={1.3}>
            {t("home.browseTitle")}
          </Text>
          <Text style={styles.heroIntro} maxFontSizeMultiplier={1.3}>
            {isUni ? t("home.catIntroUni") : t("home.catIntroCompany")}
          </Text>

          {isBoth && (
            <ExploreSwitch
              value={kind}
              onChange={switchKind}
              sides={["universities", "companies"]}
              labels={{ universities: t("explore.universities"), companies: t("explore.companies") }}
              caption={t(isUni ? "explore.universities" : "explore.companies")}
              onDark
              style={styles.switch}
            />
          )}

          <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              placeholder={isUni ? t("home.catSearchFields") : t("home.catSearchIndustries")}
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityRole="search"
              accessibilityLabel={isUni ? t("home.catSearchFields") : t("home.catSearchIndustries")}
            />
            {!!query && (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t("ui.a11y.dismiss")}
              >
                <Ionicons name="close-circle" size={19} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </LinearGradient>

        {isUni && (
          <View style={styles.levelBlock}>
            <Text style={[styles.label, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
              {t("home.catStepQualification")}
            </Text>
            <View style={styles.chipRow} accessibilityRole="radiogroup">
              <Chip label={t("home.catAnyLevel")} selected={!level} onPress={() => { haptic("select"); setLevel(""); }} colors={colors} />
              <Chip label={t("home.catLevelMasters")} selected={level === "Masters"} onPress={() => { haptic("select"); setLevel("Masters"); }} colors={colors} />
              <Chip label={t("home.catLevelPhd")} selected={level === "PhD"} onPress={() => { haptic("select"); setLevel("PhD"); }} colors={colors} />
            </View>
          </View>
        )}

        <View style={styles.listHead}>
          <Text
            style={[styles.label, styles.listHeadText, { color: colors.textSecondary }]}
            accessibilityLiveRegion="polite"
            maxFontSizeMultiplier={1.3}
            numberOfLines={1}
          >
            {searchTree
              ? searchTree.length
                ? `${resultCount} · ${isUni ? t("home.catFields") : t("home.catIndustries")}`
                : ""
              : isUni ? t("home.catFields") : t("home.catIndustries")}
          </Text>
          <ViewToggle value={mode} onChange={changeMode} colors={colors} t={t} />
        </View>

        {searchTree ? (
          searchTree.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="search-outline" size={44} color={colors.textMuted} />
              <Text style={[styles.empty, { color: colors.textSecondary }]} maxFontSizeMultiplier={1.3}>
                {t("home.catNoResults", { query: query.trim() })}
              </Text>
              <PressableScale
                scaleTo={0.97}
                onPress={() => setQuery("")}
                accessibilityRole="button"
                accessibilityLabel={t("home.catClearSearch")}
                style={[styles.emptyBtn, { borderColor: colors.accent }]}
              >
                <Text style={[styles.emptyBtnText, { color: colors.accent }]} maxFontSizeMultiplier={1.3}>
                  {t("home.catClearSearch")}
                </Text>
              </PressableScale>
            </View>
          ) : (
            renderSearch()
          )
        ) : !listings ? (
          <SkeletonList />
        ) : (
          renderBrowse()
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: { paddingHorizontal: SCREEN_PADDING },
  centered: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  content: { padding: SCREEN_PADDING, paddingBottom: 48 },
  hero: {
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  heroTitle: { fontSize: 24, fontWeight: "800", fontFamily: "Roboto", color: "#fff", textBreakStrategy: "simple" },
  heroIntro: { fontSize: 14, lineHeight: 20, fontWeight: "500", fontFamily: "Roboto", color: "rgba(255,255,255,0.85)", marginTop: 4 },
  switch: { marginTop: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Roboto", paddingVertical: 0 },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12, gap: 12 },
  listHeadText: { flex: 1, marginBottom: 0 },
  viewToggle: { flexDirection: "row", borderRadius: 12, padding: 3 },
  viewSegment: { width: 44, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  viewSegmentOn: { elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.12, shadowRadius: 2 },
  cardGroup: { marginBottom: 14 },
  cardSubs: { marginLeft: 12, paddingTop: 10, gap: 8 },
  bigCard: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 96, borderRadius: 20, borderWidth: 2, padding: 14 },
  coinLarge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  bigName: { fontSize: 17, fontWeight: "800", fontFamily: "Roboto", lineHeight: 22, textBreakStrategy: "simple" },
  bigCount: { fontSize: 12.5, fontWeight: "700", fontFamily: "Roboto", marginTop: 2 },
  subCard: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, borderRadius: 16, borderWidth: 1, paddingRight: 14, overflow: "hidden" },
  accentStrip: { width: 5, alignSelf: "stretch" },
  subCardTitle: { fontSize: 15.5, fontWeight: "700", fontFamily: "Roboto", lineHeight: 20, textBreakStrategy: "simple" },
  subCardMeta: { fontSize: 12.5, fontWeight: "600", fontFamily: "Roboto", marginTop: 2 },
  gridBlock: { marginBottom: GAP },
  tileRow: { flexDirection: "row", gap: GAP },
  tile: { minHeight: 148, borderRadius: 18, borderWidth: 2, padding: 12, justifyContent: "space-between" },
  tileTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  coinSmall: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  tileName: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto", lineHeight: 18, textBreakStrategy: "simple" },
  tileMeta: { fontSize: 12, fontWeight: "500", fontFamily: "Roboto", marginTop: 4 },
  tileCount: { fontSize: 12, fontWeight: "700", fontFamily: "Roboto", marginTop: 2 },
  panel: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 12, borderRadius: 18, marginTop: 10 },
  subTile: { minHeight: 84, borderRadius: 14, borderWidth: 1, padding: 12, justifyContent: "space-between" },
  subTileTitle: { fontSize: 13.5, fontWeight: "600", fontFamily: "Roboto", lineHeight: 18, textBreakStrategy: "simple" },
  subTileMeta: { fontSize: 12, fontWeight: "700", fontFamily: "Roboto", marginTop: 6 },
  levelBlock: { marginTop: 24 },
  label: { fontSize: 13, fontWeight: "700", fontFamily: "Roboto", letterSpacing: 0.3, marginBottom: 8 },
  treeLabel: { marginTop: 22, marginBottom: 12 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBtn: { minHeight: 44, paddingHorizontal: 20, borderRadius: 22, borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginTop: 16 },
  emptyBtnText: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto" },
  chipText: { fontSize: 14, fontWeight: "600", fontFamily: "Roboto" },
  group: { marginBottom: 10 },
  groupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  coin: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  groupText: { flex: 1 },
  groupName: { fontSize: 15.5, fontWeight: "700", fontFamily: "Roboto", lineHeight: 20, textBreakStrategy: "simple" },
  groupMeta: { fontSize: 12.5, fontWeight: "500", fontFamily: "Roboto", marginTop: 2 },
  tree: { marginLeft: RAIL_INSET, marginTop: 0, paddingTop: 10 },
  branchWrap: { flexDirection: "row" },
  branchGap: { paddingBottom: 8 },
  branchGutter: { width: BRANCH_WIDTH + RAIL, alignSelf: "stretch" },
  rail: { position: "absolute", left: 0, width: RAIL, opacity: 0.45 },
  branch: { position: "absolute", left: RAIL, top: ROW_MID, width: BRANCH_WIDTH, height: RAIL, opacity: 0.45 },
  branchBody: { flex: 1 },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  subText: { flex: 1 },
  subTitle: { fontSize: 14.5, fontWeight: "600", fontFamily: "Roboto", lineHeight: 19, textBreakStrategy: "simple" },
  subCount: { fontSize: 12.5, fontWeight: "700", fontFamily: "Roboto" },
  emptyWrap: { alignItems: "center", paddingVertical: 36, gap: 10 },
  empty: { fontSize: 14, fontFamily: "Roboto", textAlign: "center" },
});
