import React, { useContext, useState } from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { openExternalUrl, toSafeMailto } from "../../utils/openExternalUrl";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { LanguageContext } from "../LanguageContext";
import { creatorListingsAPI } from "../../services/apiService";

function CreatorListingCard({ listing, type }) {
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const isCompany = type === "company";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleRequestInfo = async () => {
    if (requesting || requested) return;
    setRequesting(true);
    try {
      await creatorListingsAPI.recordRequest(listing.id);
      setRequested(true);
      const mailto = toSafeMailto(listing.contactEmail, `Inquiry about ${listing.name}`);
      if (mailto) Linking.openURL(mailto);
    } catch (error) {
      console.error("Error recording creator listing request:", error);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {listing.name}
        </Text>
        <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {listing.country}
        </Text>
        <View style={styles.cardDateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
          <Text style={[styles.cardDate, { color: colors.textMuted }]}>
            Posted {formatDate(listing.createdAt)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.tagsWrap}>
            <Text style={styles.tagPrimary}>{t("explore.creatorListings")}</Text>
            <Text style={styles.tagCountry}>{listing.country}</Text>
          </View>

          <View style={styles.requestIconWrapper}>
            {requested ? (
              <View style={styles.requestedIconBadge} accessibilityLabel={t("explore.requested")}>
                <Ionicons name="checkmark" size={18} color="#16a34a" />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.requestIconButton, requesting && styles.buttonDisabled]}
                onPress={handleRequestInfo}
                disabled={requesting}
                accessibilityLabel={t("creatorListing.requestInfo")}
              >
                <Ionicons name="paper-plane" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
          style={[styles.dropdownToggle, { borderBottomColor: colors.border }]}
          onPress={() => setIsDetailsVisible(!isDetailsVisible)}
        >
          <Text style={[styles.dropdownToggleText, { color: colors.accent }]}>{t("explore.viewDetails")}</Text>
          <Ionicons
            name={isDetailsVisible ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
        {isDetailsVisible && (
          <View style={[styles.dropdownContent, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
              {listing.description}
            </Text>
            {!!listing.contactEmail && (
              <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                <Text style={[styles.boldText, { color: colors.textPrimary }]}>
                  {isCompany ? "HR contact:" : "Contact:"}
                </Text>{" "}
                {listing.contactEmail}
              </Text>
            )}
            {!!listing.website && (
              <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                <Text style={[styles.boldText, { color: colors.textPrimary }]}>Website:</Text>{" "}
                <Text
                  style={[styles.linkText, { color: colors.accent }]}
                  onPress={() => openExternalUrl(listing.website)}
                >
                  {listing.website}
                </Text>
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

export default function CreatorListingsSection({ listings, type }) {
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);
  if (!Array.isArray(listings) || listings.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t("explore.creatorListings")}
      </Text>
      {listings.map((listing) => (
        <CreatorListingCard key={listing.id} listing={listing} type={type} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginBottom: 12, fontFamily: "Roboto" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: "#666",
    marginBottom: 4,
    fontFamily: "Roboto",
  },
  cardDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  cardDate: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  tagsWrap: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagPrimary: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#fff",
    backgroundColor: "#004aad",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  tagCountry: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#004aad",
    backgroundColor: "#eaf2ff",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  requestIconWrapper: {
    position: "relative",
  },
  requestIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#004aad",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  requestedIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  dropdownToggleText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#004aad",
  },
  dropdownContent: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 4,
    fontFamily: "Roboto",
  },
  boldText: {
    fontWeight: "700",
  },
  linkText: {
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
