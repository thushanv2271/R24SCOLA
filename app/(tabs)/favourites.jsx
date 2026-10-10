import React, {
  useState,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Modal,
} from "react-native";
import RefreshControl from "../../components/ui/AppRefreshControl";
import { Image } from "expo-image";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { AuthContext } from "../../components/AuthContext";
import { LanguageContext } from "../../components/LanguageContext";
import { authAPI } from "../../services/apiService";
import {
  sendScholarshipEmail,
  sendJobEmail,
  sendBulkScholarshipEmail,
  sendBulkJobEmail,
} from "../../services/emailService";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ScolaMenu from "../../components/ScolaMenu";
import ExploreSwitch from "../../components/ui/ExploreSwitch";
import ScreenHeader from "../../components/blocks/ScreenHeader";
import AlertModal from "../../components/AlertModal";
import { useTheme } from "../../components/ThemeContext";
import { useInterest } from "../../components/InterestContext";
import CoinSpendBurst from "../../components/wallet/CoinSpendBurst";
import InsufficientCoinsModal from "../../components/wallet/InsufficientCoinsModal";
import RequestButton from "../../components/blocks/RequestButton";
import { normalizeListings } from "../../constants/categories";
import { favoritesStore, useFavorites } from "../../services/favoritesStore";

const VIEW_MODE_OPTIONS = [
  { value: "card", labelKey: "favouritesScreen.cardView", icon: "albums-outline" },
  { value: "list", labelKey: "favouritesScreen.listView", icon: "list-outline" },
  { value: "grid", labelKey: "favouritesScreen.gridView", icon: "grid-outline" },
];
const VIEW_MODE_STORAGE_KEY = "@favourites_view_mode";

const FavoriteCard = React.memo(function FavoriteCard({
  item,
  isJob,
  isRequested,
  isFailed,
  iconSize,
  onRequest,
  onRemove,
  styles,
}) {
  const { t } = useContext(LanguageContext);
  const imageUrl =
    item.images && item.images.length > 0 ? item.images[0] : null;
  const [sending, setSending] = useState(false);
  const [burnTrigger, setBurnTrigger] = useState(0);
  const [burnAmount, setBurnAmount] = useState(10);

  const handlePressRequest = async () => {
    if (sending) return;
    setSending(true);
    try {
      const result = await onRequest(item, isJob);
      if (result?.sent && result?.spent) {
        setBurnAmount(result.spent);
        setBurnTrigger(Date.now());
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <View style={styles.imageBanner}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.bannerImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="normal"
            />
          ) : (
            <View style={styles.bannerFallback}>
              <MaterialIcons name="image-not-supported" size={iconSize} color="#94a3b8" />
            </View>
          )}
        </View>

        <View style={styles.typeBadge}>
          <Ionicons name={isJob ? "briefcase" : "school"} size={12} color="#fff" />
          <Text style={styles.typeBadgeText}>{isJob ? "Job" : "Scholarship"}</Text>
        </View>

        <TouchableOpacity
          style={styles.removeIconBtn}
          onPress={() => onRemove(item, isJob)}
          accessibilityLabel={t("ui.a11y.removeFavourite")}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title || t(isJob ? "favouritesScreen.untitledJob" : "favouritesScreen.untitledScholarship")}
        </Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.university || t(isJob ? "favouritesScreen.unknownOrganization" : "favouritesScreen.unknownUniversity")}
        </Text>
        <View style={styles.cardFooter}>
          <View style={styles.tagsWrap}>
            {item.country ? (
              <Text style={styles.tagCountry}>{item.country}</Text>
            ) : null}
            {item.subcategory || item.major ? (
              <Text style={styles.tagMajor}>{item.subcategory || item.major}</Text>
            ) : null}
          </View>
          <View style={styles.requestButtonWrapper}>
            <CoinSpendBurst triggerKey={burnTrigger} amount={burnAmount} />
            <RequestButton
              label={t(isJob ? "explore.requestJob" : "explore.requestScholarship")}
              requestedLabel={t("favouritesScreen.requested")}
              sending={sending}
              requested={isRequested}
              failed={isFailed}
              confirm={false}
              onConfirm={handlePressRequest}
            />
          </View>
        </View>
      </View>
    </View>
  );
});

