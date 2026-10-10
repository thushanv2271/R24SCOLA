import React, { useCallback, useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import ScreenHeader from "../components/blocks/ScreenHeader";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import LoaderModal from "../components/ui/LoaderModal";
import AlertModal from "../components/AlertModal";
import Avatar from "../components/ui/Avatar";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { communityAPI } from "../services/apiService";

const formatRelativeDate = (iso, t) => {
  if (!iso) return "";
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t("ui.post.justNow");
  if (diffMin < 60) return t("ui.post.minutesAgo", { n: diffMin });
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return t("ui.post.hoursAgo", { n: diffHr });
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return t("ui.post.daysAgo", { n: diffDay });
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const CommentRow = ({ comment }) => {
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);
  return (
    <View style={styles.commentRow}>
      <Avatar name={comment.authorUsername} size={30} />
      <View style={[styles.commentBody, { backgroundColor: colors.surface }]}>
        <View style={styles.commentHeaderRow}>
          <Text style={[styles.commentAuthor, { color: colors.textPrimary }]}>@{comment.authorUsername}</Text>
          <Text style={[styles.commentDate, { color: colors.textMuted }]}>
            {formatRelativeDate(comment.createdAt, t)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: colors.textSecondary }]}>{comment.text}</Text>
      </View>
    </View>
  );
};

