import React, { useContext, useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  RichEditor,
  RichToolbar,
  actions as richActions,
} from "react-native-pell-rich-editor";
import { AuthContext } from "../components/AuthContext";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { authAPI } from "../services/apiService";
import {
  getAttachments,
  addAttachment,
  removeAttachment,
} from "../services/attachmentStorage";
import { SafeAreaView } from "react-native-safe-area-context";
import LoaderModal from "../components/ui/LoaderModal";
import { router } from "expo-router";
import AlertModal from "../components/AlertModal";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import ExploreSwitch from "../components/ui/ExploreSwitch";
import { useInterest } from "../components/InterestContext";
import { markGuideStepDone } from "../utils/setupGuide";

// The full set of formatting tools shown in the toolbar: bold, italic,
// underline, strikethrough, bullet/numbered lists, indent, alignment,
// link and image insertion.
const EDITOR_MIN_HEIGHT = 110;
const EDITOR_MAX_HEIGHT = 320;

const TOOLBAR_ACTIONS = [
  richActions.setBold,
  richActions.setItalic,
  richActions.setUnderline,
  richActions.setStrikethrough,
  richActions.insertBulletsList,
  richActions.insertOrderedList,
  richActions.outdent,
  richActions.indent,
  richActions.alignLeft,
  richActions.alignCenter,
  richActions.alignRight,
  richActions.insertLink,
  richActions.insertImage,
  richActions.undo,
  richActions.redo,
];

