import React, { useContext, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import SectionHeader from "../ui/SectionHeader";
import SkeletonBlock from "../ui/SkeletonBlock";
import { PressableScale, haptic } from "../ui/motion";
import { KIND_COMPANY, KIND_UNIVERSITY, getCategories } from "../../constants/categories";
import { categoryLook } from "../../constants/categoryColors";

const CARD_GAP = 10;
const SCREEN_PADDING = 16;
const PER_ROW = 4; // categories visible at once; the row scrolls for the rest
const MAX_CONTENT_WIDTH = 760; // matches Home's list container

// Four cards exactly fill the width between the page gutters, so there is no
// leftover white space on the right; the tile scales with the card.
const useCardSize = () => {
  const { width } = useWindowDimensions();
  const container = Math.min(width, MAX_CONTENT_WIDTH);
  const cardWidth = Math.floor((container - SCREEN_PADDING * 2 - CARD_GAP * (PER_ROW - 1)) / PER_ROW);
  const tile = Math.max(52, Math.min(cardWidth - 8, 76));
  return { cardWidth, tile, iconSize: Math.round(tile * 0.47) };
};

// Everyday field names -> words that appear in category/subcategory names.
const FIELD_HINTS = {
  it: ["computer", "software", "computing"], software: ["software", "computer"],
  computing: ["computer", "computing"], informatics: ["computer", "information"],
  programming: ["software", "computer"], ai: ["data", "computer"], data: ["data", "computer"],
  cyber: ["cybersecurity"], mechanical: ["engineering"], civil: ["engineering"],
  electrical: ["engineering"], electronic: ["engineering"], electronics: ["engineering"],
  chemical: ["engineering", "chemistry"], medicine: ["health", "medicine"], medical: ["health", "medicine"],
  nursing: ["health", "nursing"], pharmacy: ["health", "pharmacy"], dentistry: ["health"],
  biomedical: ["health"], management: ["business", "management"], finance: ["business", "finance"],
  accounting: ["business", "accounting"], commerce: ["business"], marketing: ["marketing", "business"],
  economics: ["economics", "business"], math: ["mathematics"], maths: ["mathematics"],
  statistics: ["mathematics", "statistics"], design: ["design"], law: ["law", "social"],
  education: ["education", "social"], psychology: ["social"], art: ["arts", "humanities"],
};

const STOP_WORDS = new Set(["and", "of", "the", "in", "for", "with", "studies", "study", "degree"]);

// Best-matching category group for the user's field of study, or null.
const matchCategory = (groups, fieldOfStudy) => {
  const words = (fieldOfStudy || "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  if (!words.length) return null;
  const needles = new Set();
  words.forEach((w) => {
    if (w.length >= 4) needles.add(w);
    (FIELD_HINTS[w] || []).forEach((h) => needles.add(h));
  });
  let best = null;
  let bestScore = 0;
  groups.forEach((group) => {
    const hay = `${group.name} ${group.subcategories.join(" ")}`.toLowerCase();
    let score = 0;
    needles.forEach((n) => {
      if (hay.includes(n)) score += group.name.toLowerCase().includes(n) ? 2 : 1;
    });
    if (score > bestScore) {
      best = group.name;
      bestScore = score;
    }
  });
  return best;
};

const CategoryCard = ({ item, isDark, colors, t, onPress, size }) => {
  const look = categoryLook(item.name, isDark);
  return (
    <PressableScale
      scaleTo={0.94}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.forYou ? `, ${t("home.forYou")}` : ""}`}
      style={{ width: size.cardWidth, alignItems: "center" }}
    >
      <View style={[styles.tile, { width: size.tile, height: size.tile, borderRadius: Math.round(size.tile * 0.3), backgroundColor: look.solid }]}>
        <Ionicons name={look.outline} size={size.iconSize} color="#fff" />
        {item.forYou && (
          <View style={[styles.forYou, { backgroundColor: colors.surface, borderColor: look.solid }]}>
            <Ionicons name="star" size={11} color={look.solid} />
          </View>
        )}
      </View>
      <Text style={[styles.cardName, { color: colors.textPrimary }]}>
        {item.name}
      </Text>
    </PressableScale>
  );
};

const Separator = () => <View style={{ width: CARD_GAP }} />;

const SkeletonRow = ({ size }) => (
  <View style={styles.skelRow}>
    {[0, 1, 2, 3].map((i) => (
      <SkeletonBlock key={i} style={{ width: size.cardWidth, height: size.tile + 52, borderRadius: 22 }} />
    ))}
  </View>
);

// "Browse by category": switch between universities and jobs, then jump
// straight into Explore with that category already selected.
const CategoryBrowse = ({ user, kind, listings, error, onOpen, onSeeAll }) => {
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const size = useCardSize();

  const cards = useMemo(() => {
    if (!listings && !error) return null;
    const listingKind = kind === "companies" ? KIND_COMPANY : KIND_UNIVERSITY;
    const groups = getCategories(listingKind);
    const counts = new Map();
    (listings || []).forEach((item) => {
      if (item.listingKind === listingKind) counts.set(item.category, (counts.get(item.category) || 0) + 1);
    });
    const mine = matchCategory(groups, user?.fieldOfStudy);
    const all = groups.map((group) => ({
      name: group.name,
      count: listings ? counts.get(group.name) || 0 : null,
      forYou: group.name === mine,
    }));
    const rank = (c) => (c.forYou ? 0 : c.count > 0 ? 1 : 2);
    return all
      .map((c, index) => ({ c, index }))
      .sort((a, b) => rank(a.c) - rank(b.c) || a.index - b.index)
      .map(({ c }) => c);
  }, [listings, error, kind, user?.fieldOfStudy]);

  return (
    <View style={styles.section}>
      <SectionHeader
        icon={<Ionicons name="grid" size={22} color={colors.accent} />}
        title={t("home.browseTitle")}
        actionLabel={t("home.seeAll")}
        onActionPress={() => onSeeAll(kind)}
        style={styles.sectionHeader}
      />
      {!cards ? (
        <SkeletonRow size={size} />
      ) : (
        <FlatList
          key={kind}
          horizontal
          data={cards}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={size.cardWidth + CARD_GAP}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              isDark={isDark}
              colors={colors}
              t={t}
              size={size}
              onPress={() => {
                haptic("select");
                onOpen(kind, item.name);
              }}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  sectionHeader: { paddingHorizontal: 0 },
  carousel: { marginHorizontal: -SCREEN_PADDING },
  carouselContent: { paddingHorizontal: SCREEN_PADDING, paddingTop: 8 },
  tile: {
    alignItems: "center",
    justifyContent: "center",
  },
  cardName: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
    textAlign: "center",
    marginTop: 8,
    minHeight: 32,
    textBreakStrategy: "simple",
  },
  forYou: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  skelRow: { flexDirection: "row", gap: CARD_GAP },
});

export default CategoryBrowse;
