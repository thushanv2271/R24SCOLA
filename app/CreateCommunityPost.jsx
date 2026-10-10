import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import ScreenHeader from "../components/blocks/ScreenHeader";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import AlertModal from "../components/AlertModal";
import LoaderModal from "../components/ui/LoaderModal";
import { AuthContext } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { LanguageContext } from "../components/LanguageContext";
import { communityAPI } from "../services/apiService";
import { KIND_COMPANY, KIND_UNIVERSITY, getGroupNames, groupForValue } from "../constants/categories";

const MAX_TITLE = 150;
const MAX_CONTENT = 4000;

export default function CreateCommunityPost() {
  const params = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const isEditing = !!params.editId;
  const hasLinkedListing = !isEditing && !!params.linkedListingId;

  const [loadingExisting, setLoadingExisting] = useState(isEditing);
  const [isJob, setIsJob] = useState(params.type === "job");
  const [title, setTitle] = useState("");
  const [targetName, setTargetName] = useState(params.linkedTargetName || "");
  const [category, setCategory] = useState(() => {
    const kind = params.type === "job" ? KIND_COMPANY : KIND_UNIVERSITY;
    return (params.linkedCategory && groupForValue(kind, params.linkedCategory)) || getGroupNames(kind)[0];
  });
  const [content, setContent] = useState("");
  const [gotIt, setGotIt] = useState(false);
  const [images, setImages] = useState(
    hasLinkedListing && params.linkedImages ? JSON.parse(params.linkedImages) : [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        const post = await communityAPI.getPost(params.editId);
        setIsJob(post.type === "job");
        setTitle(post.title || "");
        setTargetName(post.targetName || "");
        const postKind = post.type === "job" ? KIND_COMPANY : KIND_UNIVERSITY;
        setCategory((post.category && groupForValue(postKind, post.category)) || getGroupNames(postKind)[0]);
        setContent(post.content || "");
        setGotIt(!!post.gotIt);
        setImages(post.images || []);
      } catch (error) {
        showAlert(t("common.error"), t("alerts.postLoadFailed"), "error");
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [isEditing, params.editId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      showAlert(t("alerts.titleRequiredTitle"), t("alerts.titleRequired"), "error");
      return;
    }
    if (!content.trim()) {
      showAlert(
        t("alerts.detailsRequiredTitle"),
        t(isJob ? "alerts.detailsRequiredJob" : "alerts.detailsRequiredUni"),
        "error",
      );
      return;
    }

    setSubmitting(true);
    try {
      if (isEditing) {
        await communityAPI.updatePost(params.editId, {
          title: title.trim(),
          targetName: targetName.trim(),
          content: content.trim(),
          category,
          gotIt,
        });
        router.replace({ pathname: "/CommunityPostDetail", params: { id: params.editId } });
      } else {
        const post = await communityAPI.createPost({
          type: isJob ? "job" : "university",
          title: title.trim(),
          targetName: targetName.trim(),
          content: content.trim(),
          category,
          gotIt,
          linkedListingId: hasLinkedListing ? params.linkedListingId : undefined,
          linkedListingType: hasLinkedListing ? (isJob ? "job" : "university") : undefined,
          images,
        });
        router.replace({ pathname: "/CommunityPostDetail", params: { id: post.id } });
      }
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("alerts.publishFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return (
      <SafeAreaView style={styles.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={isEditing ? t("createPost.editTitle") : t(isJob ? "createPost.newJobTitle" : "createPost.newUniTitle")}
      />

      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.postingAs}>
            {t("createPost.postingAs")} <Text style={styles.postingAsName}>@{user?.username}</Text>
          </Text>

          {hasLinkedListing && (
            <View style={styles.linkedCard}>
              <Ionicons name={isJob ? "briefcase" : "school"} size={16} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.linkedCardLabel}>
                  {t(isJob ? "createPost.sharingJob" : "createPost.sharingScholarship")}
                </Text>
                <Text style={styles.linkedCardTitle} numberOfLines={1}>
                  {params.linkedTitle}
                </Text>
              </View>
            </View>
          )}

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.imageThumbWrap}>
                  <Image source={{ uri }} style={styles.imageThumb} />
                  <TouchableOpacity hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    style={styles.imageRemoveBtn}
                    onPress={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Ionicons name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <Text style={styles.label}>{t("createPost.titleLabel")}</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder={t(isJob ? "createPost.titlePlaceholderJob" : "createPost.titlePlaceholderUni")}
            placeholderTextColor={colors.textMuted}
            maxLength={MAX_TITLE}
          />

          <Text style={styles.label}>{t(isJob ? "createPost.companyOptional" : "createPost.universityOptional")}</Text>
          <TextInput
            style={styles.input}
            value={targetName}
            onChangeText={setTargetName}
            placeholder={t(isJob ? "createPost.companyPlaceholder" : "createPost.universityPlaceholder")}
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>{t("createPost.category")}</Text>
          <TouchableOpacity
            style={styles.categorySelect}
            onPress={() => setShowCategoryPicker((v) => !v)}
          >
            <Text style={styles.categorySelectText}>{category}</Text>
            <Ionicons
              name={showCategoryPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          {showCategoryPicker && (
            <View style={styles.categoryOptions}>
              {getGroupNames(isJob ? KIND_COMPANY : KIND_UNIVERSITY).map((major) => (
                <TouchableOpacity
                  key={major}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategory(major);
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryOptionText,
                      category === major && styles.categoryOptionTextSelected,
                    ]}
                  >
                    {major}
                  </Text>
                  {category === major && (
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>{t("createPost.experience")}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder={
              t(isJob ? "createPost.experiencePlaceholderJob" : "createPost.experiencePlaceholderUni")
            }
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_CONTENT}
          />
          <Text style={styles.charCount}>{content.length}/{MAX_CONTENT}</Text>

          <View style={styles.gotItRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.gotItLabel}>
                {t(isJob ? "createPost.gotJob" : "createPost.gotAdmitted")}
              </Text>
              <Text style={styles.gotItSubtitle}>
                {t("createPost.gotItHint")}
              </Text>
            </View>
            <Switch
              value={gotIt}
              onValueChange={setGotIt}
              trackColor={{ false: colors.border, true: "#93c5fd" }}
              thumbColor={gotIt ? colors.accent : "#f4f4f5"}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.submitButtonText}>
              {submitting
                ? isEditing
                  ? t("createPost.saving")
                  : t("createPost.posting")
                : isEditing
                  ? t("createPost.saveChanges")
                  : t("createPost.post")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardSafe>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={[{ text: t("common.ok"), onPress: closeAlert }]}
        onClose={closeAlert}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  postingAs: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: "Roboto",
    marginBottom: 18,
  },
  postingAsName: {
    fontWeight: "700",
    color: colors.accent,
  },
  linkedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.accentLight,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  linkedCardLabel: {
    fontSize: 12,
    color: colors.accent,
    fontFamily: "Roboto",
    fontWeight: "700",
  },
  linkedCardTitle: {
    fontSize: 13.5,
    color: colors.textPrimary,
    fontFamily: "Roboto",
    fontWeight: "600",
    marginTop: 2,
  },
  imageRow: {
    marginBottom: 16,
  },
  imageThumbWrap: {
    marginRight: 10,
  },
  imageThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  imageRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.danger,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.screenBackground,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
    fontFamily: "Roboto",
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  textArea: {
    minHeight: 140,
  },
  charCount: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    textAlign: "right",
    marginTop: 4,
  },
  categorySelect: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  categorySelectText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: "Roboto",
    fontWeight: "600",
  },
  categoryOptions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
    overflow: "hidden",
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  categoryOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: "Roboto",
  },
  categoryOptionTextSelected: {
    color: colors.accent,
    fontWeight: "700",
  },
  gotItRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginTop: 22,
    gap: 12,
  },
  gotItLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    fontFamily: "Roboto",
  },
  gotItSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 26,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
});