export default function CustomMail() {
  const { user, logout } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [paidMember, setPaidMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedData, setEditedData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [jobEmailMessage, setJobEmailMessage] = useState("");
  const [chosenTab, setSelectedTab] = useState("scholarships");
  // With a single interest only that side's email message is shown.
  const { isBoth, showUniversities } = useInterest();
  const selectedTab = isBoth ? chosenTab : showUniversities ? "scholarships" : "jobs";
  const [menuVisible, setMenuVisible] = useState(false);
  const [editorHeight, setEditorHeight] = useState(EDITOR_MIN_HEIGHT);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsBusy, setAttachmentsBusy] = useState(false);
  const richText = useRef(null);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });

  const showAlert = (title, message, type = "info", actions = []) => {
    setAlertConfig({ visible: true, title, message, type, actions });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.username) return;
      try {
        const data = await authAPI.getUserByUsername(user.username);
        setPaidMember(data.paidMember);
        setEditedData(data);
        setEmailMessage(data.scholarshipEmailMessage || "");
        setJobEmailMessage(data.jobEmailMessage || "");
      } catch (error) {
        console.error("Error fetching user details:", error);
        showAlert(t("common.error"), t("alerts.loadUserFailed"), "error");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDetails();
  }, [user]);

  // The rich editor is a single persistent WebView instance, so its content
  // only follows state changes we push into it imperatively (switching tabs,
  // loading data, cancelling edits) rather than through a normal prop.
  useEffect(() => {
    if (!loading) {
      const html =
        selectedTab === "scholarships" ? emailMessage : jobEmailMessage;
      richText.current?.setContentHTML(html || "");
      // The box should size itself to the new tab's content, not stay
      // stretched to whatever height the previous tab's message needed.
      setEditorHeight(EDITOR_MIN_HEIGHT);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, loading]);

  useEffect(() => {
    const loadAttachments = async () => {
      if (!user?.username) return;
      const list = await getAttachments(user.username, selectedTab);
      setAttachments(list);
    };
    loadAttachments();
  }, [user, selectedTab]);

  const handleSaveEmailMessage = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const updatedData = await authAPI.updateEmailMessage(
        user.username,
        emailMessage,
      );
      setEditedData(updatedData);
      setEmailMessage(updatedData.scholarshipEmailMessage || "");
      markGuideStepDone("mailEditor", "mail");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating email message:", error);
      showAlert(t("common.error"), t("alerts.updateEmailFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJobEmailMessage = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const updatedData = await authAPI.updateJobEmailMessage(
        user.username,
        jobEmailMessage,
      );
      setEditedData(updatedData);
      setJobEmailMessage(updatedData.jobEmailMessage || "");
      markGuideStepDone("mailEditor", "mail");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating job email message:", error);
      showAlert(t("common.error"), t("alerts.updateJobEmailFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEmailMessage(editedData.scholarshipEmailMessage || "");
    setJobEmailMessage(editedData.jobEmailMessage || "");
    setIsEditing(false);
  };

  const hasUnsavedChanges =
    emailMessage !== (editedData.scholarshipEmailMessage || "") ||
    jobEmailMessage !== (editedData.jobEmailMessage || "");

  const attemptCancelEdit = () => {
    if (!hasUnsavedChanges) {
      handleCancelEdit();
      return;
    }
    showAlert(t("customMail.discardTitle"), t("customMail.discardMessage"), "warning", [
      { text: t("customMail.keepEditing"), secondary: true, onPress: () => {} },
      { text: t("customMail.discard"), destructive: true, onPress: handleCancelEdit },
    ]);
  };

  useEffect(() => {
    if (!isEditing) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      attemptCancelEdit();
      return true;
    });
    return () => sub.remove();
  });

  const handleSelectTab = (tab) => {
    setSelectedTab(tab);
  };

  const handleEditorChange = (html) => {
    if (selectedTab === "scholarships") {
      setEmailMessage(html);
    } else {
      setJobEmailMessage(html);
    }
  };

  // The WebView-based editor doesn't resize itself as content grows, so this
  // grows the box to fit what's typed (clamped so a very long message scrolls
  // internally instead of pushing the Save/Cancel buttons off-screen).
  const handleEditorHeightChange = (height) => {
    setEditorHeight(Math.min(Math.max(height, EDITOR_MIN_HEIGHT), EDITOR_MAX_HEIGHT));
  };

  const handleInsertImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        t("alerts.permissionTitle"),
        t("alerts.photoPermission"),
        "error",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.5,
    });

    const asset = result?.assets?.[0];
    if (!result.canceled && asset?.base64) {
      const mimeType = asset.mimeType || "image/jpeg";
      richText.current?.insertImage(`data:${mimeType};base64,${asset.base64}`);
    }
  };

  // Attached files (PDFs/images) are separate from the inline images above —
  // these ride along as real email attachments rather than appearing in the
  // message body, so the recipient gets them as downloadable files.
  const handleAddAttachment = async () => {
    if (!user?.username) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setAttachmentsBusy(true);
      let updated = attachments;
      for (const asset of result.assets ?? []) {
        if (asset.size && asset.size > 15 * 1024 * 1024) {
          showAlert(
            t("alerts.fileTooLargeTitle"),
            t("alerts.fileTooLarge", { name: asset.name }),
            "error",
          );
          continue;
        }
        updated = await addAttachment(user.username, selectedTab, asset);
      }
      setAttachments(updated);
    } catch (error) {
      console.error("Error adding attachment:", error);
      showAlert(t("common.error"), t("alerts.attachFailed"), "error");
    } finally {
      setAttachmentsBusy(false);
    }
  };

  const handleRemoveAttachment = async (id) => {
    if (!user?.username) return;
    setAttachmentsBusy(true);
    try {
      const updated = await removeAttachment(user.username, selectedTab, id);
      setAttachments(updated);
    } catch (error) {
      console.error("Error removing attachment:", error);
      showAlert(t("common.error"), t("alerts.removeAttachmentFailed"), "error");
    } finally {
      setAttachmentsBusy(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  const alertModal = (
    <AlertModal
      visible={alertConfig.visible}
      title={alertConfig.title}
      message={alertConfig.message}
      type={alertConfig.type}
      actions={
        alertConfig.actions.length > 0
          ? alertConfig.actions
          : [{ text: t("common.ok"), onPress: closeAlert }]
      }
      onClose={closeAlert}
    />
  );

  if (isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.editBar}>
          <TouchableOpacity
            style={styles.editBarIcon}
            onPress={attemptCancelEdit}
            accessibilityRole="button"
            accessibilityLabel={t("customMail.cancel")}
          >
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.editBarTitle} numberOfLines={1}>
            {selectedTab === "scholarships"
              ? t("customMail.editScholarshipTitle")
              : t("customMail.editJobTitle")}
          </Text>
          <TouchableOpacity hitSlop={{ top: 2, bottom: 2, left: 0, right: 0 }}
            style={styles.editBarSave}
            onPress={
              selectedTab === "scholarships"
                ? handleSaveEmailMessage
                : handleSaveJobEmailMessage
            }
            accessibilityRole="button"
            accessibilityLabel={t("customMail.saveMessage")}
          >
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={styles.editBarSaveText}>{t("customMail.save")}</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={styles.editorScreen} behavior="padding">
          <View style={styles.fullEditor}>
            <RichEditor
              key="edit"
              ref={richText}
              initialContentHTML={
                selectedTab === "scholarships" ? emailMessage : jobEmailMessage
              }
              onChange={handleEditorChange}
              editorInitializedCallback={() => richText.current?.focusContentEditor()}
              editorStyle={{
                backgroundColor: colors.surface,
                color: colors.textPrimary,
                placeholderColor: colors.textMuted,
                contentCSSText:
                  "font-family: Roboto, sans-serif; font-size: 16px; line-height: 24px; padding: 12px 16px; min-height: 70vh;",
              }}
              placeholder={t("customMail.placeholder")}
              useContainer={false}
              style={styles.fullEditorInput}
            />
          </View>
          <RichToolbar
            editor={richText}
            actions={TOOLBAR_ACTIONS}
            onPressAddImage={handleInsertImage}
            iconTint={colors.textSecondary}
            selectedIconTint={colors.accent}
            style={styles.fullToolbar}
          />
        </KeyboardAvoidingView>
        {alertModal}
      </SafeAreaView>
    );
  }

  const isScholarship = selectedTab === "scholarships";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerWrap}>
        <ScreenHeader
          onBack={() => router.back()}
          onMenuPress={() => setMenuVisible(true)}
        />
      </View>
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle} numberOfLines={1}>
            {isScholarship ? t("customMail.scholarshipMessage") : t("customMail.jobMessage")}
          </Text>
          {isBoth && (
            <ExploreSwitch
              value={selectedTab}
              onChange={handleSelectTab}
              labels={{ scholarships: t("explore.universities"), jobs: t("explore.companies") }}
            />
          )}
        </View>

        <View style={styles.card}>
          <RichEditor
            key="preview"
            ref={richText}
            initialContentHTML={isScholarship ? emailMessage : jobEmailMessage}
            onHeightChange={handleEditorHeightChange}
            disabled
            editorStyle={{
              backgroundColor: colors.surface,
              color: colors.textPrimary,
              placeholderColor: colors.textMuted,
              contentCSSText:
                "font-family: Roboto, sans-serif; font-size: 15px; line-height: 22px; padding: 0;",
            }}
            placeholder={t("customMail.emptyPreview")}
            initialHeight={EDITOR_MIN_HEIGHT}
            useContainer
            style={[styles.richEditor, { height: editorHeight }]}
          />
          <TouchableOpacity
            style={styles.previewTapArea}
            onPress={() => setIsEditing(true)}
            activeOpacity={1}
            accessibilityRole="button"
            accessibilityLabel={t("customMail.tapToEdit")}
          />
          <View style={styles.editChip} pointerEvents="none">
            <Ionicons name="create-outline" size={16} color={colors.accent} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.attachmentsHeader}>
            <View style={styles.attachmentsHeading}>
              <Text style={styles.attachmentsLabel}>{t("customMail.attachmentsTitle")}</Text>
              <Text style={styles.attachmentsHint} numberOfLines={2}>
                {t("customMail.attachmentsHint")}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addAttachmentButton}
              onPress={handleAddAttachment}
              disabled={attachmentsBusy}
              accessibilityRole="button"
              accessibilityLabel={t("customMail.add")}
            >
              <Ionicons name="attach" size={16} color={colors.accent} />
              <Text style={styles.addAttachmentButtonText}>
                {attachmentsBusy ? t("customMail.working") : t("customMail.add")}
              </Text>
            </TouchableOpacity>
          </View>

          {attachments.length > 0 && (
            <View style={styles.attachmentList}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentRow}>
                  <Ionicons
                    name={
                      attachment.mimeType?.startsWith("image/")
                        ? "image-outline"
                        : "document-text-outline"
                    }
                    size={20}
                    color={colors.accent}
                  />
                  <View style={styles.attachmentInfo}>
                    <Text style={styles.attachmentName} numberOfLines={1}>
                      {attachment.name}
                    </Text>
                    {!!attachment.size && (
                      <Text style={styles.attachmentSize}>{formatFileSize(attachment.size)}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => handleRemoveAttachment(attachment.id)}
                    disabled={attachmentsBusy}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={t("customMail.removeAttachment")}
                  >
                    <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.customizeButton}
          onPress={() => setIsEditing(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Ionicons name={isScholarship ? "mail-outline" : "briefcase-outline"} size={20} color="#fff" />
          <Text style={styles.customizeButtonText} numberOfLines={1}>
            {isScholarship
              ? t("customMail.customizeScholarshipEmail")
              : t("customMail.customizeJobEmail")}
          </Text>
        </TouchableOpacity>
      </View>

      {alertModal}
    </SafeAreaView>
  );
}

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.screenBackground,
  },
  headerWrap: {
    paddingHorizontal: 16,
  },
  scroll: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  pageTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  pageTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: colors.textPrimary,
  },
  editBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  editBarIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  editBarTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textPrimary,
  },
  editBarSave: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.accent,
  },
  editBarSaveText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  editorScreen: {
    flex: 1,
  },
  fullEditor: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fullEditorInput: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  fullToolbar: {
    backgroundColor: colors.surfaceAlt,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: colors.screenBackground,
  },
  customizeButton: {
    minHeight: 50,
    paddingHorizontal: 20,
    backgroundColor: colors.accent,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  customizeButtonText: {
    flexShrink: 1,
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  richEditor: {
    width: "100%",
  },
  previewTapArea: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  editChip: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  attachmentsHeading: {
    flex: 1,
  },
  attachmentsLabel: {
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: colors.textPrimary,
  },
  attachmentsHint: {
    fontSize: 12,
    fontFamily: "Roboto",
    color: colors.textMuted,
    marginTop: 2,
  },
  addAttachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.accentLight,
    gap: 4,
  },
  addAttachmentButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  attachmentList: {
    marginTop: 12,
    gap: 8,
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    gap: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  attachmentSize: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontFamily: "Roboto",
  },
});
