import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RefreshControl from "../../components/ui/AppRefreshControl";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";
import { setExploreTab, setExploreSearch, setExploreCategory } from "../../components/exploreTabStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthContext } from "../../components/AuthContext";
import { LanguageContext } from "../../components/LanguageContext";
import { useTheme } from "../../components/ThemeContext";
import { authAPI, calculatorAPI, communityAPI } from "../../services/apiService";
import { useFavorites } from "../../services/favoritesStore";
import NotificationModal from "../../components/NotificationModal";
import AlertModal from "../../components/AlertModal";
import ScolaMenu from "../../components/ScolaMenu";
import ScreenHeader from "../../components/blocks/ScreenHeader";
import SectionHeader from "../../components/ui/SectionHeader";
import Avatar from "../../components/ui/Avatar";
import TopPicks from "../../components/blocks/TopPicks";
import JourneyCard from "../../components/blocks/JourneyCard";
import { setGuideExternalDone, startSetupGuide } from "../../utils/setupGuide";
import GlowCoinChip from "../../components/blocks/GlowCoinChip";
import ActivityRings from "../../components/charts/ActivityRings";
import CategoryBrowse from "../../components/blocks/CategoryBrowse";
import ExploreSwitch from "../../components/ui/ExploreSwitch";
import { useInterest } from "../../components/InterestContext";
import HomeSearchModal from "../../components/blocks/HomeSearchModal";
import HomeSkeleton from "../../components/blocks/HomeSkeleton";
import { useHomeListings } from "../../hooks/useHomeListings";
import { PressableScale } from "../../components/ui/motion";
import { hueStyle, toneStyle } from "../../constants/categoryColors";
import TreasureChestModal from "../../components/TreasureChestModal";
import { PENDING_WELCOME_BONUS_KEY } from "../../constants/coins";


const SCREEN_PADDING = 16; // single horizontal gutter every section aligns to
const CARD_GAP = 12;

const BADGE_ICONS = {
  "home.new": "star",
  "home.ai": "sparkles",
};

const TOOL_ACTIONS = [
  {
    key: "eligibility",
    titleKey: "home.checkEligibility",
    descriptionKey: "home.checkEligibilityDesc",
    icon: "checkmark-circle",
    screen: "ScholarshipCalculator",
    badgeKey: "home.ai",
    hue: "royal",
  },
  {
    key: "mail",
    titleKey: "home.editMail",
    descriptionKey: "home.editMailDesc",
    icon: "mail",
    screen: "CustomMail",
    hue: "lagoon",
  },
];

const COMMUNITY_PREVIEW_COUNT = 3;

// Sections fade up one after another the first time Home appears. The hero
// (index 0) is left out: a layout animation on it can leave its self-sized
// chips (status, membership, coin balance) measured before their text settles,
// which clips the last characters on Android.
const Entrance = ({ index, children }) => {
  const reduce = useReducedMotion();
  if (reduce || index === 0 || index > 6) return children;
  return <Animated.View entering={FadeInDown.delay(index * 70).duration(380)}>{children}</Animated.View>;
};

