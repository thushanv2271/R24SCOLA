import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useContext,
  useCallback,
  useDeferredValue,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  Dimensions,
  TextInput,
  Keyboard,
  Pressable,
  ActivityIndicator,
} from "react-native";
import RefreshControl from "../../components/ui/AppRefreshControl";
import ReAnimated from "react-native-reanimated";
import { useCollapseScroll } from "../ui/motion";
import { Image } from "expo-image";
import { openExternalUrl } from "../../utils/openExternalUrl";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useNavigation, useFocusEffect, router } from "expo-router";
import { sendJobEmail } from "../../services/emailService";
import CoinSpendBurst from "../../components/wallet/CoinSpendBurst";
import InsufficientCoinsModal from "../../components/wallet/InsufficientCoinsModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../components/AuthContext";
import { LanguageContext } from "../../components/LanguageContext";
import { ListingListItem, ListingGridTile } from "../../components/blocks/ListingRows";
import { useTheme } from "../../components/ThemeContext";
import { playSound } from "../../utils/feedback";
import { buildSuggestions, searchListings } from "../../utils/listingSearch";
import { authAPI, creatorListingsAPI } from "../../services/apiService";
import { favoritesStore, useFavorites } from "../../services/favoritesStore";
import { loadListingsOfKind } from "../../services/listingsCache";
import LoaderModal from "../../components/ui/LoaderModal";
import SkeletonCard from "../../components/ui/SkeletonCard";
import BottomModal from "../../components/BottomModal";
import NotificationModal from "../../components/NotificationModal";
import AlertModal from "../../components/AlertModal";
import ScolaMenu from "../../components/ScolaMenu";
import CardOverlayActions from "../../components/blocks/CardOverlayActions";
import RequestButton from "../../components/blocks/RequestButton";
import CreatorListingsSection from "../../components/blocks/CreatorListingsSection";
import { COUNTRIES, FUNDING_TYPES } from "../../constants/filterOptions";
import { KIND_COMPANY, getGroupNames, getSubcategories } from "../../constants/categories";

// Create an animated version of FlatList
const AnimatedFlatList = ReAnimated.createAnimatedComponent(FlatList);

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const modalHeight = screenHeight * 0.82;

const VIEW_MODE_OPTIONS = [
  { value: "card", labelKey: "explore.cardView", icon: "albums-outline" },
  { value: "list", labelKey: "explore.listView", icon: "list-outline" },
  { value: "grid", labelKey: "explore.gridView", icon: "grid-outline" },
];
const VIEW_MODE_STORAGE_KEY = "@jobs_view_mode";