const FavoriteListItem = React.memo(function FavoriteListItem({
  item,
  isJob,
  isRequested,
  onRemove,
  onPress,
  styles,
}) {
  const { t } = useContext(LanguageContext);
  const imageUrl =
    item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <TouchableOpacity
      style={styles.listItem}
      activeOpacity={0.75}
      onPress={() => onPress(item, isJob)}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.listItemImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.listItemImage, styles.listItemImageFallback]}>
          <MaterialIcons name="image-not-supported" size={22} color="#94a3b8" />
        </View>
      )}
      <View style={styles.listItemBody}>
        <Text style={styles.listItemTitle} numberOfLines={1}>
          {item.title || t(isJob ? "favouritesScreen.untitledJob" : "favouritesScreen.untitledScholarship")}
        </Text>
        <Text style={styles.listItemSubtitle} numberOfLines={1}>
          {item.university || t(isJob ? "favouritesScreen.unknownOrganization" : "favouritesScreen.unknownUniversity")}
        </Text>
        <View style={styles.listItemTagsRow}>
          {item.country ? (
            <Text style={styles.listItemTag}>{item.country}</Text>
          ) : null}
          {isRequested && (
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => onRemove(item, isJob)}
        style={styles.listItemRemoveBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityLabel={t("ui.a11y.removeFavourite")}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const FavoriteGridTile = React.memo(function FavoriteGridTile({
  item,
  isJob,
  isRequested,
  onRemove,
  onPress,
  styles,
}) {
  const { t } = useContext(LanguageContext);
  const imageUrl =
    item.images && item.images.length > 0 ? item.images[0] : null;

  return (
    <TouchableOpacity
      style={styles.gridTile}
      activeOpacity={0.8}
      onPress={() => onPress(item, isJob)}
    >
      <View style={styles.gridTileImageWrap}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.gridTileImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[styles.gridTileImage, styles.listItemImageFallback]}>
            <MaterialIcons name="image-not-supported" size={22} color="#94a3b8" />
          </View>
        )}
        <TouchableOpacity
          onPress={() => onRemove(item, isJob)}
          style={styles.gridTileRemoveBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={t("ui.a11y.removeFavourite")}
        >
          <Ionicons name="trash-outline" size={15} color="#fff" />
        </TouchableOpacity>
        {isRequested && (
          <View style={styles.gridTileRequestedBadge}>
            <Ionicons name="checkmark-circle" size={13} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.gridTileBody}>
        <Text style={styles.gridTileTitle} numberOfLines={2}>
          {item.title || t(isJob ? "favouritesScreen.untitledJob" : "favouritesScreen.untitledScholarship")}
        </Text>
        <Text style={styles.gridTileSubtitle} numberOfLines={1}>
          {item.university || t(isJob ? "favouritesScreen.unknownOrganization" : "favouritesScreen.unknownUniversity")}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const FavoriteItemsList = () => {
  const {
    user,
    refreshFavorites,
    wallet,
    chargeForRequest,
    chargeForBulkRequest,
    isRequested,
  } = useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const sharedFavorites = useFavorites();
  const favoriteScholarships = useMemo(
    () => sharedFavorites.scholarships || [],
    [sharedFavorites.scholarships],
  );
  const favoriteJobs = useMemo(() => sharedFavorites.jobs || [], [sharedFavorites.jobs]);
  const [chosenTab, setSelectedTab] = useState("scholarships"); // "scholarships" or "jobs"
  // With a single interest (universities or companies) that side is the only tab.
  const { isBoth, showUniversities, showCompanies } = useInterest();
  const selectedTab = isBoth ? chosenTab : showUniversities ? "scholarships" : "jobs";
  const [refreshing, setRefreshing] = useState(false);
  // "Already requested" now lives server-side (wallet.requestedScholarshipIds
  // / requestedJobIds via isRequested()) instead of a local AsyncStorage set —
  // that's what makes it impossible to double-send the same item from two
  // different screens/devices. Only send *failures* (e.g. no email on file)
  // stay purely local; they aren't a wallet concept.
  const [failedScholarships, setFailedScholarships] = useState(new Set());
  const [failedJobs, setFailedJobs] = useState(new Set());
  const [insufficientCoinsInfo, setInsufficientCoinsInfo] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
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
  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));
  const [headerHeight, setHeaderHeight] = useState(190);
  const [showMenu, setShowMenu] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const scaleFactor = screenWidth / 375;
  const scale = (size) => Math.min(size * scaleFactor, size * 1.5);
  const bannerFallbackIconSize = scale(36);
  const pageWidth = screenWidth - 32; // matches container's paddingHorizontal
  const gridTileWidth = (pageWidth - 12) / 2;
  const pagerRef = useRef(null);
  const TABS = ["scholarships", "jobs"];
  const [viewMode, setViewMode] = useState("card");
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);

  const goToTab = (tab) => {
    setSelectedTab(tab);
    pagerRef.current?.scrollTo({
      x: TABS.indexOf(tab) * pageWidth,
      animated: true,
    });
  };

  const handlePagerScrollEnd = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    const tab = TABS[page] ?? TABS[0];
    if (tab !== selectedTab) setSelectedTab(tab);
  };

  // Keep the pager on the right page when the interest changes in Settings.
  useEffect(() => {
    pagerRef.current?.scrollTo({ x: TABS.indexOf(selectedTab) * pageWidth, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, pageWidth]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.screenBackground,
          paddingHorizontal: 16,
          paddingBottom: scale(10),
        },
        pagePaneDivider: {
          borderRightWidth: 1,
          borderRightColor: colors.border,
        },
        headerContainer: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: colors.headerBackground,
          paddingTop: StatusBar.currentHeight || 30,
          paddingHorizontal: 16,
          paddingBottom: 10,
        },
        headerRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        },
        iconButton: {
          backgroundColor: "#f1f5f9",
          borderRadius: 50,
          padding: 8,
          elevation: 2,
        },
        iconBackground: {
          backgroundColor: "#f1f5f9",
          borderRadius: 50,
          padding: 8,
          elevation: 2,
          width: 45,
          height: 45,
          justifyContent: "center",
          alignItems: "center",
          marginHorizontal: 5,
        },
        logo: {
          width: 150,
          height: 50,
        },
        title: {
          marginTop: scale(80),
          fontFamily: "Roboto",
          fontSize: scale(24),
          fontWeight: "700",
          color: colors.textPrimary,
          textAlign: "center",
          textBreakStrategy: "simple",
        },
        card: {
          backgroundColor: colors.surface,
          borderRadius: 18,
          marginBottom: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 3,
        },
        imageContainer: {
          position: "relative",
        },
        imageBanner: {
          width: "100%",
          height: 210,
          backgroundColor: colors.surfaceAlt,
        },
        bannerImage: {
          width: "100%",
          height: "100%",
        },
        bannerFallback: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        typeBadge: {
          position: "absolute",
          top: 10,
          left: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: "#004aad",
          paddingHorizontal: "2.5%",
          paddingVertical: "1.5%",
          borderRadius: 20,
        },
        typeBadgeText: {
          fontSize: screenWidth * 0.03,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: "#fff",
          textBreakStrategy: "simple",
        },
        removeIconBtn: {
          position: "absolute",
          bottom: 10,
          right: 10,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          borderRadius: 20,
          padding: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        },
        cardContent: {
          padding: 16,
        },
        cardTitle: {
          fontSize: 16,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: colors.textPrimary,
          marginBottom: 2,
          textBreakStrategy: "simple",
        },
        cardSubtitle: {
          fontSize: 13.5,
          color: colors.textSecondary,
          marginBottom: 10,
          fontFamily: "Roboto",
          textBreakStrategy: "simple",
        },
        cardFooter: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        },
        tagsWrap: {
          flex: 1,
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 6,
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
          textBreakStrategy: "simple",
        },
        tagMajor: {
          fontSize: 12,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: "#eb6834",
          backgroundColor: "#fff1ea",
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 20,
          overflow: "hidden",
          textBreakStrategy: "simple",
        },
        requestButtonWrapper: {
          position: "relative",
        },
        headerIcons: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        },
        menuBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.surfaceAlt,
          justifyContent: "center",
          alignItems: "center",
        },
        pageTitleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 12,
        },
        pageTitle: {
          fontSize: scale(24),
          fontWeight: "800",
          fontFamily: "Roboto",
          color: colors.textPrimary,
        },
        favCountsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
        },
        favCountText: {
          fontSize: scale(12.5),
          fontWeight: "600",
          fontFamily: "Roboto",
          color: colors.textMuted,
        },
        favCountTextActive: {
          color: colors.accent,
        },
        favCountDivider: {
          fontSize: scale(12.5),
          color: colors.textMuted,
        },
        menuBackdrop: {
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 150,
        },
        dropdown: {
          position: "absolute",
          top: (StatusBar.currentHeight || 30) + 120,
          right: 16,
          backgroundColor: colors.surface,
          borderRadius: 12,
          paddingVertical: 4,
          minWidth: 180,
          elevation: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.18,
          shadowRadius: 12,
          zIndex: 200,
        },
        dropdownItem: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 16,
        },
        dropdownText: {
          fontSize: 14,
          fontWeight: "600",
          fontFamily: "Roboto",
          color: colors.accent,
          textBreakStrategy: "simple",
        },
        dropdownTextDanger: {
          color: colors.danger,
        },
        dropdownTextDisabled: {
          color: colors.textMuted,
        },
        dropdownDivider: {
          height: 1,
          backgroundColor: colors.divider,
          marginHorizontal: 12,
        },
        emptyContainer: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 60,
          paddingHorizontal: 32,
        },
        emptyTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: colors.textPrimary,
          fontFamily: "Roboto",
          marginTop: 16,
          marginBottom: 8,
          textBreakStrategy: "simple",
        },
        emptySubtext: {
          fontSize: 14,
          color: colors.textMuted,
          fontFamily: "Roboto",
          textAlign: "center",
          lineHeight: 20,
          textBreakStrategy: "simple",
        },
        viewModeOverlay: {
          flex: 1,
          backgroundColor: "rgba(15, 23, 42, 0.15)",
          alignItems: "flex-end",
          paddingTop: (StatusBar.currentHeight || 0) + 64,
          paddingRight: 16,
        },
        viewModeMenu: {
          backgroundColor: colors.surface,
          borderRadius: 14,
          paddingVertical: 6,
          minWidth: 172,
          shadowColor: "#0f172a",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 8,
        },
        viewModeOption: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 12,
          paddingHorizontal: 14,
        },
        viewModeOptionText: {
          flex: 1,
          fontSize: 13.5,
          fontFamily: "Roboto",
          color: colors.textSecondary,
          fontWeight: "500",
        },
        viewModeOptionTextActive: {
          color: colors.accent,
          fontWeight: "700",
        },
        quickViewOverlay: {
          flex: 1,
          justifyContent: "flex-end",
          backgroundColor: "rgba(15, 23, 42, 0.45)",
        },
        quickViewSheet: {
          maxHeight: screenHeight * 0.88,
          backgroundColor: colors.screenBackground,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          overflow: "hidden",
        },
        quickViewHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 14,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        quickViewHeaderTitle: {
          fontSize: 16,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: colors.textPrimary,
        },
        quickViewCloseBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: colors.surfaceAlt,
          justifyContent: "center",
          alignItems: "center",
        },
        quickViewScrollContent: {
          padding: 16,
          paddingBottom: 32,
        },
        listItem: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 16,
          padding: 10,
          marginBottom: 12,
          gap: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
          elevation: 2,
        },
        listItemImage: {
          width: 72,
          height: 72,
          borderRadius: 12,
          backgroundColor: colors.border,
        },
        listItemImageFallback: {
          justifyContent: "center",
          alignItems: "center",
        },
        listItemBody: {
          flex: 1,
          gap: 3,
        },
        listItemTitle: {
          fontSize: 14.5,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: colors.textPrimary,
        },
        listItemSubtitle: {
          fontSize: 12.5,
          fontFamily: "Roboto",
          color: colors.textSecondary,
        },
        listItemTagsRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          marginTop: 4,
          flexWrap: "wrap",
        },
        listItemTag: {
          fontSize: 12,
          fontWeight: "600",
          fontFamily: "Roboto",
          color: "#004aad",
          backgroundColor: "#eaf2ff",
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        listItemRemoveBtn: {
          padding: 4,
        },
        gridRow: {
          gap: 12,
        },
        gridTile: {
          width: gridTileWidth,
          backgroundColor: colors.surface,
          borderRadius: 16,
          marginBottom: 14,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
          elevation: 2,
        },
        gridTileImageWrap: {
          position: "relative",
          width: "100%",
          height: 110,
        },
        gridTileImage: {
          width: "100%",
          height: "100%",
          backgroundColor: colors.border,
        },
        gridTileRemoveBtn: {
          position: "absolute",
          top: 6,
          right: 6,
          backgroundColor: "rgba(15, 23, 42, 0.45)",
          borderRadius: 14,
          width: 26,
          height: 26,
          justifyContent: "center",
          alignItems: "center",
        },
        gridTileRequestedBadge: {
          position: "absolute",
          bottom: 6,
          left: 6,
          backgroundColor: "rgba(5, 150, 105, 0.85)",
          borderRadius: 10,
          width: 20,
          height: 20,
          justifyContent: "center",
          alignItems: "center",
        },
        gridTileBody: {
          padding: 10,
          gap: 2,
        },
        gridTileTitle: {
          fontSize: 13,
          fontWeight: "700",
          fontFamily: "Roboto",
          color: colors.textPrimary,
          lineHeight: 17,
        },
        gridTileSubtitle: {
          fontSize: 12,
          fontFamily: "Roboto",
          color: colors.textSecondary,
        },
      }),
    [scale, screenWidth, screenHeight, gridTileWidth, colors],
  );

  const handleBackPress = () => {
    router?.back();
  };

  useEffect(() => {
    AsyncStorage.getItem(VIEW_MODE_STORAGE_KEY)
      .then((saved) => {
        if (saved === "card" || saved === "list" || saved === "grid") {
          setViewMode(saved);
        }
      })
      .catch(() => {});
  }, []);

  const handleSelectViewMode = (mode) => {
    setViewMode(mode);
    setShowViewModeMenu(false);
    AsyncStorage.setItem(VIEW_MODE_STORAGE_KEY, mode).catch(() => {});
  };

  const handleOpenQuickView = useCallback((item, isJob) => {
    setQuickViewItem({ item, isJob });
  }, []);

  const fetchFavoriteScholarships = useCallback(async (username) => {
    const startedAt = favoritesStore.mark();
    try {
      const data = await authAPI.getFavorites(username);
      favoritesStore.setItems("scholarships", normalizeListings(data), startedAt);
    } catch (error) {
      console.error("Could not fetch favorite scholarships:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const fetchFavoriteJobs = useCallback(async (username) => {
    const startedAt = favoritesStore.mark();
    try {
      const data = await authAPI.getJobFavorites(username);
      favoritesStore.setItems("jobs", normalizeListings(data), startedAt);
    } catch (error) {
      console.error("Could not fetch favorite jobs:", error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    if (user?.username) {
      if (selectedTab === "scholarships") {
        await fetchFavoriteScholarships(user.username);
      } else {
        await fetchFavoriteJobs(user.username);
      }
    }
  };

  // Shared by "Request All" for both tabs: charges ONE flat bulk fee (50
  // coins) that covers every not-yet-requested item in the batch, then opens
  // a single compose screen addressed to all of their contacts. Items
  // already requested (by this device or another) are skipped for free —
  // the server decides that, this never trusts a locally-cached set.
  const runBulkRequest = async (requestType, items, sendBulkFn, noun) => {
    if (!user?.username || bulkSending) return;

    if (items.length === 0) return;

    const isJobType = requestType === "job";
    const withEmail = items.filter((item) => item.contactProfessors?.[0]?.email);
    const eligible = withEmail.filter((item) => !isRequested(item.id, isJobType));

    // Previously this just silently did nothing when there was nothing new
    // to charge for — which looked exactly like "Request All doesn't work"
    // if you'd already requested everything, or if none of the saved items
    // had a contact email on file. Now it always tells you why.
    if (eligible.length === 0) {
      if (withEmail.length === 0) {
        showAlert(
          t("alerts.nothingToRequestTitle"),
          t(isJobType ? "alerts.noContactJob" : "alerts.noContactScholarship"),
          "info",
        );
      } else {
        showAlert(
          t("alerts.alreadyRequestedTitle"),
          t(isJobType ? "alerts.allRequestedJob" : "alerts.allRequestedScholarship"),
          "info",
        );
      }
      return;
    }

    setBulkSending(true);
    try {
      const spend = await chargeForBulkRequest(
        requestType,
        eligible.map((item) => item.id),
      );

      if (spend?.insufficientCoins) {
        setInsufficientCoinsInfo({ coins: spend.coins, required: spend.required });
        return;
      }
      if (spend?.alreadyRequested) {
        showAlert(
          t("alerts.alreadyRequestedTitle"),
          t(isJobType ? "alerts.batchRequestedJob" : "alerts.batchRequestedScholarship"),
          "info",
        );
        return;
      }
      if (!spend?.success) {
        showAlert(t("common.error"), t("alerts.coinsFailed"), "error");
        return;
      }

      const chargedSet = new Set(spend.chargedIds);
      const emails = eligible
        .filter((item) => chargedSet.has(item.id))
        .map((item) => item.contactProfessors[0].email);

      const result = await sendBulkFn(
        emails,
        user.username,
        `${noun === "job" ? "Job Application" : "Scholarship Request"} · ${emails.length} ${noun}${emails.length === 1 ? "" : "s"}`,
      );
      if (result && !result.success) {
        showAlert(t("common.error"), result.error || t("alerts.coinsFailed"), "error");
        return;
      }

      // The dropdown menu closes the instant this action is tapped, so a
      // small floating burst near the button would never be seen — a
      // confirmation alert is the reliable way to show the spend landed.
      showAlert(
        t("alerts.requestsSentTitle"),
        t("alerts.requestsSent", { spent: spend.spent, count: emails.length }),
        "success",
      );
    } finally {
      setBulkSending(false);
    }
  };

  const handleRequestAllScholarships = () =>
    runBulkRequest("scholarship", favoriteScholarships, sendBulkScholarshipEmail, "scholarship");

  const handleRequestAllJobs = () =>
    runBulkRequest("job", favoriteJobs, sendBulkJobEmail, "job");

  const handleRemoveAll = async () => {
    const isJob = selectedTab === "jobs";
    const itemsToRemove = isJob ? favoriteJobs : favoriteScholarships;
    if (itemsToRemove.length === 0) return;
    try {
      await Promise.all(
        itemsToRemove.map((item) =>
          isJob
            ? authAPI.removeJobFavorite(user.username, item.id)
            : authAPI.removeFavorite(user.username, item.id),
        ),
      );
      favoritesStore.clear(isJob ? "jobs" : "scholarships");
      await AsyncStorage.setItem(isJob ? "favoriteJobs" : "favoriteScholarships", JSON.stringify([]));
      refreshFavorites();
    } catch (error) {
      console.error("Error removing all favorites:", error);
      showAlert(t("common.error"), t("ui.confirm.removeAllFailed"), "error");
    }
  };

  // Alert actions close the modal right after onPress, so the follow-up work
  // (which may open its own alert) is deferred until that close has finished.
  const runAfterAlertCloses = (fn) => () => setTimeout(fn, 350);

  const confirmRemoveAll = () => {
    const count = (selectedTab === "jobs" ? favoriteJobs : favoriteScholarships).length;
    if (count === 0) return;
    showAlert(
      t("ui.confirm.removeAllTitle"),
      t("ui.confirm.removeAllMessage", { count: String(count) }),
      "warning",
      [
        { text: t("common.cancel"), secondary: true },
        {
          text: t("ui.confirm.removeAllConfirm"),
          destructive: true,
          onPress: runAfterAlertCloses(handleRemoveAll),
        },
      ],
    );
  };

  const confirmRequestAll = () => {
    const isJobTab = selectedTab === "jobs";
    const items = isJobTab ? favoriteJobs : favoriteScholarships;
    const eligibleCount = items.filter(
      (item) => item.contactProfessors?.[0]?.email && !isRequested(item.id, isJobTab),
    ).length;
    // Nothing chargeable: run directly so the existing "nothing to request" /
    // "already requested" explanation is shown instead of a pointless prompt.
    if (eligibleCount === 0) {
      (isJobTab ? handleRequestAllJobs : handleRequestAllScholarships)();
      return;
    }
    const cost = String(wallet?.pricing?.bulkRequest ?? 50);
    showAlert(
      t("ui.confirm.requestAllTitle"),
      t("ui.confirm.requestAllMessage", { cost, count: String(eligibleCount) }),
      "info",
      [
        { text: t("common.cancel"), secondary: true },
        {
          text: t("ui.confirm.requestAllConfirm", { cost }),
          onPress: runAfterAlertCloses(
            isJobTab ? handleRequestAllJobs : handleRequestAllScholarships,
          ),
        },
      ],
    );
  };

  useFocusEffect(
    useCallback(() => {
      if (user?.username) {
        fetchFavoriteScholarships(user.username);
        fetchFavoriteJobs(user.username);
      }
    }, [user?.username, fetchFavoriteScholarships, fetchFavoriteJobs]),
  );

  const handleRemoveFavorite = useCallback(async (item, isJob) => {
    const kind = isJob ? "jobs" : "scholarships";
    favoritesStore.remove(kind, item.id);
    try {
      if (isJob) {
        await authAPI.removeJobFavorite(user.username, item.id);
      } else {
        await authAPI.removeFavorite(user.username, item.id);
      }
      const ids = (favoritesStore.getState()[kind] || []).map((entry) => entry.id);
      AsyncStorage.setItem(isJob ? "favoriteJobs" : "favoriteScholarships", JSON.stringify(ids)).catch(() => {});
      refreshFavorites();
    } catch (error) {
      console.error("Error removing favorite:", error);
      // Put the real server state back after the optimistic removal.
      refreshFavorites();
    }
  }, [user, refreshFavorites]);

  const handleSendRequest = useCallback(
    async (item, isJob) => {
      if (!user?.username) return { success: false };
      if (isRequested(item.id, isJob)) return { success: false, alreadyRequested: true };

      const setFailed = isJob ? setFailedJobs : setFailedScholarships;
      const clearFailed = () =>
        setFailed((prev) => {
          if (!prev.has(item.id)) return prev;
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });

      const professor = item.contactProfessors?.[0];
      if (!professor?.email) {
        console.error(
          `Cannot send ${isJob ? "job" : "scholarship"} request: no contact email on file for "${item.title}"`,
        );
        setFailed((prev) => new Set(prev).add(item.id));
        return { success: false, noEmail: true };
      }

      // Coins are charged BEFORE the email opens — if there's nothing to
      // spend, no compose screen appears at all.
      const spend = await chargeForRequest(
        isJob ? "job" : "scholarship",
        item.id,
        item.title,
      );
      if (spend?.insufficientCoins) {
        setInsufficientCoinsInfo({ coins: spend.coins, required: spend.required });
        return spend;
      }
      if (spend?.alreadyRequested) {
        // Someone/something else already charged this between render and
        // tap — nothing failed, just nothing left to do.
        clearFailed();
        return spend;
      }
      if (!spend?.success) {
        setFailed((prev) => new Set(prev).add(item.id));
        return spend;
      }

      try {
        const result = isJob
          ? await sendJobEmail(professor.email, user.username, item.title, professor)
          : await sendScholarshipEmail(professor.email, user.username, item.title, professor);

        if (result && !result.success) {
          throw new Error(result.error || "Failed to open mail composer");
        }
        clearFailed();
        return { ...spend, sent: true };
      } catch (error) {
        // Coins were already spent and the item is already marked requested
        // server-side (matching "the request itself" — composing the
        // pre-filled email — rather than gating on Gmail's own send
        // confirmation, which Android can't reliably report). A failure
        // here just means the mail app didn't open; it doesn't undo the
        // charge, so this only flags the send UI, not the wallet.
        console.error(`Failed to open ${isJob ? "job" : "scholarship"} request email:`, error);
        setFailed((prev) => new Set(prev).add(item.id));
        return { ...spend, sent: false };
      }
    },
    [user, isRequested, chargeForRequest],
  );

  const renderScholarshipItem = useCallback(
    ({ item }) => {
      if (viewMode === "list") {
        return (
          <FavoriteListItem
            item={item}
            isJob={false}
            isRequested={isRequested(item.id, false)}
            onRemove={handleRemoveFavorite}
            onPress={handleOpenQuickView}
            styles={styles}
          />
        );
      }
      if (viewMode === "grid") {
        return (
          <FavoriteGridTile
            item={item}
            isJob={false}
            isRequested={isRequested(item.id, false)}
            onRemove={handleRemoveFavorite}
            onPress={handleOpenQuickView}
            styles={styles}
          />
        );
      }
      return (
        <FavoriteCard
          item={item}
          isJob={false}
          isRequested={isRequested(item.id, false)}
          isFailed={failedScholarships.has(item.id)}
          iconSize={bannerFallbackIconSize}
          onRequest={handleSendRequest}
          onRemove={handleRemoveFavorite}
          styles={styles}
        />
      );
    },
    [
      viewMode,
      wallet?.requestedScholarshipIds,
      isRequested,
      failedScholarships,
      bannerFallbackIconSize,
      handleSendRequest,
      handleRemoveFavorite,
      handleOpenQuickView,
      styles,
    ],
  );

  const renderJobItem = useCallback(
    ({ item }) => {
      if (viewMode === "list") {
        return (
          <FavoriteListItem
            item={item}
            isJob={true}
            isRequested={isRequested(item.id, true)}
            onRemove={handleRemoveFavorite}
            onPress={handleOpenQuickView}
            styles={styles}
          />
        );
      }
      if (viewMode === "grid") {
        return (
          <FavoriteGridTile
            item={item}
            isJob={true}
            isRequested={isRequested(item.id, true)}
            onRemove={handleRemoveFavorite}
            onPress={handleOpenQuickView}
            styles={styles}
          />
        );
      }
      return (
        <FavoriteCard
          item={item}
          isJob={true}
          isRequested={isRequested(item.id, true)}
          isFailed={failedJobs.has(item.id)}
          iconSize={bannerFallbackIconSize}
          onRequest={handleSendRequest}
          onRemove={handleRemoveFavorite}
          styles={styles}
        />
      );
    },
    [
      viewMode,
      wallet?.requestedJobIds,
      isRequested,
      failedJobs,
      bannerFallbackIconSize,
      handleSendRequest,
      handleRemoveFavorite,
      handleOpenQuickView,
      styles,
    ],
  );

  const renderEmptyState = (dataType) => {
    const isJob = dataType === "jobs";
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={isJob ? "briefcase-outline" : "school-outline"}
          size={64}
          color={colors.border}
        />
        <Text style={styles.emptyTitle}>
          {refreshing
            ? t("common.loading")
            : t(isJob ? "favouritesScreen.noFavouriteJobs" : "favouritesScreen.noFavouriteScholarships")}
        </Text>
        <Text style={styles.emptySubtext}>
          {refreshing
            ? "Fetching your favourites…"
            : `Tap the heart icon on any ${isJob ? "job" : "scholarship"} to save it here.`}
        </Text>
      </View>
    );
  };

  if (!user || !user.username) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>
          Please log in to view your favorites.
        </Text>
      </View>
    );
  }

  const currentData =
    selectedTab === "scholarships" ? favoriteScholarships : favoriteJobs;

  const quickViewIsRequested = quickViewItem
    ? isRequested(quickViewItem.item.id, quickViewItem.isJob)
    : false;
  const quickViewIsFailed = quickViewItem
    ? (quickViewItem.isJob ? failedJobs : failedScholarships).has(
        quickViewItem.item.id,
      )
    : false;

  return (
    <View style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"} />
      <View
        style={styles.headerContainer}
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h && h !== headerHeight) setHeaderHeight(h);
        }}
      >
        <ScreenHeader
          icons={[
            {
              key: "viewMode",
              name:
                viewMode === "list"
                  ? "list-outline"
                  : viewMode === "grid"
                    ? "grid-outline"
                    : "albums-outline",
              onPress: () => setShowViewModeMenu(true),
              accessibilityLabel: t("ui.a11y.changeView"),
            },
            {
              key: "actions",
              name: "ellipsis-vertical",
              onPress: () => setShowMenu((v) => !v),
              accessibilityLabel: t("ui.a11y.moreOptions"),
            },
          ]}
          onMenuPress={() => setMenuVisible(true)}
        />

        <View style={styles.pageTitleRow}>
          <Text style={styles.pageTitle}>{t("favourites.title")}</Text>
          {isBoth && (
            <ExploreSwitch
              value={selectedTab}
              onChange={goToTab}
              labels={{ scholarships: t("explore.universities"), jobs: t("explore.companies") }}
            />
          )}
        </View>

        <View style={styles.favCountsRow}>
          {showUniversities && (
            <Text style={[styles.favCountText, selectedTab === "scholarships" && styles.favCountTextActive]}>
              {favoriteScholarships.length} {t("explore.universities")}
            </Text>
          )}
          {isBoth && <Text style={styles.favCountDivider}>·</Text>}
          {showCompanies && (
            <Text style={[styles.favCountText, selectedTab === "jobs" && styles.favCountTextActive]}>
              {favoriteJobs.length} {t("explore.companies")}
            </Text>
          )}
        </View>
      </View>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setShowMenu(false)}
          />
          <View style={styles.dropdown}>
            <TouchableOpacity
              style={styles.dropdownItem}
              disabled={currentData.length === 0 || bulkSending}
              onPress={() => { confirmRequestAll(); setShowMenu(false); }}
            >
              <Ionicons name="send" size={16} color={currentData.length === 0 || bulkSending ? colors.border : colors.accent} />
              <Text style={[styles.dropdownText, (currentData.length === 0 || bulkSending) && styles.dropdownTextDisabled]}>
                {bulkSending
                  ? t("favouritesScreen.sending")
                  : `${t("favouritesScreen.requestAll")} (${wallet?.pricing?.bulkRequest ?? 50} ${t("wallet.coins")})`}
              </Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              disabled={currentData.length === 0}
              onPress={() => { confirmRemoveAll(); setShowMenu(false); }}
            >
              <Ionicons name="trash-outline" size={16} color={currentData.length === 0 ? colors.border : colors.danger} />
              <Text style={[styles.dropdownText, styles.dropdownTextDanger, currentData.length === 0 && styles.dropdownTextDisabled]}>
                {t("ui.confirm.removeAllConfirm")}
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <ScrollView
        ref={pagerRef}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handlePagerScrollEnd}
        scrollEventThrottle={16}
      >
        <View style={[styles.pagePaneDivider, { width: pageWidth, height: "100%" }]}>
          <FlatList
            key={viewMode}
            style={{ flex: 1 }}
            data={favoriteScholarships}
            extraData={wallet?.requestedScholarshipIds}
            renderItem={renderScholarshipItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            contentContainerStyle={{
              paddingTop: headerHeight + 8,
              paddingBottom: scale(100),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                progressViewOffset={headerHeight}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={() => renderEmptyState("scholarships")}
          />
        </View>
        <View style={{ width: pageWidth, height: "100%" }}>
          <FlatList
            key={viewMode}
            style={{ flex: 1 }}
            data={favoriteJobs}
            extraData={wallet?.requestedJobIds}
            renderItem={renderJobItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            contentContainerStyle={{
              paddingTop: headerHeight + 8,
              paddingBottom: scale(100),
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                progressViewOffset={headerHeight}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={() => renderEmptyState("jobs")}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showViewModeMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewModeMenu(false)}
      >
        <TouchableOpacity
          style={styles.viewModeOverlay}
          activeOpacity={1}
          onPress={() => setShowViewModeMenu(false)}
        >
          <View style={styles.viewModeMenu}>
            {VIEW_MODE_OPTIONS.map((option) => {
              const selected = viewMode === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={styles.viewModeOption}
                  activeOpacity={0.7}
                  onPress={() => handleSelectViewMode(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={18}
                    color={selected ? colors.accent : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.viewModeOptionText,
                      selected && styles.viewModeOptionTextActive,
                    ]}
                  >
                    {t(option.labelKey)}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={!!quickViewItem}
        transparent
        animationType="slide"
        onRequestClose={() => setQuickViewItem(null)}
      >
        <View style={styles.quickViewOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setQuickViewItem(null)}
          />
          <View style={styles.quickViewSheet}>
            <View style={styles.quickViewHeader}>
              <Text style={styles.quickViewHeaderTitle}>{t("ui.a11y.viewDetails")}</Text>
              <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setQuickViewItem(null)}
                style={styles.quickViewCloseBtn}
                accessibilityRole="button" accessibilityLabel={t("common.close")}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.quickViewScrollContent}
            >
              {quickViewItem && (
                <FavoriteCard
                  item={quickViewItem.item}
                  isJob={quickViewItem.isJob}
                  isRequested={quickViewIsRequested}
                  isFailed={quickViewIsFailed}
                  iconSize={bannerFallbackIconSize}
                  onRequest={handleSendRequest}
                  onRemove={(item, isJob) => {
                    handleRemoveFavorite(item, isJob);
                    setQuickViewItem(null);
                  }}
                  styles={styles}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions.length > 0 ? alertConfig.actions : [{ text: t("common.ok"), onPress: closeAlert }]}
        onClose={closeAlert}
      />

      <InsufficientCoinsModal
        visible={!!insufficientCoinsInfo}
        coins={insufficientCoinsInfo?.coins ?? 0}
        required={insufficientCoinsInfo?.required ?? 0}
        onClose={() => setInsufficientCoinsInfo(null)}
      />
    </View>
  );
};

export default FavoriteItemsList;
