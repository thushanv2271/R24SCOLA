import React, { useCallback, useContext, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
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

const STATUS_TONE = {
  pending: "warning",
  published: "success",
  rejected: "error",
};

const STATUS_LABEL_KEY = {
  pending: "creatorListing.statusPending",
  published: "creatorListing.statusPublished",
  rejected: "creatorListing.statusRejected",
};

export default function MyCreatorListings() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });

  const load = useCallback(async () => {
    try {
      const data = await creatorListingsAPI.getMine();
      setListings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading my creator listings:", error);
      setListings([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handleEdit = (listing) => {
    router.push({
      pathname: "/CreateCreatorListing",
      params: {
        id: listing.id,
        type: listing.type,
        name: listing.name,
        country: listing.country,
        description: listing.description,
        website: listing.website,
        contactEmail: listing.contactEmail,
      },
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await creatorListingsAPI.remove(deleteTarget.id);
      setDeleteTarget(null);
      load();
    } catch (error) {
      console.error("Error deleting creator listing:", error);
      showAlert(t("common.error"), error?.message || t("creatorListing.deleteFailed"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader onBack={() => router.back()} showLogo={false} title={t("creatorListing.myListings")} />

      {loading ? (
        <LoaderModal />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {listings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="megaphone-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t("creatorListing.myListingsEmpty")}
              </Text>
            </View>
          ) : (
            listings.map((listing) => (
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
                      {listing.name}
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {listing.country}
                    </Text>
                  </View>
                  <Badge
                    label={t(STATUS_LABEL_KEY[listing.status] || "creatorListing.statusPending")}
                    tone={STATUS_TONE[listing.status] || "warning"}
                  />
                </View>

                <View style={[styles.statsRow, { borderTopColor: colors.divider }]}>
                  <View style={styles.statItem}>
                    <Ionicons name="eye-outline" size={15} color={colors.textMuted} />
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.viewCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("creatorListing.viewsLabel")}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="paper-plane-outline" size={15} color={colors.textMuted} />
                    <Text style={[styles.statValue, { color: colors.textPrimary }]}>{listing.requestCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t("creatorListing.requestsLabel")}</Text>
                  </View>
                </View>

                <Text style={[styles.dateText, { color: colors.textMuted }]}>
                  {t("creatorListing.submittedOn", { date: formatDate(listing.createdAt) })}
                </Text>
                {!!listing.reviewedAt && (
                  <Text style={[styles.dateText, { color: colors.textMuted }]}>
                    {t("creatorListing.reviewedOn", { date: formatDate(listing.reviewedAt) })}
                  </Text>
                )}

                {listing.status === "pending" && (
                  <View style={[styles.actionsRow, { borderTopColor: colors.divider }]}>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      style={[styles.actionBtn, { backgroundColor: colors.surfaceAlt }]}
                      onPress={() => handleEdit(listing)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="create-outline" size={15} color={colors.textSecondary} />
                      <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>{t("common.edit")}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]}
                      onPress={() => setDeleteTarget(listing)}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>{t("common.delete")}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
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
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
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
  cardTitleWrap: {
    flex: 1,
  },
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
  statsRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Roboto",
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
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
});