const ScholarshipCard = React.memo(
  ({
    item,
    handleFavorite,
    isFavorite,
    requestCost,
    coins,
    username,
    showAlert,
    chargeForRequest,
    isRequested,
    onInsufficientCoins,
  }) => {
    const { t } = useContext(LanguageContext);
    const { colors } = useTheme();
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);
    const [burnTrigger, setBurnTrigger] = useState(0);
    const [sending, setSending] = useState(false);
    const [heartBurstVisible, setHeartBurstVisible] = useState(false);
    const lastImageTapRef = useRef(0);
    const heartScale = useRef(new Animated.Value(0)).current;
    const heartOpacity = useRef(new Animated.Value(0)).current;

    const triggerHeartBurst = () => {
      setHeartBurstVisible(true);
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.parallel([
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 600,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setHeartBurstVisible(false));
    };

    const handleImageTap = () => {
      const now = Date.now();
      if (now - lastImageTapRef.current < 300) {
        lastImageTapRef.current = 0;
        if (!isFavorite) {
          handleFavorite(item.id);
        }
        triggerHeartBurst();
      } else {
        lastImageTapRef.current = now;
      }
    };

    const handleRequestScholarship = async () => {
      if (isRequested || sending) return;
      setSending(true);
      try {
        const spend = await chargeForRequest("job", item.id, item.title);
        if (spend?.insufficientCoins) {
          onInsufficientCoins?.({ coins: spend.coins, required: spend.required });
          return;
        }
        if (spend?.alreadyRequested) {
          showAlert(
            t("explore.requested"),
            t("ui.errors.alreadyRequested"),
            "info",
          );
          return;
        }
        if (!spend?.success) {
          showAlert(t("common.error"), spend?.message || t("ui.errors.generic"), "error");
          return;
        }
        setBurnTrigger(Date.now());

        const professor = item.contactProfessors?.[0];
        const result = await sendJobEmail(
          professor?.email,
          username,
          item.title,
          professor
        );
        if (result && !result.success) {
          showAlert(t("common.error"), result.error, "error");
        }
      } finally {
        setSending(false);
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return (
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={styles.imageContainer}>
          {item.images?.length ? (
          <FlatList
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageList}
            data={item.images}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            keyExtractor={(image, index) => `${item.id}-image-${index}`}
            renderItem={({ item: imageUri }) => (
              <Pressable onPress={handleImageTap}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.cardImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  priority="normal"
                />
              </Pressable>
            )}
          />
          ) : (
            <View style={[styles.imageList, { backgroundColor: colors.surfaceAlt, alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="briefcase-outline" size={56} color={colors.textMuted} />
            </View>
          )}
          {heartBurstVisible && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.heartBurstOverlay,
                { opacity: heartOpacity, transform: [{ scale: heartScale }] },
              ]}
            >
              <FontAwesome name="heart" size={80} color="#fff" />
            </Animated.View>
          )}
          <CardOverlayActions
            isFavorite={isFavorite}
            onToggleFavorite={() => handleFavorite(item.id)}
            onShare={() =>
              router.push({
                pathname: "/CreateCommunityPost",
                params: {
                  type: "job",
                  linkedListingId: item.id,
                  linkedTargetName: item.university || "",
                  linkedCategory: item.category || "",
                  linkedTitle: item.title || "",
                  linkedImages: JSON.stringify(item.images || []),
                },
              })
            }
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{item.university}</Text>
          <View style={styles.cardDateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.cardDate, { color: colors.textMuted }]}>
              {t("ui.card.posted", { date: formatDate(item.createdAt) })}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            <View style={styles.tagsWrap}>
              <Text style={styles.tagPrimary}>{t("menu.jobs")}</Text>
              <Text style={styles.tagCountry}>{item.country}</Text>
              <Text style={styles.tagMajor}>{item.subcategory || item.major}</Text>
            </View>
            <View style={styles.requestSlot}>
              <CoinSpendBurst triggerKey={burnTrigger} amount={requestCost} />
              <RequestButton
                label={t("explore.requestJob")}
                requestedLabel={t("explore.requested")}
                cost={requestCost}
                balance={coins}
                sending={sending}
                requested={isRequested}
                onConfirm={handleRequestScholarship}
              />
            </View>
          </View>


          <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
            style={styles.dropdownToggle}
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
              {item.contactProfessors?.map((professor, index) => (
                <View
                  key={`${item.id}-professor-${index}`}
                  style={styles.professorContainer}
                >
                  <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                    <Text style={[styles.boldText, { color: colors.textPrimary }]}>Website:</Text>{" "}
                    <Text
                      style={[styles.linkText, { color: colors.accent }]}
                      onPress={() => openExternalUrl(item.universityWebsite)}
                    >
                      {item.universityWebsite}
                    </Text>
                  </Text>

                  <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                    <Text style={[styles.boldText, { color: colors.textPrimary }]}>Email:</Text>{" "}
                    {professor.email}
                  </Text>

                  <Text style={[styles.dropdownText, { color: colors.textSecondary }]}>
                    <Text style={[styles.boldText, { color: colors.textPrimary }]}>Office:</Text>{" "}
                    {professor.office}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item.id === nextProps.item.id &&
    prevProps.item === nextProps.item &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.requestCost === nextProps.requestCost &&
    prevProps.coins === nextProps.coins &&
    prevProps.isRequested === nextProps.isRequested
);

const ScholarshipApp = ({ categoryRequest, searchQuery, setSearchQuery, onSuggestionsChange, onHeaderChange, collapse, collapseMax, topInset = 0 }) => {
  const [scholarships, setScholarships] = useState([]);
  const [creatorListings, setCreatorListings] = useState([]);
  const { user, logout, favoritesRefreshTrigger, refreshFavorites, chargeForRequest, isRequested, wallet } =
    useContext(AuthContext);
  const requestCost = wallet?.pricing?.jobRequest ?? 20;
  const coins = wallet?.coins;
  const hasDataRef = useRef(false);
  const deferredQuery = useDeferredValue(searchQuery);
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [insufficientCoinsInfo, setInsufficientCoinsInfo] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info", actions: [] });
  const showAlert = (title, message, type = "info", actions = []) => { setAlertConfig({ visible: true, title, message, type, actions }); };
  const closeAlert = () => { setAlertConfig({ ...alertConfig, visible: false }); };

  const loadCreatorListings = useCallback(async () => {
    try {
      const data = await creatorListingsAPI.getByType("company");
      setCreatorListings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading creator company listings:", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCreatorListings();
    }, [loadCreatorListings]),
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("");

  // Home's category cards open Explore with a category already chosen.
  useEffect(() => {
    if (!categoryRequest) return;
    setSelectedCategory(categoryRequest.category || "");
    setSelectedMajor(categoryRequest.subcategory || "");
    setSelectedCountry("");
    setSelectedFunding("");
    setSelectedTest("");
  }, [categoryRequest]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedFunding, setSelectedFunding] = useState("");
  const [selectedTest, setSelectedTest] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [viewMode, setViewMode] = useState("card");
  const [showViewModeMenu, setShowViewModeMenu] = useState(false);
  const [quickViewItem, setQuickViewItem] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const onListScroll = useCollapseScroll(collapse, collapseMax);
  const filterModalY = useRef(new Animated.Value(screenHeight)).current;
  const listRef = useRef(null);
  const navigation = useNavigation();

  // Tapping the tab icon while already on this tab scrolls back to the top.
  // (When this screen is pushed as /Itjobs the event never fires — harmless.)
  useEffect(() => {
    const unsubscribe = navigation.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        const node = listRef.current;
        const list = node?.scrollToOffset ? node : node?.getNode?.();
        list?.scrollToOffset({ offset: 0, animated: true });
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Use imported constants (not recreated on every render)
  const categoryNames = getGroupNames(KIND_COMPANY);
  const countries = COUNTRIES;
  const fundingTypes = FUNDING_TYPES;

  const isPaidMember = user?.paidMember || false;

  const [favoriteJobs, setFavoriteJobs] = useState([]);
  const favoriteSet = useMemo(() => new Set(favoriteJobs), [favoriteJobs]);
  const favoritesRef = useRef(favoriteJobs);
  favoritesRef.current = favoriteJobs;
  const sharedFavorites = useFavorites();
  const jobsRef = useRef(scholarships);
  jobsRef.current = scholarships;

  useEffect(() => {
    if (sharedFavorites.jobs) {
      setFavoriteJobs(sharedFavorites.jobs.map((item) => item.id));
    }
  }, [sharedFavorites.jobs]);

  useEffect(() => {
    if (showFilterModal) {
      Animated.timing(filterModalY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterModalY, {
        toValue: screenHeight,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showFilterModal]);

  useEffect(() => {
    const loadFavorites = async () => {
      const favorites = await AsyncStorage.getItem("favoriteJobs");
      if (favorites) setFavoriteJobs(JSON.parse(favorites));
    };
    loadFavorites();

    if (user && user.username) fetchFavorites();
  }, [user, favoritesRefreshTrigger]);

  useEffect(() => {
    AsyncStorage.setItem("favoriteJobs", JSON.stringify(favoriteJobs)).catch(
      (error) => console.error("Error saving favorite jobs:", error)
    );
  }, [favoriteJobs]);

  const fetchFavorites = async () => {
    try {
      const data = await authAPI.getJobFavorites(user.username);
      const favoriteIds = Array.isArray(data) ? data.map((s) => s.id) : [];
      setFavoriteJobs(favoriteIds);
      await AsyncStorage.setItem("favoriteJobs", JSON.stringify(favoriteIds));
    } catch (error) {
      console.error("Error fetching favorites:", error);
    }
  };

  const handleFavorite = useCallback(
    async (id) => {
      const previousFavorites = favoritesRef.current;
      const isFavorited = previousFavorites.includes(id);
      if (!isFavorited) playSound("favorite");
      const updatedFavorites = isFavorited
        ? previousFavorites.filter((favId) => favId !== id)
        : [...previousFavorites, id];

      setFavoriteJobs(updatedFavorites);
      if (isFavorited) {
        favoritesStore.remove("jobs", id);
      } else {
        const listing = jobsRef.current.find((entry) => entry.id === id);
        if (listing) favoritesStore.add("jobs", listing);
      }

      try {
        if (isFavorited) {
          await authAPI.removeJobFavorite(user.username, id);
        } else {
          await authAPI.addJobFavorite(user.username, id);
        }
        refreshFavorites();
      } catch (error) {
        console.error(
          `Error ${isFavorited ? "removing" : "adding"} favorite:`,
          error
        );
        setFavoriteJobs(previousFavorites);
        refreshFavorites();
        showAlert(
          t("common.error"),
          t(isFavorited ? "alerts.favoriteRemoveFailed" : "alerts.favoriteAddFailed"),
          "error"
        );
      }
    },
    [user?.username, refreshFavorites, t]
  );

  const handleFavoriteRef = useRef(handleFavorite);
  handleFavoriteRef.current = handleFavorite;
  const onFavorite = useCallback((id) => handleFavoriteRef.current(id), []);

  const fetchData = async (forceRefresh = false) => {
    if (!hasDataRef.current) setLoading(true);
    try {
      const data = await loadListingsOfKind(KIND_COMPANY, { force: forceRefresh });
      setScholarships(data);
      hasDataRef.current = true;
    } catch (error) {
      console.error(error);
      showAlert(t("common.error"), t("alerts.loadFailed"), "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const searchSuggestions = useMemo(
    () => buildSuggestions(scholarships, deferredQuery, [["university", "Company"], ["title", "Role"], ["country", "Country"]]),
    [deferredQuery, scholarships],
  );

  useEffect(() => {
    onSuggestionsChange?.(searchSuggestions);
  }, [searchSuggestions]);

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

  const filteredScholarships = useMemo(() => {
    const filtered = scholarships.filter((item) => {
      const categoryMatch = !selectedCategory || item.category === selectedCategory;
      const majorMatch = !selectedMajor || item.subcategory === selectedMajor;
      const countryMatch = !selectedCountry || item.country === selectedCountry;
      const fundingMatch = !selectedFunding || item.funding === selectedFunding;
      const testMatch =
        !selectedTest || item.languageTests?.includes(selectedTest);
      return categoryMatch && majorMatch && countryMatch && fundingMatch && testMatch;
    });
    return searchListings(filtered, deferredQuery, { rank: true });
  }, [
    scholarships,
    selectedCategory,
    selectedMajor,
    selectedCountry,
    selectedFunding,
    selectedTest,
    deferredQuery,
  ]);

  const router = useRouter();

  const activeFilterCount = [selectedCategory, selectedMajor, selectedCountry, selectedFunding, selectedTest].filter(Boolean).length;

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedMajor("");
    setSelectedCountry("");
    setSelectedFunding("");
    setSelectedTest("");
  };

  const renderChipGroup = (label, options, selected, setSelected) => (
    <View style={styles.chipGroup}>
      <Text style={[styles.chipGroupLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={styles.chipRow}>
        {options.map((item) => {
          const displayText = typeof item === "string" ? item : `${item.flag} ${item.name}`;
          const value = typeof item === "string" ? item : item.name;
          const isSelected = selected === value;
          return (
            <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              key={value}
              style={[
                styles.chip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                isSelected && styles.chipSelected,
              ]}
              onPress={() => setSelected(isSelected ? "" : value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, { color: colors.textSecondary }, isSelected && styles.chipTextSelected]}>
                {displayText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderItem = useCallback(
    ({ item }) => {
      if (viewMode === "list") {
        return (
          <ListingListItem
            item={item}
            handleFavorite={onFavorite}
            isFavorite={favoriteSet.has(item.id)}
            onPress={setQuickViewItem}
            variant="job"
          />
        );
      }
      if (viewMode === "grid") {
        return (
          <ListingGridTile
            item={item}
            handleFavorite={onFavorite}
            isFavorite={favoriteSet.has(item.id)}
            onPress={setQuickViewItem}
          />
        );
      }
      return (
        <ScholarshipCard
          item={item}
          handleFavorite={onFavorite}
          isFavorite={favoriteSet.has(item.id)}
          requestCost={requestCost}
          coins={coins}
          username={user?.username}
          showAlert={showAlert}
          chargeForRequest={chargeForRequest}
          isRequested={isRequested(item.id, true)}
          onInsufficientCoins={setInsufficientCoinsInfo}
        />
      );
    },
    [viewMode, onFavorite, favoriteSet, requestCost, coins, user?.username, chargeForRequest, isRequested]
  );

  // Scrolls away with the list so cards get the full screen mid-scroll;
  // the slim logo/filter/menu bar above stays fixed.
  const listHeader = (
    <View>
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {filteredScholarships.length}{" "}
            {filteredScholarships.length === 1 ? "job" : "jobs"} found
          </Text>
          {activeFilterCount > 0 && (
            <TouchableOpacity
              style={styles.clearAllBtn}
              onPress={resetFilters}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={14} color={colors.accent} />
              <Text style={[styles.clearAllText, { color: colors.accent }]}>
                Clear filters ({activeFilterCount})
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <CreatorListingsSection listings={creatorListings} type="company" />
    </View>
  );

  // The header lives in the Explore pager screen so it stays put while the
  // pages swipe; each page just tells it which buttons to show.
  useEffect(() => {
    onHeaderChange?.({
      icons: [
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
          key: "filter",
          name: "funnel",
          accessibilityLabel: t("ui.a11y.filters"),
          onPress: () => setShowFilterModal(true),
          active: activeFilterCount > 0,
          badgeCount: activeFilterCount,
        },
      ],
      onMenuPress: () => setMenuVisible(true),
    });
  }, [viewMode, activeFilterCount, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <StatusBar barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"} />
      <BottomModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          />
          <Animated.View
            style={[styles.bottomModalContent, { backgroundColor: colors.surfaceAlt }, { transform: [{ translateY: filterModalY }] }]}
          >
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />

            <View style={styles.filterHeader}>
              <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }} onPress={() => setShowFilterModal(false)} style={[styles.filterHeaderClose, { backgroundColor: colors.surface }]} accessibilityRole="button" accessibilityLabel={t("common.close")}>
                <Ionicons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
              <Text style={[styles.filterHeaderTitle, { color: colors.textPrimary }]}>
                Filters {activeFilterCount > 0 && <Text style={[styles.filterBadge, { color: colors.accent }]}> {activeFilterCount}</Text>}
              </Text>
              <TouchableOpacity onPress={resetFilters} style={styles.filterHeaderReset}>
                <Text style={[styles.filterHeaderResetText, { color: colors.accent }]}>Reset all</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.filterDivider, { backgroundColor: colors.divider }]} />

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.filterScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {renderChipGroup("Category", categoryNames, selectedCategory, (value) => {
                setSelectedCategory(value);
                setSelectedMajor("");
              })}
              {!!selectedCategory && renderChipGroup("Role", getSubcategories(KIND_COMPANY, selectedCategory), selectedMajor, setSelectedMajor)}
              <View style={[styles.filterDivider, { backgroundColor: colors.divider }]} />
              {renderChipGroup("Country", countries, selectedCountry, setSelectedCountry)}
            </ScrollView>

            <View style={[styles.filterFooter, { backgroundColor: colors.surfaceAlt, borderTopColor: colors.divider }]}>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilterModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.applyButtonText}>
                  Show Results{filteredScholarships.length > 0 ? ` · ${filteredScholarships.length}` : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

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
          <View style={[styles.viewModeMenu, { backgroundColor: colors.surface }]}>
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
                      { color: colors.textSecondary },
                      selected && [styles.viewModeOptionTextActive, { color: colors.accent }],
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
          <View style={[styles.quickViewSheet, { backgroundColor: colors.screenBackground }]}>
            <View style={[styles.quickViewHeader, { backgroundColor: colors.surface, borderBottomColor: colors.divider }]}>
              <Text style={[styles.quickViewHeaderTitle, { color: colors.textPrimary }]}>Details</Text>
              <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => setQuickViewItem(null)}
                style={[styles.quickViewCloseBtn, { backgroundColor: colors.surfaceAlt }]}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.quickViewScrollContent}
            >
              {quickViewItem && (
                <ScholarshipCard
                  item={quickViewItem}
                  handleFavorite={onFavorite}
                  isFavorite={favoriteSet.has(quickViewItem.id)}
                  requestCost={requestCost}
                  coins={coins}
                  username={user?.username}
                  showAlert={showAlert}
                  chargeForRequest={chargeForRequest}
                  isRequested={isRequested(quickViewItem.id, true)}
                  onInsufficientCoins={setInsufficientCoinsInfo}
                />
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {loading ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingTop: topInset, paddingBottom: 20 }}
        >
          {listHeader}
          <View style={{ marginTop: 12 }} />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </ScrollView>
      ) : isPaidMember ? (
        (
          <AnimatedFlatList
            key={viewMode}
            ref={listRef}
            ListHeaderComponent={listHeader}
            keyboardShouldPersistTaps="handled"
            data={filteredScholarships}
            extraData={favoriteJobs}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={viewMode === "grid" ? 2 : 1}
            columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
            onScroll={onListScroll}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                progressViewOffset={topInset}
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            contentContainerStyle={{ paddingTop: topInset, paddingBottom: 20 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={64} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No jobs found</Text>
                <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                  No results match your current filters.{"\n"}Try adjusting or
                  clearing them.
                </Text>
                <TouchableOpacity
                  style={styles.clearFiltersBtn}
                  onPress={resetFilters}
                >
                  <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )
      ) : (
        <AnimatedFlatList
          key={viewMode}
          ref={listRef}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          data={filteredScholarships.slice(0, 20)}
          extraData={favoriteJobs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          onScroll={onListScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl progressViewOffset={topInset} refreshing={refreshing} onRefresh={handleRefresh} />
          }
          removeClippedSubviews={true}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={3}
          contentContainerStyle={{ paddingTop: topInset, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>No jobs found</Text>
              <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>
                No results match your current filters.{"\n"}Try adjusting or
                clearing them.
              </Text>
              <TouchableOpacity
                style={styles.clearFiltersBtn}
                onPress={resetFilters}
              >
                <Text style={styles.clearFiltersBtnText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 16,
  },

  gridRow: {
    gap: 12,
  },

  viewModeOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.15)",
    alignItems: "flex-end",
    paddingTop: (StatusBar.currentHeight || 0) + 64,
    paddingRight: 16,
  },
  viewModeMenu: {
    backgroundColor: "#fff",
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
    color: "#374151",
    fontWeight: "500",
  },
  viewModeOptionTextActive: {
    color: "#004aad",
    fontWeight: "700",
  },
  quickViewOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  quickViewSheet: {
    maxHeight: screenHeight * 0.88,
    backgroundColor: "#f5f5f5",
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
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  quickViewHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
  },
  quickViewCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  quickViewScrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  resultsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearAllText: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#004aad",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBackground: {
    backgroundColor: "#f1f5f9",
    borderRadius: 50,
    padding: 8,
    elevation: 2,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 10,
    gap: 8,
  },
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
  imageContainer: {
    position: "relative",
    width: "100%",
    height: 210,
  },
  imageList: {
    width: "100%",
    height: 210,
  },
  heartBurstOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    textBreakStrategy: "simple",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13.5,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#666",
    marginBottom: 4,
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
    textBreakStrategy: "simple",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 4,
  },
  requestSlot: {
    position: "relative",
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
    textBreakStrategy: "simple",
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
  subscribecontainer: {
    padding: "4%",
  },
  logo: {
    width: 150,
    height: 50,
  },
  dropdownContent: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 10,
  },
  dropdownText: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    lineHeight: 17,
    marginBottom: 4,
  },
  boldText: {
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  linkText: {
    color: "#004aad",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    textDecorationLine: "underline",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Replaces the old full-width "Request Job" button pinned to the card's
  // bottom — a compact icon sitting right after the tags instead.
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
  dropdownToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  dropdownToggleText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#004aad",
  },
  professorContainer: {
    marginBottom: "2%",
  },
  cardImage: {
    width: screenWidth - 32,
    height: 210,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#64748b",
    textBreakStrategy: "simple",
  },
  likeButton: {
    position: "absolute",
    top: 10,
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
  shareToCommunityButton: {
    position: "absolute",
    bottom: 10,
    left: 10,
    backgroundColor: "rgba(0, 74, 173, 0.85)",
    borderRadius: 20,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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
    color: "#334155",
    fontFamily: "Roboto",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    fontFamily: "Roboto",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 24,
  },
  clearFiltersBtn: {
    backgroundColor: "#004aad",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 30,
  },
  clearFiltersBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    fontFamily: "Roboto",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomModalContent: {
    width: "100%",
    height: modalHeight,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#d1d5db",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  filterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  filterHeaderClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  filterHeaderTitle: {
    fontSize: screenWidth * 0.047,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  filterBadge: {
    color: "#004aad",
    fontWeight: "700",
  },
  filterHeaderReset: {
    paddingHorizontal: 4,
  },
  filterHeaderResetText: {
    fontSize: screenWidth * 0.037,
    color: "#004aad",
    fontWeight: "600",
    fontFamily: "Roboto",
  },
  filterDivider: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  filterScrollContent: {
    paddingBottom: 16,
  },
  chipGroup: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chipGroupLabel: {
    fontSize: screenWidth * 0.038,
    fontWeight: "700",
    color: "#374151",
    fontFamily: "Roboto",
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  chipSelected: {
    backgroundColor: "#004aad",
    borderColor: "#004aad",
  },
  chipText: {
    fontSize: screenWidth * 0.035,
    color: "#374151",
    fontFamily: "Roboto",
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  filterFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  applyButton: {
    backgroundColor: "#004aad",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  applyButtonText: {
    color: "#fff",
    fontSize: screenWidth * 0.042,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  iconBackgroundActive: {
    backgroundColor: "#004aad",
  },
  filterActiveBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  filterActiveBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  messageText: {
    fontSize: screenWidth * 0.04,
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#333333",
    textAlign: "center",
    marginBottom: "3%",
  },
  subscribeLink: {
    fontSize: screenWidth * 0.04,
    fontWeight: "bold",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
    color: "#004aad",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});

export default ScholarshipApp;

