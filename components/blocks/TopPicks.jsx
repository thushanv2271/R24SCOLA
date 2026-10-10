import React, { useContext, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import SectionHeader from "../ui/SectionHeader";

const PICKS_PER_LIST = 6;
const CARD_WIDTH = 236;
const CARD_GAP = 12;
const SCREEN_PADDING = 16;

// Words that say nothing about the subject on their own.
const STOP_WORDS = new Set(["and", "of", "the", "in", "for", "with", "science", "sciences", "studies", "study", "degree", "bsc", "msc", "ba", "ma"]);

// Everyday field names -> the wording listings use (see constants/categories).
const SYNONYMS = {
  it: "computer", software: "computer", computing: "computer", informatics: "computer",
  ai: "computer", data: "computer", cyber: "computer", programming: "computer",
  mechanical: "engineering", civil: "engineering", electrical: "engineering",
  electronic: "engineering", electronics: "engineering", chemical: "engineering",
  medicine: "health", medical: "health", nursing: "health", pharmacy: "health",
  dentistry: "health", biology: "health", biomedical: "health", public: "health",
  management: "business", finance: "business", accounting: "business",
  commerce: "business", marketing: "business", economics: "business", economy: "business",
  math: "mathematics", maths: "mathematics", statistics: "mathematics",
  chem: "chemistry", physical: "physics", natural: "natural", environmental: "natural",
  geology: "natural", agriculture: "natural",
};

// Which listing levels suit each stage of education (current or next step).
const LEVEL_TARGETS = {
  high_school: [/bachelor/, /undergrad/, /diploma/, /foundation/],
  undergraduate: [/bachelor/, /undergrad/, /master/],
  graduate: [/master/, /\bgraduate\b/, /postgrad/],
  postgraduate: [/ph\.?d/, /doctor/, /postdoc/, /research/],
};

const fieldKeywords = (fieldOfStudy) => {
  const words = (fieldOfStudy || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  const out = new Set();
  words.forEach((w) => {
    if (w.length >= 3) out.add(w);
    if (SYNONYMS[w]) out.add(SYNONYMS[w]);
  });
  return [...out];
};

const isCompany = (item) => item.listingKind === "company";

// Higher = better fit. Field of study counts most, then education level.
export const scoreListing = (item, keywords, levelKey, withLevel) => {
  let score = 0;
  const major = `${item.subcategory || item.major || ""} ${item.category || ""}`.toLowerCase();
  const title = `${item.title || ""} ${item.university || ""}`.toLowerCase();
  keywords.forEach((k) => {
    if (major.includes(k)) score += 3;
    if (title.includes(k)) score += 1;
  });
  if (withLevel) {
    const level = (item.level || "").toLowerCase();
    if ((LEVEL_TARGETS[levelKey] || []).some((re) => re.test(level))) score += 2;
  }
  return score;
};

const pickTop = (items, keywords, levelKey, withLevel) => {
  const ranked = items
    .filter((item) => item.id && item.title)
    .map((item) => ({
      item,
      score: scoreListing(item, keywords, levelKey, withLevel),
      image: item.images?.[0] ? 1 : 0,
      time: new Date(item.createdAt || 0).getTime() || 0,
    }))
    .sort((a, b) => b.score - a.score || b.time - a.time || b.image - a.image);
  const top = ranked.slice(0, PICKS_PER_LIST);
  return {
    picks: top.map((r) => r.item),
    matchedIds: new Set(top.filter((r) => r.score > 0).map((r) => r.item.id)),
    matched: ranked[0]?.score > 0,
  };
};

const PickCard = ({ item, kind, isMatch, onPress, colors, t }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const isUni = kind === "universities";
  const hasFunding = isUni && !!item.funding;
  const tags = [hasFunding ? t("ui.card.tagFunding", { funding: item.funding }) : null, item.country].filter(Boolean);
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={() => onPress(item)}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.university || ""}`}
    >
      <View style={styles.cover}>
        {item.images?.[0] && !imageFailed ? (
          <Image source={{ uri: item.images[0] }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" onError={() => setImageFailed(true)} />
        ) : (
          <LinearGradient
            colors={isUni ? [colors.accent, "#0d64c8"] : ["#0f766e", "#14b8a6"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.coverFallback]}
          >
            <Ionicons name={isUni ? "school" : "business"} size={56} color="rgba(255,255,255,0.35)" />
          </LinearGradient>
        )}
        <LinearGradient colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.45)"]} style={styles.coverShade} pointerEvents="none" />
        {isMatch && (
          <View style={[styles.matchBadge, { backgroundColor: colors.surface }]}>
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <Text style={[styles.matchText, { color: colors.accent }]} numberOfLines={1}>
              {t("home.topPicksMatch")}
            </Text>
          </View>
        )}
        <View style={styles.typeBadge}>
          <Ionicons name={isUni ? "school" : "briefcase"} size={14} color="#fff" />
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={3}>
          {item.title}
        </Text>
        {!!item.university && (
          <Text style={[styles.cardSub, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.university}
          </Text>
        )}
        <View style={styles.tags}>
          {tags.map((tag, i) => (
            <Text
              key={`${i}-${tag}`}
              numberOfLines={1}
              style={[
                styles.tag,
                i === 0 && hasFunding
                  ? { color: colors.accent, backgroundColor: colors.accentLight }
                  : { color: colors.textSecondary, backgroundColor: colors.surfaceAlt },
              ]}
            >
              {tag}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SkeletonCards = ({ colors }) => (
  <View style={styles.skelRow}>
    {[0, 1].map((i) => (
      <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.cover, { backgroundColor: colors.surfaceAlt }]} />
        <View style={styles.cardBody}>
          <View style={[styles.skelLine, { width: "80%", backgroundColor: colors.surfaceAlt }]} />
          <View style={[styles.skelLine, { width: "50%", backgroundColor: colors.surfaceAlt, marginTop: 8 }]} />
        </View>
      </View>
    ))}
  </View>
);

const Separator = () => <View style={{ width: CARD_GAP }} />;

// Show recent listings until enough profile details exist to personalise them.
const TopPicks = ({ user, kind, listings, error, onRetry, onSeeAll, onOpen }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const ready = !!(user?.educationLevel && user?.fieldOfStudy?.trim());

  const result = useMemo(() => {
    if (!listings) return null;
    const keywords = ready ? fieldKeywords(user.fieldOfStudy) : [];
    const universities = pickTop(listings.filter((i) => !isCompany(i)), keywords, user?.educationLevel, ready);
    const companies = pickTop(listings.filter(isCompany), keywords, user?.educationLevel, false);
    return { universities, companies };
  }, [ready, listings, user?.fieldOfStudy, user?.educationLevel]);

  const current = result ? result[kind] : null;
  const matched = !!current && current.matched;

  return (
    <View style={styles.section}>
      <SectionHeader
        icon={<Ionicons name="sparkles" size={22} color={colors.accent} />}
        title={t(ready ? "home.topPicksTitle" : "home.latestTitle")}
        actionLabel={result ? t("home.seeAll") : undefined}
        onActionPress={result ? () => onSeeAll(kind) : undefined}
        style={styles.sectionHeader}
      />
      {result && (
        <Text style={[styles.basis, { color: colors.textSecondary }]}>
          {t(matched ? "home.topPicksBasis" : "home.topPicksLatest")}
        </Text>
      )}

      {error && (
        <TouchableOpacity style={[styles.notice, { backgroundColor: colors.surfaceAlt }]} onPress={onRetry}
          accessibilityRole="button" accessibilityLabel={t("home.listingsRetry")}>
          <Ionicons name="refresh-outline" size={20} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{t("home.listingsRetry")}</Text>
        </TouchableOpacity>
      )}
      {!current && !error ? (
        <SkeletonCards colors={colors} />
      ) : !current ? null : !current.picks.length ? (
        <View style={[styles.notice, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name={kind === "companies" ? "briefcase-outline" : "school-outline"} size={24} color={colors.accent} />
          <Text style={[styles.noticeText, { color: colors.textSecondary }]}>{t("home.listingsEmpty")}</Text>
        </View>
      ) : (
        <FlatList
          key={kind}
          horizontal
          data={current.picks}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + CARD_GAP}
          decelerationRate="fast"
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
          ItemSeparatorComponent={Separator}
          renderItem={({ item }) => (
            <PickCard
              key={`${item.id}-${item.images?.[0] || "none"}`}
              item={item}
              kind={kind}
              isMatch={current.matchedIds.has(item.id)}
              onPress={(picked) => onOpen(kind, picked)}
              colors={colors}
              t={t}
            />
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    paddingHorizontal: 0,
    marginBottom: 4,
  },
  basis: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 34,

    marginBottom: 12,
    textBreakStrategy: "simple",
  },
  carousel: {
    marginHorizontal: -SCREEN_PADDING,
  },
  carouselContent: {
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 8,
  },
  skelRow: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  cover: {
    height: 128,
    width: "100%",
  },
  coverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  coverShade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  matchBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 9,
    height: 24,
    borderRadius: 12,
    maxWidth: CARD_WIDTH - 70,
  },
  matchText: {
    fontSize: 12,
    fontWeight: "700",

  },
  typeBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: {
    padding: 16,
    minHeight: 104,
  },
  cardTitle: {
    fontSize: 16,
    lineHeight: 23,
    fontWeight: "700",

    textBreakStrategy: "simple",
  },
  cardSub: {
    fontSize: 14,
    lineHeight: 20,

    marginTop: 2,
    textBreakStrategy: "simple",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  tag: {
    fontSize: 12,
    fontWeight: "600",

    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: "hidden",
    maxWidth: 160,
  },
  skelLine: {
    height: 10,
    borderRadius: 5,
  },
  notice: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, padding: 16, borderRadius: 16, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 14, lineHeight: 21 },
});

export default TopPicks;
