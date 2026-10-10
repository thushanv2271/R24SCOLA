import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
import { openExternalUrl } from "../utils/openExternalUrl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { creatorListingsAPI } from "../services/apiService";
import ScreenHeader from "../components/blocks/ScreenHeader";
import LoaderModal from "../components/ui/LoaderModal";
import Badge from "../components/ui/Badge";
import AlertModal from "../components/AlertModal";
import { AuthContext } from "../components/AuthContext";

const STATUS_TONE = { pending: "warning", published: "success", rejected: "error" };
const STATUS_LABEL_KEY = {
  pending: "creatorListing.statusPending",
  published: "creatorListing.statusPublished",
  rejected: "creatorListing.statusRejected",
};
const TABS = [
  { key: "pending", labelKey: "admin.tabPending" },
  { key: "published", labelKey: "admin.tabPublished" },
  { key: "rejected", labelKey: "admin.tabRejected" },
  { key: "all", labelKey: "admin.tabAll" },
];

export default function AdminCreatorListings() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("pending");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [actioningId, setActioningId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });
  const PAGE_SIZE = 20;

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });

  const load = useCallback(async () => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const data = await creatorListingsAPI.getAllForAdmin(page, PAGE_SIZE, { status: tab === "all" ? undefined : tab });
      setListings(Array.isArray(data?.items) ? data.items : []);
      setTotalCount(data?.totalCount || 0);
      setPageCount(data?.pageCount || 0);
    } catch (error) {
      console.error("Error loading admin creator listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, tab, user?.isAdmin]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleReview = async (id, status) => {
    setActioningId(id);
    try {
      await creatorListingsAPI.review(id, status);
      await load();
    } catch (error) {
      console.error("Error reviewing creator listing:", error);
      showAlert(t("common.error"), error?.message || "Could not update this listing.", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleEdit = (listing) => {
    router.push({
      pathname: "/CreateCreatorListing",
      params: {
        id: listing.id,
        type: listing.type,
        name: listing.title,
        country: listing.targetName,
        description: listing.description,
        website: listing.website,
        contactEmail: listing.contactEmail,
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setActioningId(deleteTarget.id);
    try {
      await creatorListingsAPI.remove(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (error) {
      console.error("Error deleting creator listing:", error);
      showAlert(t("common.error"), error?.message || t("creatorListing.deleteFailed"), "error");
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const filtered = listings;

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.accessDenied, { backgroundColor: colors.screenBackground }]}>
        <ScreenHeader onBack={() => router.back()} showLogo={false} title={t("admin.creatorListings")} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("admin.accessDenied")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader onBack={() => router.back()} showLogo={false} title={t("admin.creatorListings")} />

      <View style={styles.tabsRow}>
        {TABS.map((tabItem) => {
          const active = tab === tabItem.key;
          return (
            <TouchableOpacity hitSlop={{ top: 7, bottom: 7, left: 6, right: 6 }}
              key={tabItem.key}
              style={[
                styles.tabPill,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => { setPage(1); setTab(tabItem.key); }}
            >
              <Text style={[styles.tabPillText, { color: active ? "#fff" : colors.textSecondary }]}>
                {t(tabItem.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <LoaderModal />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="file-tray-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("admin.noListings")}</Text>
            </View>
          ) : (
            filtered.map((listing) => (
              <View key={listing.id} style={[styles.card, { backgroundColor: colors.surface }]}>
                <View style={styles.cardTopRow}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
                    <Ionicons
                      name={listing.type === "company" ? "business-outline" : "school-outline"}
                      size={18}
                      color={colors.accent}
                    />
                  </View>
                  <View style={styles.cardTitleWrap}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {listing.title}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {listing.targetName} · @{listing.authorUsername}
                    </Text>
                  </View>
                  <Badge
                    label={t(STATUS_LABEL_KEY[listing.status] || "creatorListing.statusPending")}
                    tone={STATUS_TONE[listing.status] || "warning"}
                  />
                </View>

                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                  {listing.description}
                </Text>
                {!!listing.contactEmail && (
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{listing.contactEmail}</Text>
                )}
                {!!listing.website && (
                  <Text
                    style={[styles.metaText, styles.linkText, { color: colors.accent }]}
                    onPress={() => openExternalUrl(listing.website)}
                  >
                    {listing.website}
                  </Text>
                )}

                <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.viewCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("creatorListing.viewsLabel")}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="paper-plane-outline" size={14} color={colors.textMuted} />
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.requestCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("creatorListing.requestsLabel")}</Text>
                  </View>
                  <Text style={[styles.statLabel, { color: colors.textMuted, marginLeft: "auto" }]}>
                    {formatDate(listing.createdAt)}
                  </Text>
                </View>
                {listing.status !== "pending" && !!listing.reviewedBy && (
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>
                    {t("admin.reviewedBy", { name: listing.reviewedBy })}
                  </Text>
                )}

                <View style={styles.actionsRow}>
                  {listing.status === "pending" && (
                    <>
                      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        style={[styles.actionBtn, { backgroundColor: colors.successLight || colors.accentLight }]}
                        onPress={() => handleReview(listing.id, "published")}
                        disabled={actioningId === listing.id}
                      >
                        <Ionicons name="checkmark-outline" size={15} color={colors.success || colors.accent} />
                        <Text style={[styles.actionBtnText, { color: colors.success || colors.accent }]}>
                          {t("admin.approve")}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                        style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                        onPress={() => handleReview(listing.id, "rejected")}
                        disabled={actioningId === listing.id}
                      >
                        <Ionicons name="close-outline" size={15} color={colors.danger} />
                        <Text style={[styles.actionBtnText, { color: colors.danger }]}>{t("admin.reject")}</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
                    onPress={() => handleEdit(listing)}
                  >
                    <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
                    <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>{t("common.edit")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                    style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                    onPress={() => setDeleteTarget(listing)}
                  >
                    <Ionicons name="trash-outline" size={15} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>{t("common.delete")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {pageCount > 1 && (
            <View style={[styles.listPagination, { borderTopColor: colors.divider }]}>
              <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                style={[styles.pageButton, { borderColor: colors.border }, page <= 1 && styles.pageButtonDisabled]}
                onPress={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                accessibilityLabel={t("common.back")}
              >
                <Ionicons name="chevron-back" size={17} color={page <= 1 ? colors.textMuted : colors.accent} />
              </TouchableOpacity>
              <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                {t("admin.pageOf", { page, pages: Math.max(pageCount, 1), total: totalCount })}
              </Text>
              <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
                style={[styles.pageButton, { borderColor: colors.border }, page >= pageCount && styles.pageButtonDisabled]}
                onPress={() => setPage((current) => Math.min(pageCount, current + 1))}
                disabled={page >= pageCount}
                accessibilityLabel={t("common.next")}
              >
                <Ionicons name="chevron-forward" size={17} color={page >= pageCount ? colors.textMuted : colors.accent} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      <AlertModal
        visible={!!deleteTarget}
        title={t("creatorListing.deleteTitle")}
        message={t("creatorListing.deleteMessage")}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setDeleteTarget(null), secondary: true },
          { text: t("common.delete"), onPress: handleConfirmDelete, destructive: true },
        ]}
        onClose={() => setDeleteTarget(null)}
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
  container: { flex: 1 },
  accessDenied: { justifyContent: "flex-start" },
  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  tabPill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  tabPillText: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 28,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 13.5,
    fontFamily: "Roboto",
    textAlign: "center",
    paddingHorizontal: 30,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitleWrap: { flex: 1 },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 2,
  },
  description: {
    fontSize: 12.5,
    lineHeight: 17,
    fontFamily: "Roboto",
    marginTop: 10,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 4,
  },
  linkText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Roboto",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  listPagination: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, marginTop: 10, paddingTop: 14 },
  pageButton: { width: 34, height: 34, borderWidth: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.45 },
  pageText: { fontSize: 12, fontWeight: "700" },
});