const ScholarshipHome = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [feedKindChoice, setFeedKind] = useState("universities");
  // The interest picked at onboarding / in Settings decides what Home shows;
  // the in-page switch only exists (and is only used) when it is "both".
  const { interest, isBoth, showUniversities, showCompanies } = useInterest();
  const feedKind = isBoth ? feedKindChoice : interest;
  const [searchOpen, setSearchOpen] = useState(false);
  const router = useRouter();
  const { username: paramsUsername = "" } = useLocalSearchParams();
  const [username, setUsername] = useState(paramsUsername);
  const [paidMember, setPaidMember] = useState(false);
  const [hasEmailMessage, setHasEmailMessage] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const sharedFavorites = useFavorites();
  const favoriteScholarships = useMemo(
    () => sharedFavorites.scholarships || [],
    [sharedFavorites.scholarships],
  );
  const favoriteJobs = useMemo(() => sharedFavorites.jobs || [], [sharedFavorites.jobs]);
  const [calcResults, setCalcResults] = useState([]);
  const [communityPosts, setCommunityPosts] = useState(null);
  const [showTreasureChest, setShowTreasureChest] = useState(false);
  const [coinCelebrate, setCoinCelebrate] = useState(0);
  const coinChipRef = useRef(null);

  const getCoinTarget = useCallback(
    () =>
      new Promise((resolve) => {
        if (!coinChipRef.current) return resolve(null);
        coinChipRef.current.measureInWindow((x, y, w, h) => resolve(w ? { x: x + w / 2, y: y + h / 2 } : null));
      }),
    [],
  );
  const [offlineAlertVisible, setOfflineAlertVisible] = useState(false);
  // The "Active"/"Offline" status dot used to be permanently hardcoded to
  // "Active" — isConnected was set once and never updated again. This flag
  // tracks whether an offline alert has already been shown for the current
  // outage, so a screen full of polling requests doesn't pop up the same
  // "no internet" alert repeatedly — it resets the moment a request
  // succeeds again.
  const hasShownOfflineAlertRef = useRef(false);

  const handleNetworkResult = useCallback((error) => {
    if (error?.isNetworkError) {
      setIsConnected(false);
      if (!hasShownOfflineAlertRef.current) {
        hasShownOfflineAlertRef.current = true;
        setOfflineAlertVisible(true);
      }
    } else {
      setIsConnected(true);
      hasShownOfflineAlertRef.current = false;
    }
  }, []);
  const { notifications, user, wallet, refreshWallet, addNotification } =
    useContext(AuthContext);
  const { t } = useContext(LanguageContext);
  const { colors, isDark } = useTheme();
  const [setupMeta, setSetupMeta] = useState(null);
  const [communityError, setCommunityError] = useState(false);
  const homeListings = useHomeListings();
  const { width, fontScale } = useWindowDimensions();
  const stackTools = width < 350 || fontScale > 1.3;

  const profileCompleteness = useMemo(() => {
    const keys = ["fullName", "email", "phoneNumber", "country", "dateOfBirth", "educationLevel", "fieldOfStudy"];
    const filled = keys.filter((key) => !!user?.[key]?.trim?.()).length;
    return Math.round((filled / keys.length) * 100);
  }, [user]);

  // Resolve username: route params → AuthContext → AsyncStorage
  useEffect(() => {
    const fetchUsernameFromStorage = async () => {
      try {
        if (paramsUsername) { setUsername(paramsUsername); return; }
        if (user?.username) { setUsername(user.username); return; }
        const storedUsername = await AsyncStorage.getItem("username");
        if (storedUsername) setUsername(storedUsername);
      } catch (error) {
        console.error("Error fetching username from storage:", error);
      }
    };

    fetchUsernameFromStorage();
  }, [paramsUsername, user]);

  // The 1000-Scholar-Coin welcome celebration plays exactly once, the first
  // time a brand-new account reaches Home — RegisterForm.jsx sets this flag
  // right after signup, keyed by username so it only fires for that account.
  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    const checkPendingWelcomeBonus = async () => {
      try {
        const pendingUsername = await AsyncStorage.getItem(PENDING_WELCOME_BONUS_KEY);
        if (!cancelled && pendingUsername === username) {
          setShowTreasureChest(true);
        }
      } catch (error) {
        console.error("Error checking welcome bonus flag:", error);
      }
    };
    checkPendingWelcomeBonus();
    return () => {
      cancelled = true;
    };
  }, [username]);

  // The coins landing in the wallet also goes to the bell and, via
  // addNotification, to the phone's notifications. Once per claim.
  const welcomeAnnounced = useRef(false);
  const announceWelcomeCoins = () => {
    if (welcomeAnnounced.current) return;
    welcomeAnnounced.current = true;
    const amount = (wallet?.signupBonus ?? 1000).toLocaleString();
    addNotification?.(
      {
        type: "coins",
        title: t("coinNotice.receivedTitle", { amount }),
        description: t("coinNotice.receivedBody"),
      },
      { username },
    );
  };

  const handleDismissTreasureChest = async () => {
    setShowTreasureChest(false);
    try {
      await AsyncStorage.removeItem(PENDING_WELCOME_BONUS_KEY);
    } catch (error) {
      console.error("Error clearing welcome bonus flag:", error);
    }
  };

  const fetchAccountData = useCallback(async () => {
    if (!username) return;
    try {
      const userData = await authAPI.getUserByUsername(username);
      setPaidMember(userData.paidMember);
      setHasEmailMessage(
        !!(userData.scholarshipEmailMessage?.trim() || userData.jobEmailMessage?.trim()),
      );
      handleNetworkResult(null);
    } catch (error) {
      console.error("Error fetching paid status:", error);
      handleNetworkResult(error);
    }
  }, [username, handleNetworkResult]);

  // Activity dashboard data: saved universities/companies + requests sent.
  // "Requested" now comes from the wallet (server-tracked, shared across
  // screens/devices) rather than a locally-cached AsyncStorage list.
  const fetchActivityData = useCallback(async () => {
    if (!username) return;
    try {
      // Eligibility history is optional — never let it break the dashboard
      const results = await calculatorAPI.getUserResults(username);

      setCalcResults(Array.isArray(results) ? results : []);
      handleNetworkResult(null);
    } catch (error) {
      console.error("Error fetching activity dashboard data:", error);
      handleNetworkResult(error);
    }
  }, [username, handleNetworkResult]);

  // Latest stories from both community boards, merged newest-first. The
  // Preserve cached stories and offer a retry if both boards fail.
  const fetchCommunityPosts = useCallback(async () => {
    const results = await Promise.all(
      ["university", "job"].map((type) =>
        communityAPI
          .getPosts(type, { pageSize: COMMUNITY_PREVIEW_COUNT })
          .then((res) => (Array.isArray(res?.posts) ? res.posts : []))
          .catch(() => null),
      ),
    );
    const failed = results.every((r) => r === null);
    setCommunityError(failed);
    if (failed) return;
    const merged = results
      .flat()
      .filter(Boolean)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, COMMUNITY_PREVIEW_COUNT);
    setCommunityPosts(merged);
  }, []);

  // Refetch every time the Home tab regains focus, so activity saved
  // elsewhere in the app (Scholarships/Jobs/Favourites) shows up immediately.
  // The wallet is force-refreshed from the server too — a request made on
  // another tab updates context already, but this guarantees Home is never
  // showing a stale balance/requested-id set regardless of timing.
  useFocusEffect(
    useCallback(() => {
      let focused = true;
      const run = Promise.allSettled([
        fetchActivityData(),
        fetchAccountData(),
        fetchCommunityPosts(),
        refreshWallet(),
        homeListings.refresh(),
      ]);
      if (username) run.then(() => { if (focused) setLoading(false); });
      return () => { focused = false; };
    }, [username, fetchActivityData, fetchAccountData, fetchCommunityPosts, refreshWallet, homeListings.refresh]),
  );

  // Whether the owl tour has already offered itself once for this account.
  const seenKey = username ? `scola_setup_seen_${username}` : null;
  useEffect(() => {
    if (!seenKey) return;
    let cancelled = false;
    AsyncStorage.getItem(seenKey)
      .then((seen) => {
        if (!cancelled) setSetupMeta({ autoShown: seen === "1" });
      })
      .catch(() => {
        if (!cancelled) setSetupMeta({ autoShown: true });
      });
    return () => {
      cancelled = true;
    };
  }, [seenKey]);

  // First run: the owl offers a quick tour of the app, once per account.
  // (Language, light/dark, interest and notifications are already chosen in
  // the first-launch setup, so the tour no longer covers them.)
  useEffect(() => {
    if (!setupMeta || setupMeta.autoShown || loading || showTreasureChest) return;
    const timer = setTimeout(() => {
      AsyncStorage.setItem(seenKey, "1").catch(() => {});
      setSetupMeta({ autoShown: true });
      startSetupGuide("welcome");
    }, 900);
    return () => clearTimeout(timer);
  }, [setupMeta, loading, showTreasureChest, seenKey]);

  // Never leave the placeholders up for good if the first load can't finish.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([
        fetchActivityData(),
        fetchAccountData(),
        fetchCommunityPosts(),
        refreshWallet(),
        homeListings.refresh(true),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchActivityData, fetchAccountData, fetchCommunityPosts, refreshWallet, homeListings.refresh]);

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return t("ui.home.greetingMorning");
    else if (hours < 18) return t("ui.home.greetingAfternoon");
    else return t("ui.home.greetingEvening");
  };

  function getUserName(username) {
    if (!username) return "User";
    return username;
  }

  const dashboardData = useMemo(() => {
    // Only count the side the user is interested in.
    const savedUniversities = showUniversities ? favoriteScholarships.length : 0;
    const savedCompanies = showCompanies ? favoriteJobs.length : 0;
    const totalSaved = savedUniversities + savedCompanies;
    const requestedScholarshipIds = new Set(showUniversities ? wallet?.requestedScholarshipIds || [] : []);
    const requestedJobIds = new Set(showCompanies ? wallet?.requestedJobIds || [] : []);
    // Every request ever sent, whether or not the item was favorited —
    // requesting straight from the Explore cards (no favoriting needed)
    // counts here too.
    const totalRequestsSent = requestedScholarshipIds.size + requestedJobIds.size;
    // Of just the items you *saved*, how many you've followed through on —
    // scoped to favorites on purpose, feeds the "Progress" ring.
    const requestsSent =
      (showUniversities ? favoriteScholarships.filter((item) => requestedScholarshipIds.has(item.id)).length : 0) +
      (showCompanies ? favoriteJobs.filter((item) => requestedJobIds.has(item.id)).length : 0);

    // Latest score from the real calculator history.
    let eligibility = null;
    if (calcResults.length > 0) {
      const latestResult = [...calcResults].sort(
        (a, b) => new Date(b.calculatedAt) - new Date(a.calculatedAt),
      )[0];
      eligibility = { latest: Math.round(latestResult.totalScore) };
    }

    return { requestsSent, totalRequestsSent, totalSaved, eligibility };
  }, [favoriteScholarships, favoriteJobs, wallet, calcResults, showUniversities, showCompanies]);

  // The user's path through the app, derived from what they've actually done.
  // The first unfinished step is promoted as the single "next best action".
  const journeySteps = useMemo(
    () => [
      {
        key: "profile",
        titleKey: "home.stepProfile",
        descriptionKey: "home.stepProfileDesc",
        icon: "person",
        onPress: () => startSetupGuide("details"),
        done: profileCompleteness >= 100,
      },
      {
        key: "mail",
        titleKey: "home.stepMail",
        descriptionKey: "home.stepMailDesc",
        icon: "mail",
        onPress: () => startSetupGuide("mail"),
        done: hasEmailMessage,
      },
      {
        key: "eligibility",
        titleKey: "home.stepEligibility",
        descriptionKey: "home.stepEligibilityDesc",
        icon: "checkmark-circle",
        onPress: () => startSetupGuide("eligibility"),
        done: calcResults.length > 0,
      },
      {
        key: "save",
        titleKey: "home.stepSave",
        descriptionKey: "home.stepSaveDesc",
        icon: "heart",
        onPress: () => startSetupGuide("save"),
        done: dashboardData.totalSaved > 0,
      },
      {
        key: "request",
        titleKey: "home.stepRequest",
        descriptionKey: "home.stepRequestDesc",
        icon: "paper-plane",
        onPress: () => startSetupGuide("request"),
        done: dashboardData.totalRequestsSent > 0,
      },
    ],
    [profileCompleteness, hasEmailMessage, calcResults, dashboardData],
  );

  useEffect(() => {
    setGuideExternalDone({
      profile: profileCompleteness >= 100,
      mail: hasEmailMessage,
      eligibility: calcResults.length > 0,
      save: dashboardData.totalSaved > 0,
      request: dashboardData.totalRequestsSent > 0,
    });
  }, [profileCompleteness, hasEmailMessage, calcResults, dashboardData]);

  // Opens Explore on the right half, optionally searching for one listing.
  const openExplore = (kind, query, category) => {
    const tab = kind === "companies" ? "jobs" : "scholarships";
    setExploreTab(tab);
    setExploreSearch(tab, query || "");
    setExploreCategory(tab, category || "");
    router.push("/Scholarships");
  };

  const goTo = (action) => {
    if (action.creatorType) {
      router.push({ pathname: "/CreateCreatorListing", params: { type: action.creatorType } });
    } else if (action.isAdminAction) {
      router.push("/AdminPanel");
    } else {
      router.push(`/${action.screen}`);
    }
  };

  const renderItem = ({ item }) => {
    switch (item.type) {
      // ── Hero: greeting, membership, search and coin balance ──
      case "hero": {
        return (
          <View style={styles.heroShadow}>
          <View style={[styles.heroCard, { backgroundColor: colors.tabBarAccent }]}>
            <View style={styles.heroBlobA} pointerEvents="none" />
            <View style={styles.heroBlobB} pointerEvents="none" />
            <View style={styles.heroTopRow}>
              <View style={styles.heroLeft}>
                  <Text style={styles.heroGreeting}>
                    {getGreeting()}
                  </Text>
                <Text style={styles.heroName} accessibilityRole="header" numberOfLines={2}>
                  {t("home.greeting")}, {getUserName(item.data.username)}
                </Text>
              </View>
              <View
                style={styles.statusPill}
                accessible
                accessibilityLabel={isConnected ? t("ui.home.active") : t("ui.home.offline")}
              >
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: isConnected ? "#4ade80" : "#f87171" },
                  ]}
                />
                <Text style={styles.statusText}>
                  {isConnected ? t("ui.home.active") : t("ui.home.offline")}
                </Text>
              </View>
            </View>
            <View style={styles.heroMetaRow}>
              <View style={styles.memberPill}>
                <Ionicons
                  name={paidMember ? "ribbon" : "person-circle-outline"}
                  size={14}
                  color={paidMember ? "#fcd34d" : "#fff"}
                />
                <Text style={styles.memberText}>
                  {paidMember ? t("profile.premiumMember") : t("profile.freeMember")}
                </Text>
              </View>
              <GlowCoinChip
                ref={coinChipRef}
                ready={!!wallet && !showTreasureChest}
                celebrate={coinCelebrate}
                coins={wallet ? (wallet.coins ?? 0).toLocaleString() : "–"}
                onPress={() => router.push("/Wallet")}
                accessibilityLabel={`${t("ui.home.coins")}: ${wallet ? (wallet.coins ?? 0).toLocaleString() : "–"}`}
              />
            </View>

            <View style={styles.heroActions}>
              <PressableScale
                scaleTo={0.97}
                containerStyle={styles.searchWrap}
                style={[styles.searchBar, { backgroundColor: colors.surface }]}
                onPress={() => setSearchOpen(true)}
                accessibilityRole="button"
                accessibilityLabel={t("home.searchPlaceholder")}
              >
                <Ionicons name="search" size={18} color={colors.textSecondary} />
                <Text
                  style={[styles.searchText, { color: colors.textSecondary }]}
                >
                  {t("home.searchPlaceholder")}
                </Text>
              </PressableScale>
            </View>
          </View>
          </View>
        );
      }

      // ── Offline notice (replaces the old always-on "Active" dot) ──
      case "offline":
        return item.data.show ? (
          <View
            style={[styles.offlineBanner, { backgroundColor: colors.warningLight }]}
            accessibilityRole="alert"
          >
            <Ionicons name="cloud-offline" size={18} color={colors.warning} />
            <Text style={[styles.offlineText, { color: colors.textPrimary }]}>
              {t("home.noInternetTitle")}
            </Text>
          </View>
        ) : null;

      // ── Journey: what to do next, derived from real progress ──
      case "journey":
        return (
          <View style={styles.section}>
            <JourneyCard
              steps={item.data.steps}
              onStepPress={(step) => (step.onPress ? step.onPress() : router.push(step.route))}
            />
          </View>
        );

      // ── Top picks: universities and companies matched to the profile ──
      case "topPicks":
        return (
          <TopPicks
            user={user}
            kind={feedKind}
            listings={homeListings.listings}
            error={homeListings.error}
            onRetry={() => homeListings.refresh(true)}
            onSeeAll={(kind) => openExplore(kind)}
            onOpen={(kind, listing) => openExplore(kind, listing.title)}
          />
        );

      // ── One switch for universities / companies, shared by the two sections below ──
      case "kindSwitch":
        return (
          <ExploreSwitch
            value={feedKindChoice}
            onChange={setFeedKind}
            sides={["universities", "companies"]}
            labels={{ universities: t("explore.universities"), companies: t("explore.companies") }}
            caption={t(feedKindChoice === "companies" ? "explore.companies" : "explore.universities")}
            style={styles.kindSwitch}
          />
        );

      // ── Browse by category: the core action ──
      case "categories":
        return (
          <CategoryBrowse
            user={user}
            kind={feedKind}
            listings={homeListings.listings}
            error={homeListings.error}
            onSeeAll={(kind) => router.push({ pathname: "/Categories", params: { kind } })}
            onOpen={(kind, category) => router.push({ pathname: "/Categories", params: { kind, category } })}
          />
        );

      case "skeleton":
        return <HomeSkeleton />;

      // ── Progress: the four metrics, each with an animated ring ──
      case "progress": {
        const ringColor = (hue) => hueStyle(hue, isDark).fg;
        return (
          <View style={styles.section}>
            <SectionHeader
              icon={<Ionicons name="pulse" size={22} color={colors.accent} />}
              title={t("home.yourProgress")}
              style={styles.sectionHeader}
            />
            <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
              <ActivityRings
                trackColor={colors.border}
                textColor={colors.textPrimary}
                subTextColor={colors.textSecondary}
                rings={[
                  {
                    key: "progress",
                    percent: dashboardData.totalSaved > 0 ? (dashboardData.requestsSent / dashboardData.totalSaved) * 100 : 0,
                    color: ringColor("emerald"),
                    label: t("ui.home.progress"),
                    valueText: dashboardData.totalSaved > 0
                      ? `${dashboardData.requestsSent}/${dashboardData.totalSaved}`
                      : "0/0",
                    onPress: () => router.push("/favourites"),
                  },
                  {
                    key: "score",
                    percent: dashboardData.eligibility?.latest || 0,
                    color: ringColor("cyan"),
                    label: t("ui.home.score"),
                    valueText: dashboardData.eligibility ? `${dashboardData.eligibility.latest}` : "–",
                    onPress: () => router.push("/ScholarshipCalculator"),
                  },
                  {
                    key: "profile",
                    percent: profileCompleteness,
                    color: ringColor("indigo"),
                    label: t("ui.home.profile"),
                    valueText: `${profileCompleteness}%`,
                    onPress: () => router.push("/PersonalDetails"),
                  },
                  {
                    key: "requests",
                    icon: "paper-plane-outline",
                    trackColor: colors.accentLight,
                    color: ringColor("amber"),
                    label: t("home.requestsSent"),
                    valueText: String(dashboardData.totalRequestsSent),
                    onPress: () => router.push("/favourites"),
                  },
                ]}
              />
            </View>
          </View>
        );
      }

      // ── Tools: two colourful tiles ──
      case "tools":
        return (
          <View style={styles.section}>
            <SectionHeader
              icon={<Ionicons name="construct" size={22} color={colors.accent} />}
              title={t("home.tools")}
              style={styles.sectionHeader}
            />
            <View style={[styles.toolRow, stackTools && { flexDirection: "column" }]}>
              {TOOL_ACTIONS.map((action) => {
                const look = toneStyle(action.hue, isDark);
                return (
                  <PressableScale
                    key={action.key}
                    scaleTo={0.96}
                    containerStyle={styles.toolWrap}
                    style={[styles.toolTile, { backgroundColor: look.bg }]}
                    onPress={() => goTo(action)}
                    accessibilityRole="button"
                    accessibilityLabel={t(action.titleKey)}
                  >
                    <View style={styles.toolTop}>
                      <View style={[styles.toolIcon, { backgroundColor: look.fg }]}>
                        <Ionicons name={action.icon} size={22} color={colors.surface} />
                      </View>
                      {action.badgeKey && (
                        <View style={[styles.toolBadge, { backgroundColor: look.fg }]}>
                          <Ionicons name={BADGE_ICONS[action.badgeKey] || "sparkles"} size={10} color={colors.surface} />
                          <Text style={[styles.toolBadgeText, { color: colors.surface }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                            {t(action.badgeKey)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.toolTitle, { color: colors.textPrimary }]}>
                      {t(action.titleKey)}
                    </Text>
                    <Text style={[styles.toolDesc, { color: colors.textSecondary }]}>
                      {t(action.descriptionKey)}
                    </Text>
                  </PressableScale>
                );
              })}
            </View>
          </View>
        );

      // ── Tools / Manage: compact full-width rows ──
      case "actions": {
        const { titleKey, icon: sectionIcon, actions } = item.data;
        return (
          <View style={styles.section}>
            <SectionHeader
              icon={<Ionicons name={sectionIcon} size={22} color={colors.accent} />}
              title={t(titleKey)}
              style={styles.sectionHeader}
            />
            <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={action.key}
                  style={[
                    styles.actionRow,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                  onPress={() => goTo(action)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t(action.titleKey)}
                >
                  <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name={action.icon} size={22} color={colors.accent} />
                  </View>
                  <View style={styles.rowText}>
                    <View style={styles.rowTitleLine}>
                      <Text
                        style={[styles.rowTitle, { color: colors.textPrimary, flexShrink: 1 }]}
                        numberOfLines={2}
                      >
                        {t(action.titleKey)}
                      </Text>
                      {action.badgeKey && (
                        <View style={[styles.rowBadge, { backgroundColor: colors.accent }]}>
                          <Ionicons name={BADGE_ICONS[action.badgeKey] || "sparkles"} size={10} color="#fff" />
                          <Text style={styles.rowBadgeText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                            {t(action.badgeKey)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text
                      style={[styles.rowDescription, { color: colors.textSecondary }]}
                      numberOfLines={2}
                    >
                      {t(action.descriptionKey)}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      }

      // ── Community: real recent stories + a prompt to add one ──
      case "community": {
        const { posts } = item.data;
        return (
          <View style={styles.section}>
            <SectionHeader
              icon={<Ionicons name="people" size={22} color={colors.accent} />}
              title={t("home.community")}
              actionLabel={t("home.seeAll")}
              onActionPress={() => router.push("/Community")}
              style={styles.sectionHeader}
            />
            <View style={[styles.listCard, { backgroundColor: colors.surface }]}>
              {communityError ? (
                <TouchableOpacity style={styles.communityRetry} onPress={fetchCommunityPosts}
                  accessibilityRole="button" accessibilityLabel={t("home.communityRetry")}>
                  <Ionicons name="refresh-outline" size={20} color={colors.accent} />
                  <Text style={[styles.offlineText, { color: colors.textSecondary }]}>{t("home.communityRetry")}</Text>
                </TouchableOpacity>
              ) : null}
              {posts === null ? null : posts.length === 0 ? (
                <Text style={[styles.communityEmpty, { color: colors.textSecondary }]}>
                  {t("home.communityEmpty")}
                </Text>
              ) : (
                posts.map((post, index) => (
                  <TouchableOpacity
                    key={post.id}
                    style={[
                      styles.postRow,
                      index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                    ]}
                    onPress={() => router.push({ pathname: "/CommunityPostDetail", params: { id: post.id } })}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={post.title}
                  >
                    <Avatar name={post.authorUsername} size={40} borderWidth={0} />
                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowTitle, { color: colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {post.title}
                      </Text>
                      <View style={styles.postMetaRow}>
                        <Text
                          style={[styles.postMeta, { color: colors.textSecondary, flexShrink: 1 }]}
                          numberOfLines={1}
                        >
                          @{post.authorUsername}
                        </Text>
                        {post.commentCount > 0 && (
                          <View style={styles.postMetaItem}>
                            <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
                            <Text style={[styles.postMeta, { color: colors.textSecondary }]}>
                              {post.commentCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {post.gotIt && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity
                style={[
                  styles.actionRow,
                  posts !== null && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                ]}
                onPress={() => router.push("/CreateCommunityPost")}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={t("home.shareStory")}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="create" size={22} color={colors.accent} />
                </View>
                <View style={styles.rowText}>
                  <Text
                    style={[styles.rowTitle, { color: colors.textPrimary }]}
                    numberOfLines={2}
                  >
                    {t("home.shareStory")}
                  </Text>
                  <Text
                    style={[styles.rowDescription, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {t("home.shareStoryDesc")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      default:
        return null;
    }
  };

  const manageActions = useMemo(() => {
    const actions = [];
    if (user?.creatorModeEnabled) {
      const creatorType = user?.creatorRole === "universityOwner" ? "university" : "company";
      actions.push({
        key: "creator",
        titleKey: creatorType === "university" ? "creatorListing.addUniversity" : "creatorListing.addCompany",
        descriptionKey: "creatorListing.homeSubtitle",
        icon: creatorType === "university" ? "school-outline" : "business-outline",
        creatorType,
      });
    }
    if (user?.isAdmin) {
      actions.push({
        key: "admin",
        titleKey: "admin.dashboard",
        descriptionKey: "admin.dashboardDesc",
        icon: "shield-checkmark-outline",
        isAdminAction: true,
      });
    }
    return actions;
  }, [user?.creatorModeEnabled, user?.creatorRole, user?.isAdmin]);

  const data = [
    { type: "hero", data: { username } },
    { type: "offline", data: { show: !isConnected } },
    ...(isBoth ? [{ type: "kindSwitch", data: null }] : []),
    { type: "categories", data: null },
    { type: "topPicks", data: null },
    ...(loading
      ? [{ type: "skeleton", data: null }]
      : [
          { type: "journey", data: { steps: journeySteps } },
          { type: "progress", data: null },
        ]),
    { type: "tools", data: null },
    { type: "community", data: { posts: communityPosts } },
    ...(manageActions.length > 0
      ? [{ type: "actions", data: { titleKey: "home.manage", icon: "settings", actions: manageActions } }]
      : []),
  ];

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <StatusBar barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"} />
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        <ScreenHeader
          icons={[
            {
              key: "notifications",
              name: "notifications",
              onPress: () => setShowNotificationModal(true),
              badgeCount: notifications?.length || 0,
              accessibilityLabel: t("ui.a11y.notifications"),
            },
          ]}
          onMenuPress={() => setMenuVisible(true)}
        />
      </View>

      <FlatList
        data={data}
        renderItem={({ item, index }) => <Entrance index={index}>{renderItem({ item })}</Entrance>}
        keyExtractor={(item) => item.type}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <HomeSearchModal
        visible={searchOpen}
        kind={feedKind}
        onClose={() => setSearchOpen(false)}
        onSearch={(kind, query) => {
          setSearchOpen(false);
          openExplore(kind, query);
        }}
        onPickListing={(kind, title) => {
          setSearchOpen(false);
          openExplore(kind, title);
        }}
        onPickCategory={(kind, category, subcategory) => {
          setSearchOpen(false);
          const tab = kind === "companies" ? "jobs" : "scholarships";
          setExploreTab(tab);
          setExploreCategory(tab, category, subcategory || "");
          router.push("/Scholarships");
        }}
      />
      <TreasureChestModal
        visible={showTreasureChest}
        onContinue={handleDismissTreasureChest}
        getTarget={getCoinTarget}
        onArrive={() => {
          setCoinCelebrate((n) => n + 1);
          announceWelcomeCoins();
        }}
      />
      <AlertModal
        visible={offlineAlertVisible}
        title={t("home.noInternetTitle")}
        message={t("home.noInternetMessage")}
        type="warning"
        onClose={() => setOfflineAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  headerContainer: {
    backgroundColor: "#f8fafc",
    paddingTop: 8,
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: 10,
  },
  listContent: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 12,
    paddingBottom: 32,
  },
  section: {
    marginTop: 24,
  },
  kindSwitch: {
    marginTop: 20,
  },
  sectionHeader: {
    paddingHorizontal: 0,
  },

  // ── Hero ──
  heroShadow: {
    borderRadius: 24,
    shadowColor: "#004aad",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 5,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    overflow: "hidden",
  },
  heroBlobA: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -60,
    right: -40,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
  },
  heroBlobB: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    bottom: -40,
    left: -30,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroLeft: {
    flex: 1,
    marginRight: 10,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600", lineHeight: 16, color: "#fff", flexShrink: 0 },
  heroMetaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginTop: 12 },
  memberPill: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    paddingHorizontal: 12,
    minHeight: 28,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.28)",
  },
  memberText: { fontSize: 12, fontWeight: "500", lineHeight: 16, color: "#fff", flexShrink: 0, marginLeft: 5 },
  heroGreeting: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
    color: "rgba(255, 255, 255, 0.85)",
    textBreakStrategy: "simple",
  },
  heroName: {
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 32,
    color: "#fff",
    marginTop: 4,
    textBreakStrategy: "simple",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 18,
  },
  searchWrap: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  searchText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
  },
  offlineText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",

  },
  progressCard: {
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  // ── Shared list card (journey, tools, community, manage) ──
  listCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  rowText: {
    flex: 1,
    marginHorizontal: 12,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "700",

    textBreakStrategy: "simple",
  },
  rowDescription: {
    fontSize: 14,

    marginTop: 2,
    lineHeight: 20,
    textBreakStrategy: "simple",
  },
  rowBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  rowBadgeText: {
    fontSize: 12,
    fontWeight: "600",

    color: "#fff",
    letterSpacing: 0.4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Tool tiles ──
  toolRow: {
    flexDirection: "row",
    gap: CARD_GAP,
  },
  toolWrap: {
    flex: 1,
  },
  toolTile: {
    borderRadius: 20,
    padding: 16,
    minHeight: 156,
  },
  toolTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  toolIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  toolBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  toolBadgeText: {
    fontSize: 12,
    fontWeight: "800",

    letterSpacing: 0.4,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: "600",

    textBreakStrategy: "simple",
  },
  toolDesc: {
    fontSize: 14,
    fontWeight: "500",

    marginTop: 4,
    lineHeight: 20,
    textBreakStrategy: "simple",
  },

  // ── Community ──
  postRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  postMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 3,
  },
  postMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  postMeta: {
    fontSize: 12,

  },
  communityEmpty: {
    fontSize: 13,

    lineHeight: 18,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  communityRetry: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 64, padding: 16 },
});

export default ScholarshipHome;