export default function CommunityPostDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [rating, setRating] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  const load = useCallback(async () => {
    try {
      const [postData, commentsData, viewData] = await Promise.all([
        communityAPI.getPost(id),
        communityAPI.getComments(id),
        communityAPI.recordPostView(id),
      ]);
      setPost({ ...postData, viewCount: viewData?.viewCount ?? postData.viewCount ?? 0 });
      setComments(commentsData?.comments || []);
    } catch (error) {
      console.error("Error loading post:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleRate = async (value) => {
    if (rating) return;
    setRating(true);
    try {
      const updated = await communityAPI.ratePost(id, value);
      setPost(updated);
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("ui.post.ratingFailed"), "error");
    } finally {
      setRating(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const comment = await communityAPI.addComment(id, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setPost((prev) => (prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev));
      setCommentText("");
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("ui.post.commentFailed"), "error");
    } finally {
      setPosting(false);
    }
  };

  const handleMessageAuthor = () => {
    if (!post) return;
    router.push({ pathname: "/Chat", params: { username: post.authorUsername } });
  };

  const handleDelete = () => {
    showAlert(t("ui.post.deleteTitle"), t("ui.post.deleteMessage"), "warning");
  };

  const confirmDelete = async () => {
    try {
      await communityAPI.deletePost(id);
      router.back();
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("ui.post.deleteFailed"), "error");
    }
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  const isJob = post.type === "job";
  const isOwnPost = post.authorUsername === user?.username;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={isJob ? t("ui.post.jobPost") : t("ui.post.universityPost")}
        icons={
          isOwnPost
            ? [
                {
                  key: "edit",
                  name: "pencil-outline",
                  onPress: () =>
                    router.push({ pathname: "/CreateCommunityPost", params: { editId: post.id } }),
                  accessibilityLabel: t("common.edit"),
                },
                {
                  key: "delete",
                  name: "trash-outline",
                  onPress: handleDelete,
                  accessibilityLabel: t("common.delete"),
                },
              ]
            : []
        }
      />

      <KeyboardSafe>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CommentRow comment={item} />}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View>
              <View style={styles.postHeaderRow}>
                <Avatar name={post.authorUsername} size={44} />
                <View style={styles.postHeaderText}>
                  <Text style={[styles.postAuthor, { color: colors.textPrimary }]}>@{post.authorUsername}</Text>
                  <Text style={[styles.postDate, { color: colors.textMuted }]}>
                    {formatRelativeDate(post.createdAt, t)}
                    {!!post.editedAt && ` · ${t("community.edited")}`}
                  </Text>
                </View>
                {post.gotIt && (
                  <View style={[styles.gotItBadge, { backgroundColor: colors.successLight }]}>
                    <Ionicons name="checkmark-circle" size={13} color={colors.success} />
                    <Text style={[styles.gotItBadgeText, { color: colors.success }]}>
                      {isJob ? t("community.gotTheJob") : t("community.gotIn")}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.postTitle, { color: colors.textPrimary }]}>{post.title}</Text>
              {!!post.targetName && (
                <View style={styles.postTargetRow}>
                  <Ionicons name={isJob ? "briefcase-outline" : "school-outline"} size={14} color={colors.accent} />
                  <Text style={[styles.postTarget, { color: colors.accent }]}>{post.targetName}</Text>
                  {!!post.category && (
                    <View style={[styles.postCategoryTag, { backgroundColor: colors.surfaceAlt }]}>
                      <Text style={[styles.postCategoryTagText, { color: colors.textSecondary }]}>{post.category}</Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.postContent, { color: colors.textPrimary }]}>{post.content}</Text>

              {post.images?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
                  {post.images.map((uri, index) => (
                    <Image key={`${uri}-${index}`} source={{ uri }} style={styles.image} />
                  ))}
                </ScrollView>
              )}

              <View style={[styles.ratingCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.ratingCardTitle, { color: colors.textPrimary }]}>
                  {post.myRating ? t("ui.post.yourRating") : t("ui.post.rateThis")}
                </Text>
                <View style={styles.ratingStarsRow}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <TouchableOpacity
                      key={n}
                      onPress={() => handleRate(n)}
                      disabled={rating}
                      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={t("ui.post.rateStar", { n })}
                      accessibilityState={{ selected: n <= (post.myRating || 0) }}
                    >
                      <Ionicons
                        name={n <= (post.myRating || 0) ? "star" : "star-outline"}
                        size={28}
                        color="#f59e0b"
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={[styles.ratingSummary, { color: colors.textMuted }]}>
                  {post.averageRating > 0
                    ? t("ui.post.ratingSummary", { avg: post.averageRating, count: post.ratingCount })
                    : t("community.noRatingsYet")}
                </Text>
              </View>

              {!isOwnPost && (
                <TouchableOpacity
                  style={[styles.messageAuthorButton, { backgroundColor: colors.accentLight }]}
                  onPress={handleMessageAuthor}
                  accessibilityRole="button"
                >
                  <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.accent} />
                  <Text style={[styles.messageAuthorButtonText, { color: colors.accent }]}>
                    {t("ui.post.messageAuthor", { username: post.authorUsername })}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.commentsTitle, { color: colors.textPrimary }]}>
                {t("ui.post.comments")} {comments.length > 0 ? `(${comments.length})` : ""}
              </Text>
            </View>
          }
          ListEmptyComponent={
            <Text style={[styles.noComments, { color: colors.textMuted }]}>{t("ui.post.noComments")}</Text>
          }
        />

        <View
          style={[
            styles.commentInputRow,
            { backgroundColor: colors.surface, borderTopColor: colors.border },
          ]}
        >
          <TextInput
            style={[
              styles.commentInput,
              { backgroundColor: colors.surfaceAlt, color: colors.textPrimary },
            ]}
            value={commentText}
            onChangeText={setCommentText}
            placeholder={t("ui.post.addComment")}
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendCommentButton, (!commentText.trim() || posting) && styles.sendCommentButtonDisabled]}
            onPress={handleAddComment}
            disabled={!commentText.trim() || posting}
            accessibilityRole="button"
            accessibilityLabel={t("ui.post.sendComment")}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardSafe>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={
          alertConfig.type === "warning"
            ? [
                { text: t("common.cancel"), onPress: closeAlert, secondary: true },
                { text: t("common.delete"), onPress: () => { closeAlert(); confirmDelete(); }, destructive: true },
              ]
            : [{ text: t("common.ok"), onPress: closeAlert }]
        }
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  listContent: {
    padding: 20,
    paddingBottom: 20,
  },
  postHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  postHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  postAuthor: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  postDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    marginTop: 2,
  },
  gotItBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 12,
  },
  gotItBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#16a34a",
    fontFamily: "Roboto",
  },
  postTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Roboto",
    marginTop: 16,
  },
  postTargetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  postTarget: {
    fontSize: 13.5,
    color: "#004aad",
    fontWeight: "600",
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
  postContent: {
    fontSize: 14.5,
    color: "#334155",
    fontFamily: "Roboto",
    lineHeight: 22,
    marginTop: 14,
  },
  imageRow: {
    marginTop: 14,
  },
  image: {
    width: 180,
    height: 130,
    borderRadius: 14,
    marginRight: 10,
    backgroundColor: "#e2e8f0",
  },
  ratingCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  ratingCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    fontFamily: "Roboto",
  },
  ratingStarsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 8,
  },
  ratingSummary: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    marginTop: 8,
  },
  messageAuthorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eff6ff",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  messageAuthorButtonText: {
    color: "#004aad",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  commentsTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
    marginTop: 24,
    marginBottom: 12,
  },
  noComments: {
    fontSize: 13,
    color: "#94a3b8",
    fontFamily: "Roboto",
    textAlign: "center",
    paddingVertical: 20,
  },
  commentRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  commentBody: {
    flex: 1,
    marginLeft: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
  },
  commentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  commentAuthor: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  commentDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
  },
  commentText: {
    fontSize: 13.5,
    color: "#334155",
    fontFamily: "Roboto",
    marginTop: 4,
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 14,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#111827",
    fontFamily: "Roboto",
    maxHeight: 100,
  },
  sendCommentButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#004aad",
    justifyContent: "center",
    alignItems: "center",
  },
  sendCommentButtonDisabled: {
    opacity: 0.5,
  },
});
