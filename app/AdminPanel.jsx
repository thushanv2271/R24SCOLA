import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, Switch } from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import ScreenHeader from "../components/blocks/ScreenHeader";
import { AuthContext } from "../components/AuthContext";
import { authAPI, communityAPI, creatorListingsAPI, scholarshipAPI } from "../services/apiService";
import LoaderModal from "../components/ui/LoaderModal";
import AlertModal from "../components/AlertModal";

const USERS_PAGE_SIZE = 10;
const COMPACT_FONT_SCALE = 1.2;
const EMPTY_USER_FORM = {
  fullName: "",
  email: "",
  phoneNumber: "",
  country: "",
  educationLevel: "",
  fieldOfStudy: "",
  coinsText: "0",
  isAdmin: false,
  paidMember: false,
};

const SectionHeader = ({ icon, label, colors }) => (
  <View style={styles.sectionHeaderRow}>
    <View style={[styles.sectionAccentBar, { backgroundColor: colors.accent }]} />
    <Ionicons name={icon} size={16} color={colors.accent} />
    <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{label}</Text>
  </View>
);

export default function AdminPanel() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [editUserTarget, setEditUserTarget] = useState(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [savingUser, setSavingUser] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [confirmUpdateNotice, setConfirmUpdateNotice] = useState(false);
  const [sendingUpdateNotice, setSendingUpdateNotice] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });

  const sendUpdateNotice = async () => {
    if (sendingUpdateNotice) return;
    setConfirmUpdateNotice(false);
    setSendingUpdateNotice(true);
    try {
      const result = await authAPI.sendAppUpdateNotice();
      if (!result?.devices) {
        showAlert(t("admin.notifyUpdate"), t("admin.notifyUpdateNoDevices"), "warning");
      } else {
        showAlert(
          t("admin.notifyUpdate"),
          t("admin.notifyUpdateSent", { accepted: result.accepted, devices: result.devices }),
          result.accepted ? "success" : "error",
        );
      }
    } catch (error) {
      console.error("Error sending update notice:", error);
      showAlert(t("common.error"), t("admin.notifyUpdateFailed"), "error");
    } finally {
      setSendingUpdateNotice(false);
    }
  };

  // Every overview figure below is a cheap paged/count/aggregate query — none
  // of them pull a whole collection into memory. Scholarships/creator
  // listings/community posts used to be fetched in full just to read
  // `.length` or sort by views client-side; at any real scale that's what
  // made this screen slow to load and janky to scroll. "Most viewed" merges
  // the top 5 (by views) from each source — a valid top-k merge, since a
  // true global top-5 item is always in the top 5 of its own source too.
  const loadSummary = useCallback(async () => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const [userPageData, scholarshipsPage, pendingListings, topListings, topPosts] = await Promise.all([
        authAPI.getAdminUsers(userPage, USERS_PAGE_SIZE, appliedUserSearch),
        scholarshipAPI.getAdminPaged({ page: 1, pageSize: 1 }),
        creatorListingsAPI.getAllForAdmin(1, 1, { status: "pending" }),
        creatorListingsAPI.getAllForAdmin(1, 5, { sortBy: "views" }),
        communityAPI.getAdminPostViews(1, 5, "views"),
      ]);
      setSummary({
        users: Array.isArray(userPageData?.users) ? userPageData.users : [],
        totalUsers: userPageData?.totalCount || 0,
        userPageCount: userPageData?.pageCount || 0,
        totalScholarships: scholarshipsPage?.totalCount || 0,
        pendingCount: pendingListings?.totalCount || 0,
        totalPostViews: (topListings?.totalViewCount || 0) + (topPosts?.totalViewCount || 0),
        topViewed: [
          ...(topPosts?.items || []),
          ...(topListings?.items || []).map((listing) => ({
            ...listing,
            type: `${listing.type} listing`,
          })),
        ]
          .sort((left, right) => (right.viewCount || 0) - (left.viewCount || 0))
          .slice(0, 5),
      });
      setLoadFailed(false);
    } catch (error) {
      console.error("Error loading admin overview:", error);
      setSummary(null);
      setLoadFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appliedUserSearch, user?.isAdmin, userPage]);

  useFocusEffect(
    useCallback(() => {
      loadSummary();
    }, [loadSummary]),
  );

  const refresh = () => {
    setRefreshing(true);
    loadSummary();
  };

  const openEditUser = (adminUser) => {
    setEditUserTarget(adminUser);
    setUserForm({
      fullName: adminUser.fullName || "",
      email: adminUser.email || "",
      phoneNumber: adminUser.phoneNumber || "",
      country: adminUser.country || "",
      educationLevel: adminUser.educationLevel || "",
      fieldOfStudy: adminUser.fieldOfStudy || "",
      coinsText: String(adminUser.coins ?? 0),
      isAdmin: !!adminUser.isAdmin,
      paidMember: !!adminUser.paidMember,
    });
  };

  const saveUserEdit = async () => {
    if (!editUserTarget) return;
    const coins = parseInt(userForm.coinsText, 10);
    if (Number.isNaN(coins) || coins < 0) {
      showAlert(t("common.error"), t("admin.userUpdateFailed"), "warning");
      return;
    }

    setSavingUser(true);
    try {
      await authAPI.updateUserAdmin(editUserTarget.id, {
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        phoneNumber: userForm.phoneNumber.trim(),
        country: userForm.country.trim(),
        educationLevel: userForm.educationLevel.trim(),
        fieldOfStudy: userForm.fieldOfStudy.trim(),
        coins,
        isAdmin: userForm.isAdmin,
        paidMember: userForm.paidMember,
      });
      setEditUserTarget(null);
      await loadSummary();
      showAlert(t("common.success"), t("admin.userUpdated"), "success");
    } catch (error) {
      console.error("Error updating user:", error);
      showAlert(t("common.error"), error?.message || t("admin.userUpdateFailed"), "error");
    } finally {
      setSavingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget || deletingUser) return;
    setDeletingUser(true);
    try {
      await authAPI.deleteUserAdmin(deleteUserTarget.id);
      setDeleteUserTarget(null);
      await loadSummary();
      showAlert(t("common.success"), t("admin.userDeleted"), "success");
    } catch (error) {
      console.error("Error deleting user:", error);
      showAlert(t("common.error"), error?.message || t("admin.userDeleteFailed"), "error");
    } finally {
      setDeletingUser(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: colors.screenBackground }]}>
        <Ionicons name="lock-closed-outline" size={32} color={colors.danger} />
        <Text style={[styles.noAccessText, { color: colors.textPrimary }]}>{t("admin.accessDenied")}</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.accent }]}>
          <Text style={styles.backButtonText}>{t("common.back")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        <ScreenHeader
          onBack={() => router.back()}
          showLogo={false}
          title={t("admin.title")}
          icons={[{ key: "refresh", name: "refresh-outline", onPress: refresh, accessibilityLabel: t("common.refresh") }]}
        />
        <LoaderModal />
      </SafeAreaView>
    );
  }

  const pendingCount = summary?.pendingCount || 0;
  const viewedContent = summary?.topViewed || [];
  const postViews = summary?.totalPostViews || 0;

  const rows = [
    {
      key: "creatorListings",
      icon: "megaphone-outline",
      label: t("admin.creatorListings"),
      value: t("admin.creatorListingsDesc"),
      onPress: () => router.push("/AdminCreatorListings"),
    },
    {
      key: "scholarships",
      icon: "school-outline",
      label: t("admin.scholarships"),
      value: `${summary?.totalScholarships || 0} · ${t("admin.scholarshipsDesc")}`,
      onPress: () => router.push("/AdminScholarships"),
    },
    {
      key: "updateNotice",
      icon: "cloud-download-outline",
      label: t("admin.notifyUpdate"),
      value: t("admin.notifyUpdateDesc"),
      onPress: () => setConfirmUpdateNotice(true),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={t("admin.title")}
        icons={[{ key: "refresh", name: "refresh-outline", onPress: refresh, accessibilityLabel: t("common.refresh") }]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Text style={[styles.panelDesc, { color: colors.textSecondary }]}>{t("admin.panelDesc")}</Text>
        {loadFailed && (
          <TouchableOpacity style={[styles.loadError, { backgroundColor: colors.dangerLight }]} onPress={refresh}>
            <Ionicons name="alert-circle-outline" size={17} color={colors.danger} />
            <Text style={[styles.loadErrorText, { color: colors.danger }]}>{t("admin.loadFailed")}</Text>
            <Ionicons name="refresh-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}

        <SectionHeader icon="stats-chart-outline" label={t("admin.overview")} colors={colors} />
        <View style={styles.metricsGrid}>
          {[
            { label: t("admin.totalUsers"), value: summary?.totalUsers || 0, icon: "people-outline", color: colors.accent },
            { label: t("admin.scholarshipsCount"), value: summary?.totalScholarships || 0, icon: "school-outline", color: colors.success },
            { label: t("admin.pendingReviews"), value: pendingCount, icon: "time-outline", color: colors.warning },
            { label: t("admin.postViews"), value: postViews, icon: "eye-outline", color: colors.info },
          ].map((metric) => (
            <View key={metric.label} style={[styles.metric, { backgroundColor: colors.surface }]}>
              <Ionicons name={metric.icon} size={20} color={metric.color || colors.accent} />
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{metric.value.toLocaleString()}</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]} numberOfLines={2}>{metric.label}</Text>
            </View>
          ))}
        </View>

        <SectionHeader icon="construct-outline" label={t("admin.management")} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {rows.map((row, index) => (
            <View key={row.key}>
              {index > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}
              <TouchableOpacity style={styles.row} onPress={row.onPress} activeOpacity={0.7}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name={row.icon} size={18} color={colors.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{row.label}</Text>
                  <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={2}>
                    {row.value}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <SectionHeader icon="people-outline" label={t("admin.recentUsers")} colors={colors} />
        <View style={[styles.userSearchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={17} color={colors.textMuted} />
          <TextInput
            style={[styles.userSearchInput, { color: colors.textPrimary }]}
            value={userSearch}
            onChangeText={setUserSearch}
            placeholder={t("admin.searchUsers")}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => { setUserPage(1); setAppliedUserSearch(userSearch.trim()); }}
          />
          <TouchableOpacity onPress={() => { setUserPage(1); setAppliedUserSearch(userSearch.trim()); }} accessibilityLabel={t("admin.searchUsers")}>
            <Ionicons name="arrow-forward-circle" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {(summary?.users || []).map((adminUser, index) => {
            const badges = [
              adminUser.isAdmin && { label: t("admin.adminRole"), tone: "accent" },
              adminUser.paidMember && { label: t("profile.premiumMember"), tone: "success" },
              adminUser.isLoggedIn && { label: t("admin.online"), tone: "success" },
              adminUser.creatorModeEnabled && {
                label: adminUser.creatorRole === "universityOwner" ? t("profile.creatorRoleUniversityOwner") : t("profile.creatorRoleCompanyOwner"),
                tone: "warning",
              },
            ].filter(Boolean);
            const detailLine = [adminUser.country, adminUser.fieldOfStudy]
              .filter(Boolean)
              .join(" · ");
            const isSelf = adminUser.username === user?.username;
            return (
              <View key={adminUser.id || adminUser.username}>
                {index > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}
                <View style={styles.userRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name="person-outline" size={17} color={colors.accent} />
                  </View>
                  <View style={styles.rowText}>
                    <View style={styles.userTopLine}>
                      <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                        {adminUser.username}
                      </Text>
                      <Text style={[styles.userCoins, { color: colors.textSecondary }]} numberOfLines={1}>
                        {(adminUser.coins ?? 0).toLocaleString()} {t("wallet.scolaCoins")}
                      </Text>
                    </View>
                    <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={1}>
                      {adminUser.email || adminUser.fullName || t("profile.notSet")}
                    </Text>
                    {!!detailLine && (
                      <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={1}>
                        {detailLine}
                      </Text>
                    )}
                    {badges.length > 0 && (
                      <View style={styles.userBadgeRow}>
                        {badges.map((badge) => (
                          <View
                            key={badge.label}
                            style={[styles.userBadge, { backgroundColor: colors[`${badge.tone}Light`] || colors.accentLight }]}
                          >
                            <Text style={[styles.userBadgeText, { color: colors[badge.tone] || colors.accent }]} numberOfLines={1}>
                              {badge.label}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                  {!isSelf && (
                    <View style={styles.userRowActions}>
                      <TouchableOpacity hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                        style={[styles.userActionBtn, { backgroundColor: colors.accentLight }]}
                        onPress={() => openEditUser(adminUser)}
                        accessibilityLabel={t("admin.editUser")}
                      >
                        <Ionicons name="create-outline" size={15} color={colors.accent} />
                      </TouchableOpacity>
                      <TouchableOpacity hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                        style={[styles.userActionBtn, { backgroundColor: colors.dangerLight }]}
                        onPress={() => setDeleteUserTarget(adminUser)}
                        accessibilityLabel={t("admin.deleteUser")}
                      >
                        <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
          {!(summary?.users?.length) && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{t("admin.noUsers")}</Text>}
          <View style={[styles.userPagination, { borderTopColor: colors.divider }]}>
            <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              style={[styles.pageButton, { borderColor: colors.border }, userPage <= 1 && styles.pageButtonDisabled]}
              onPress={() => setUserPage((page) => Math.max(1, page - 1))}
              disabled={userPage <= 1}
              accessibilityLabel={t("common.back")}
            >
              <Ionicons name="chevron-back" size={17} color={userPage <= 1 ? colors.textMuted : colors.accent} />
            </TouchableOpacity>
            <Text style={[styles.pageText, { color: colors.textSecondary }]}>
              {t("admin.pageOf", { page: userPage, pages: Math.max(summary?.userPageCount || 0, 1), total: summary?.totalUsers || 0 })}
            </Text>
            <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              style={[styles.pageButton, { borderColor: colors.border }, userPage >= (summary?.userPageCount || 0) && styles.pageButtonDisabled]}
              onPress={() => setUserPage((page) => Math.min(summary?.userPageCount || 1, page + 1))}
              disabled={userPage >= (summary?.userPageCount || 0)}
              accessibilityLabel={t("common.next")}
            >
              <Ionicons name="chevron-forward" size={17} color={userPage >= (summary?.userPageCount || 0) ? colors.textMuted : colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <SectionHeader icon="trending-up-outline" label={t("admin.mostViewed")} colors={colors} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {viewedContent.slice(0, 5).map((content, index) => (
            <View key={`${content.type}-${content.id}`}>
              {index > 0 && <View style={[styles.rowDivider, { backgroundColor: colors.divider }]} />}
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="eye-outline" size={17} color={colors.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={1}>{content.title}</Text>
                  <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={1}>{content.type} · @{content.authorUsername}</Text>
                </View>
                <Text style={[styles.rowLabel, { color: colors.accent }]}>{content.viewCount || 0}</Text>
              </View>
            </View>
          ))}
          {!viewedContent.length && <Text style={[styles.rowValue, { color: colors.textMuted }]}>{t("admin.noViews")}</Text>}
        </View>
      </ScrollView>

      <Modal visible={!!editUserTarget} transparent animationType="slide" onRequestClose={() => setEditUserTarget(null)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={[styles.editorSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {t("admin.editUser")}{editUserTarget ? ` · ${editUserTarget.username}` : ""}
              </Text>
              <TouchableOpacity onPress={() => setEditUserTarget(null)} accessibilityLabel={t("common.close")}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
              {[
                ["fullName", t("personalDetails.fullName")],
                ["email", t("personalDetails.email")],
                ["phoneNumber", t("personalDetails.phoneNumber")],
                ["country", t("personalDetails.country")],
                ["educationLevel", t("personalDetails.educationLevel")],
                ["fieldOfStudy", t("personalDetails.fieldOfStudy")],
              ].map(([key, label]) => (
                <View key={key} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <TextInput
                    value={userForm[key]}
                    onChangeText={(value) => setUserForm((previous) => ({ ...previous, [key]: value }))}
                    placeholder={label}
                    placeholderTextColor={colors.textMuted}
                    style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  />
                </View>
              ))}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t("wallet.scolaCoins")}</Text>
                <TextInput
                  value={userForm.coinsText}
                  onChangeText={(value) => setUserForm((previous) => ({ ...previous, coinsText: value.replace(/[^0-9]/g, "") }))}
                  keyboardType="number-pad"
                  style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{t("admin.adminAccess")}</Text>
                <Switch
                  value={userForm.isAdmin}
                  onValueChange={(value) => setUserForm((previous) => ({ ...previous, isAdmin: value }))}
                  trackColor={{ true: colors.accent }}
                />
              </View>
              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.textPrimary }]}>{t("profile.premiumMember")}</Text>
                <Switch
                  value={userForm.paidMember}
                  onValueChange={(value) => setUserForm((previous) => ({ ...previous, paidMember: value }))}
                  trackColor={{ true: colors.accent }}
                />
              </View>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={saveUserEdit} disabled={savingUser}>
                {savingUser ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.saveButtonText} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
                  {savingUser ? t("common.sending") : t("common.save")}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AlertModal
        visible={confirmUpdateNotice}
        title={t("admin.notifyUpdateConfirmTitle")}
        message={t("admin.notifyUpdateConfirm")}
        type="info"
        actions={[
          { text: t("common.cancel"), onPress: () => setConfirmUpdateNotice(false), secondary: true },
          { text: t("admin.notifyUpdateSend"), onPress: sendUpdateNotice },
        ]}
        onClose={() => setConfirmUpdateNotice(false)}
      />
      <AlertModal
        visible={!!deleteUserTarget}
        title={t("admin.deleteUser")}
        message={deleteUserTarget ? t("admin.deleteUserMessage", { username: deleteUserTarget.username }) : ""}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setDeleteUserTarget(null), secondary: true },
          { text: t("common.delete"), onPress: confirmDeleteUser, destructive: true },
        ]}
        onClose={() => setDeleteUserTarget(null)}
      />
      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={[{ text: t("common.ok"), onPress: () => setAlertConfig((prev) => ({ ...prev, visible: false })) }]}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 28,
  },
  centered: { alignItems: "center", justifyContent: "center", padding: 24, gap: 14 },
  noAccessText: { fontSize: 16, fontWeight: "700", textAlign: "center" },
  backButton: { paddingHorizontal: 18, minHeight: 44, justifyContent: "center", alignItems: "center", borderRadius: 10 },
  backButtonText: { color: "#fff", fontWeight: "700" },
  panelDesc: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  loadError: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 10, marginBottom: 12 },
  loadErrorText: { flex: 1, fontSize: 12, fontWeight: "700" },
  userSearchRow: { height: 40, marginBottom: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  userSearchInput: { flex: 1, padding: 0, fontSize: 13 },
  userPagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 6, paddingTop: 10 },
  pageButton: { width: 34, height: 34, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.45 },
  pageText: { fontSize: 12, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10, marginTop: 8 },
  sectionAccentBar: { width: 3, height: 16, borderRadius: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  metric: { width: "48%", minHeight: 106, borderRadius: 12, padding: 13, justifyContent: "center", gap: 5 },
  metricValue: { fontSize: 22, fontWeight: "800" },
  metricLabel: { fontSize: 12, fontWeight: "600" },
  card: {
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  rowDivider: {
    height: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  rowText: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  rowValue: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
  },
  userTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  userCoins: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    flexShrink: 0,
  },
  userBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  userBadge: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  userRowActions: { flexDirection: "row", gap: 6, marginTop: 2 },
  userActionBtn: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.48)", justifyContent: "flex-end" },
  editorSheet: { maxHeight: "88%", borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 18 },
  editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 12 },
  editorTitle: { fontSize: 18, fontWeight: "800" },
  formContent: { paddingHorizontal: 18, paddingBottom: 30 },
  formField: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  formInput: { minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, fontSize: 14 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  switchLabel: { fontSize: 13.5, fontWeight: "700", flexShrink: 1, paddingRight: 10 },
  saveButton: { minHeight: 46, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6, paddingVertical: 10, paddingHorizontal: 16 },
  saveButtonText: { color: "#fff", fontSize: 13.5, fontWeight: "800" },
});
