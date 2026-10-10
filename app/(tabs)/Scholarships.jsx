import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, BackHandler, InteractionManager, SafeAreaView, StatusBar, StyleSheet, useWindowDimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { useTheme } from "../../components/ThemeContext";
import { useExploreTab, setExploreTab, getExploreTab, getAllowedExploreTab, takeExploreSearch, takeExploreCategory, subscribeExplorePending } from "../../components/exploreTabStore";
import UniversitiesPage from "../../components/screens/UniversitiesPage";
import ScreenHeader from "../../components/blocks/ScreenHeader";
import ExploreSwitch from "../../components/ui/ExploreSwitch";
import ExploreSearchBar from "../../components/blocks/ExploreSearchBar";
import { LanguageContext } from "../../components/LanguageContext";
import { useInterest } from "../../components/InterestContext";
import JobsPage from "../../components/screens/JobsPage";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const TABS = ["scholarships", "jobs"];

// Explore = Universities and Jobs side by side in a swipeable pager, like the
// Favourites screen. The switch, swiping, the Android Back button and the tab
// bar icon all read/write the same shared value (exploreTabStore).
export default function Explore() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const tab = useExploreTab();
  const { isBoth, showUniversities, showCompanies } = useInterest();
  const pagerRef = useRef(null);
  const placed = useRef(false);
  const [jobsReady, setJobsReady] = useState(tab === "jobs");
  const [headers, setHeaders] = useState({});
  const setUniversitiesHeader = useCallback((cfg) => setHeaders((h) => ({ ...h, scholarships: cfg })), []);
  const setJobsHeader = useCallback((cfg) => setHeaders((h) => ({ ...h, jobs: cfg })), []);
  const header = headers[tab] || {};
  const { t } = useContext(LanguageContext);
  const [queries, setQueries] = useState({ scholarships: "", jobs: "" });
  const [suggestions, setSuggestions] = useState({ scholarships: [], jobs: [] });
  const [categoryRequests, setCategoryRequests] = useState({ scholarships: null, jobs: null });
  const setUniversitiesQuery = useCallback((q) => setQueries((s) => ({ ...s, scholarships: q })), []);
  const setJobsQuery = useCallback((q) => setQueries((s) => ({ ...s, jobs: q })), []);
  const setUniversitiesSuggestions = useCallback((v) => setSuggestions((s) => ({ ...s, scholarships: v })), []);
  const setJobsSuggestions = useCallback((v) => setSuggestions((s) => ({ ...s, jobs: v })), []);
  const isJobs = tab === "jobs";

  // The title/switch/search block floats over the pager. Each list reserves
  // room for it (topInset) and scrolls normally; only the block is translated
  // (on the UI thread, from the list offset), so the list itself is never
  // moved while it scrolls -- moving both made the content shake.
  const [topHeight, setTopHeight] = useState(0);
  const collapse = useSharedValue(0);
  const collapseMax = useSharedValue(1);
  const measured = useRef(false);
  const shiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -collapse.value }],
  }));

  const handleTopLayout = useCallback((e) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (!h || measured.current) return;
    measured.current = true;
    collapseMax.value = h;
    setTopHeight(h);
  }, []);

  // A different list has its own scroll position, so show the block again.
  useEffect(() => {
    collapse.value = withTiming(0, { duration: 220 });
  }, [tab]);

  useEffect(() => {
    if (jobsReady) return;
    const task = InteractionManager.runAfterInteractions(() => setJobsReady(true));
    return () => task.cancel();
  }, [jobsReady]);

  useEffect(() => {
    if (tab === "jobs") setJobsReady(true);
    pagerRef.current?.scrollTo({
      x: TABS.indexOf(tab) * width,
      animated: placed.current,
    });
    placed.current = true;
  }, [tab, width]);

  const handleScrollEnd = (e) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    setExploreTab(TABS[page] ?? TABS[0]);
  };

  // Back from Jobs goes to Universities rather than leaving Explore.
  useFocusEffect(
    useCallback(() => {
      // A new search or category from Home replaces whatever Explore was
      // showing: old text, category and other filters are all cleared.
      const applyPending = () => {
        const pending = takeExploreSearch();
        const wanted = takeExploreCategory();
        if (pending || wanted) {
          setQueries({ scholarships: "", jobs: "", ...(pending ? { [pending.tab]: pending.query } : {}) });
          const id = Date.now();
          setCategoryRequests((s) => ({
            ...s,
            ...(pending ? { [pending.tab]: { category: "", subcategory: "", level: "", id } } : {}),
            ...(wanted ? { [wanted.tab]: { category: wanted.category, subcategory: wanted.subcategory, level: wanted.level, id } } : {}),
          }));
        }
      };
      applyPending();
      const unsubscribe = subscribeExplorePending(applyPending);
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (getExploreTab() === "jobs" && getAllowedExploreTab() === "both") {
          setExploreTab("scholarships");
          return true;
        }
        return false;
      });
      return () => {
        sub.remove();
        unsubscribe();
      };
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.screenBackground }}>
      <StatusBar barStyle={colors.statusBarStyle === "light" ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: colors.headerBackground }]}>
        <ScreenHeader icons={header.icons || []} onMenuPress={header.onMenuPress} />
      </View>

      <View style={styles.body}>
        <ScrollView
          ref={pagerRef}
          style={{ flex: 1 }}
          horizontal
          pagingEnabled
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled"
          onMomentumScrollEnd={handleScrollEnd}
          contentOffset={{ x: TABS.indexOf(tab) * width, y: 0 }}
        >
          <View style={{ width, height: "100%" }}>
            {showUniversities && <UniversitiesPage categoryRequest={categoryRequests.scholarships} searchQuery={queries.scholarships} setSearchQuery={setUniversitiesQuery} onSuggestionsChange={setUniversitiesSuggestions} onHeaderChange={setUniversitiesHeader} collapse={collapse} collapseMax={collapseMax} topInset={topHeight} />}
          </View>
          <View style={{ width, height: "100%" }}>
            {showCompanies && jobsReady && <JobsPage categoryRequest={categoryRequests.jobs} searchQuery={queries.jobs} setSearchQuery={setJobsQuery} onSuggestionsChange={setJobsSuggestions} onHeaderChange={setJobsHeader} collapse={collapse} collapseMax={collapseMax} topInset={topHeight} />}
          </View>
        </ScrollView>

        <Animated.View
          style={[
            styles.fixedTop,
            { backgroundColor: colors.screenBackground },
            shiftStyle,
          ]}
          onLayout={handleTopLayout}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {t(isJobs ? "explore.companies" : "explore.universities")}
            </Text>
            {isBoth && (
              <ExploreSwitch
                value={tab}
                onChange={setExploreTab}
                labels={{ scholarships: t("explore.universities"), jobs: t("explore.companies") }}
              />
            )}
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t(isJobs ? "explore.companiesSubtitle" : "explore.universitiesSubtitle")}
          </Text>
          <ExploreSearchBar
            value={queries[tab]}
            onChangeText={isJobs ? setJobsQuery : setUniversitiesQuery}
            placeholder={t(isJobs ? "explore.searchJobs" : "explore.searchUniversities")}
            suggestions={suggestions[tab]}
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 2,
    paddingTop: StatusBar.currentHeight || 30,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  body: {
    flex: 1,
  },
  fixedTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    fontFamily: "Roboto",
    textBreakStrategy: "simple",
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    marginTop: 2,
    textBreakStrategy: "simple",
  },
});
