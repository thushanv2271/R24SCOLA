import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import LoaderModal from "../components/ui/LoaderModal";
import Avatar from "../components/ui/Avatar";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { useInterest } from "../components/InterestContext";
import ExploreSwitch from "../components/ui/ExploreSwitch";
import { communityAPI } from "../services/apiService";
import { KIND_COMPANY, KIND_UNIVERSITY, getGroupNames } from "../constants/categories";

const formatRelativeDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const StarRow = ({ value, size = 14 }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Ionicons
        key={n}
        name={n <= Math.round(value) ? "star" : "star-outline"}
        size={size}
        color="#f59e0b"
      />
    ))}
  </View>
);

const CategoryChip = ({ label, selected, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity hitSlop={{ top: 7, bottom: 7, left: 6, right: 6 }}
      style={[
        styles.categoryChip,
        { backgroundColor: colors.surface, borderColor: colors.border },
        selected && [styles.categoryChipSelected, { backgroundColor: colors.accent, borderColor: colors.accent }],
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.categoryChipText,
          { color: colors.textSecondary },
          selected && styles.categoryChipTextSelected,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const PostCard = React.memo(({ post, isJob, onPress, onMessageAuthor, currentUsername }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  return (
  <TouchableOpacity style={[styles.postCard, { backgroundColor: colors.surface }]} activeOpacity={0.85} onPress={onPress}>
    <View style={styles.postHeaderRow}>
      <Avatar name={post.authorUsername} size={38} />
      <View style={styles.postHeaderText}>
        <Text style={[styles.postAuthor, { color: colors.textPrimary }]} numberOfLines={1}>
          @{post.authorUsername}
        </Text>
        <Text style={[styles.postDate, { color: colors.textMuted }]}>
          {formatRelativeDate(post.createdAt)}
          {!!post.editedAt && ` · ${t("community.edited")}`}
        </Text>
      </View>
      {post.gotIt && (
        <View style={styles.gotItBadge}>
          <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
          <Text style={styles.gotItBadgeText}>{isJob ? t("community.gotTheJob") : t("community.gotIn")}</Text>
        </View>
      )}
    </View>

    <Text style={[styles.postTitle, { color: colors.textPrimary }]} numberOfLines={2}>
      {post.title}
    </Text>
    {!!post.targetName && (
      <View style={styles.postTargetRow}>
        <Ionicons name={isJob ? "briefcase-outline" : "school-outline"} size={13} color={colors.accent} />
        <Text style={[styles.postTarget, { color: colors.accent }]} numberOfLines={1}>
          {post.targetName}
        </Text>
      </View>
    )}
    <Text style={[styles.postContent, { color: colors.textSecondary }]} numberOfLines={3}>
      {post.content}
    </Text>
    {post.images?.length > 0 && (
      <View style={styles.postImageRow}>
        {post.images.slice(0, 3).map((uri, index, arr) => (
          <View key={`${uri}-${index}`} style={styles.postImageWrap}>
            <Image source={{ uri }} style={styles.postImageThumb} />
            {index === arr.length - 1 && post.images.length > 3 && (
              <View style={styles.postImageMoreOverlay}>
                <Text style={styles.postImageMoreText}>+{post.images.length - 3}</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    )}

    <View style={[styles.postFooterRow, { borderTopColor: colors.divider }]}>
      <View style={styles.postFooterLeft}>
        {post.ratingCount > 0 ? (
          <>
            <StarRow value={post.averageRating} />
            <Text style={[styles.postRatingCount, { color: colors.textMuted }]}>({post.ratingCount})</Text>
          </>
        ) : (
          <Text style={[styles.postNoRating, { color: colors.textMuted }]}>{t("community.noRatingsYet")}</Text>
        )}
        {!!post.category && (
          <View style={[styles.postCategoryTag, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.postCategoryTagText, { color: colors.textSecondary }]} numberOfLines={1}>
              {post.category}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.postFooterRight}>
        <View style={styles.postCommentCount}>
          <Ionicons name="chatbubble-outline" size={14} color={colors.textMuted} />
          <Text style={[styles.postCommentCountText, { color: colors.textMuted }]}>{post.commentCount}</Text>
        </View>
        {post.authorUsername !== currentUsername && (
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: colors.accentLight }]}
            onPress={(e) => {
              e.stopPropagation?.();
              onMessageAuthor(post.authorUsername);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  </TouchableOpacity>
  );
});

export default function CommunityScreen() {
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [chosenTab, setSelectedTab] = useState("university");
  // With a single interest, the feed is pinned to that side (no switch).
  const { isBoth, showUniversities } = useInterest();
  const selectedTab = isBoth ? chosenTab : showUniversities ? "university" : "job";
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = useCallback(
    async (targetPage, append) => {
      try {
        const data = await communityAPI.getPosts(selectedTab, {
          category: selectedCategory,
          page: targetPage,
        });
        setPosts((prev) => (append ? [...prev, ...(data?.posts || [])] : data?.posts || []));
        setHasMore(!!data?.hasMore);
        setPage(targetPage);
      } catch (error) {
        console.error("Error loading community posts:", error);
        if (!append) setPosts([]);
      }
    },
    [selectedTab, selectedCategory],
  );

  useEffect(() => {
    setLoading(true);
    loadPosts(0, false).finally(() => setLoading(false));
  }, [loadPosts]);

  useFocusEffect(
    useCallback(() => {
      loadPosts(0, false);
    }, [loadPosts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPosts(0, false);
    setRefreshing(false);
  };

  const onLoadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadPosts(page + 1, true);
    setLoadingMore(false);
  };

  const goToMessage = async (username) => {
    router.push({ pathname: "/Chat", params: { username } });
  };

  const isJob = selectedTab === "job";

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        onMenuPress={() => setMenuVisible(true)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <LinearGradient
        colors={["#004aad", "#0d64c8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroIconWrap}>
          <Ionicons name="people" size={22} color="#fff" />
        </View>
        <View style={styles.heroTextWrap}>
          <Text style={styles.heroTitle}>{t("community.heroTitle")}</Text>
          <Text style={styles.heroSubtitle}>{t("community.heroSubtitle")}</Text>
        </View>
      </LinearGradient>

      <View style={styles.tabRow}>
        <Text style={[styles.tabRowLabel, { color: colors.textPrimary }]}>{isJob ? t("community.jobs") : t("community.universities")}</Text>
        {isBoth && (
          <ExploreSwitch
            value={selectedTab}
            onChange={(tab) => {
              setSelectedTab(tab);
              setSelectedCategory(null);
            }}
            sides={["university", "job"]}
            labels={{ university: t("community.universities"), job: t("community.jobs") }}
          />
        )}
      </View>

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={getGroupNames(isJob ? KIND_COMPANY : KIND_UNIVERSITY)}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.categoryRow}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <CategoryChip
            label={item}
            selected={selectedCategory === item}
            onPress={() => setSelectedCategory(selectedCategory === item ? null : item)}
          />
        )}
      />

      {loading ? (
        <LoaderModal />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isJob={isJob}
              currentUsername={user?.username}
              onPress={() => router.push({ pathname: "/CommunityPostDetail", params: { id: item.id } })}
              onMessageAuthor={goToMessage}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#004aad" />
          }
          onEndReachedThreshold={0.4}
          onEndReached={onLoadMore}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons
                name={isJob ? "briefcase-outline" : "school-outline"}
                size={44}
                color={colors.textMuted}
              />
              <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>
                {t(isJob ? "community.noJobPostsYet" : "community.noUniversityPostsYet")}
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textMuted }]}>
                {t("community.beFirstToShare")}{selectedCategory ? ` in ${selectedCategory}` : ""}.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() =>
          router.push({ pathname: "/CreateCommunityPost", params: { type: selectedTab } })
        }
        accessibilityLabel="Create a new post"
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    gap: 14,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 15.5,
    fontWeight: "800",
    color: "#fff",
    fontFamily: "Roboto",
  },
  heroSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Roboto",
    marginTop: 2,
    lineHeight: 16,
  },
  tabRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 14,
  },
  tabRowLabel: {
    fontSize: 18,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: "#111827",
  },
  categoryList: {
    // A horizontal FlatList/ScrollView doesn't auto-size its own cross-axis
    // height to its content the way a plain flex View does — without an
    // explicit height here, the chips' own rendered content can get clipped
    // by the scroll container's collapsed bounding box.
    height: 44,
    marginTop: 10,
    flexGrow: 0,
  },
  categoryRow: {
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  categoryChipSelected: {
    backgroundColor: "#004aad",
    borderColor: "#004aad",
  },
  categoryChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#666",
  },
  categoryChipTextSelected: {
    color: "#fff",
  },
  listContent: {
    padding: 12,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  postAuthor: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  postDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    marginTop: 1,
  },
  gotItBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  gotItBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
    fontFamily: "Roboto",
  },
  postTitle: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
    marginTop: 8,
  },
  postTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  postTarget: {
    fontSize: 12.5,
    color: "#004aad",
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  postContent: {
    fontSize: 13.5,
    color: "#475569",
    fontFamily: "Roboto",
    lineHeight: 18.5,
    marginTop: 5,
  },
  postImageRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },
  // flex:1 per image makes them share the card's full width evenly — one
  // image fills the whole row, two split it in half, three in thirds —
  // instead of small fixed-size squares floating in a mostly-empty row.
  postImageWrap: {
    flex: 1,
    aspectRatio: 1.4,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
  },
  postImageThumb: {
    width: "100%",
    height: "100%",
  },
  postImageMoreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  postImageMoreText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Roboto",
  },
  postFooterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  postFooterLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  postNoRating: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    fontStyle: "italic",
  },
  starRow: {
    flexDirection: "row",
    gap: 1,
  },
  postRatingCount: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
  },
  postCategoryTag: {
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  postCategoryTagText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  postFooterRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  postCommentCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  postCommentCountText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Roboto",
  },
  messageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 30,
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    fontFamily: "Roboto",
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: "#94a3b8",
    fontFamily: "Roboto",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#004aad",
    elevation: 6,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
});
