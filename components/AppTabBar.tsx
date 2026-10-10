import React, { useContext, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "./AuthContext";
import { LanguageContext } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import Avatar from "./ui/Avatar";
import { useExploreTab } from "./exploreTabStore";
import { useGuideTarget } from "../utils/guideTargets";

// The blank-icon bug was `tabBar` being nested inside `screenOptions`
// instead of passed as a direct prop on <Tabs> — this component was never
// actually mounting. Now that it does, Ionicons (already used everywhere
// else in the app) is safe to use again.
const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  index: "home",
  favourites: "heart",
  Scholarships: "school",
  Chats: "chatbubbles",
};

const LABEL_KEYS: Record<string, string> = {
  index: "tabs.home",
  favourites: "tabs.favourites",
  Scholarships: "tabs.explore",
  Chats: "tabs.inbox",
  Profile: "tabs.profile",
};

interface AppTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

function CountBadge({ count }: { count: number }) {
  if (!count || count <= 0) return null;
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text>
    </View>
  );
}

function RegularTab({
  routeName,
  isFocused,
  badgeCount,
  onPress,
  accessibilityLabel,
  isProfile,
  user,
  avatarIcon,
  avatarPhotoUri,
}: any) {
  const { t } = useContext(LanguageContext) || {};
  const { colors } = useTheme() || {};
  const accent = colors?.tabBarAccent ?? "#004aad";
  const inactive = colors?.tabIconDefault ?? "#5f6f86";
  const selectedText = colors?.tabIconSelected ?? accent;
  const reduceMotion = useReducedMotion();
  // The owl's quick tour points at this button.
  const targetRef = useGuideTarget(`tab.${routeName}`);
  const scale = useRef(new Animated.Value(1)).current;
  const wasFocused = useRef(isFocused);

  useEffect(() => {
    if (reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
      wasFocused.current = isFocused;
      return;
    }
    if (isFocused && !wasFocused.current) {
      // A small selection response, disabled by the reduced-motion setting.
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }).start();
    }
    wasFocused.current = isFocused;
  }, [isFocused, reduceMotion, scale]);

  return (
    <Pressable
      ref={targetRef}
      collapsable={false}
      onPress={onPress}
      style={({ pressed }) => [styles.tabItem, pressed && styles.tabItemPressed]}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      accessibilityLabel={
        badgeCount > 0 ? `${accessibilityLabel}, ${badgeCount}` : accessibilityLabel
      }
    >
      <Animated.View
        style={[
          styles.iconSlot,
          isFocused && { backgroundColor: accent },
          { transform: [{ scale }] },
        ]}
      >
        {isProfile ? (
          <Avatar
            name={user?.username}
            icon={avatarIcon?.icon}
            color={avatarIcon?.color}
            photoUri={avatarPhotoUri}
            size={22}
            borderWidth={isFocused ? 2 : 0}
          />
        ) : (
          <Ionicons name={ICONS[routeName]} size={20} color={isFocused ? "#fff" : inactive} />
        )}
        <CountBadge count={badgeCount} />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          isFocused && styles.tabLabelActive,
          { color: isFocused ? selectedText : inactive },
        ]}
        numberOfLines={2}
      >
        {t ? t(LABEL_KEYS[routeName]) : routeName}
      </Text>
    </Pressable>
  );
}

function CenterTab({ isFocused, onPress }: any) {
  const { t } = useContext(LanguageContext) || {};
  const { colors } = useTheme() || {};
  const accent = colors?.tabBarAccent ?? "#004aad";
  const inactive = colors?.tabIconDefault ?? "#5f6f86";
  const selectedText = colors?.tabIconSelected ?? accent;
  const reduceMotion = useReducedMotion();
  const targetRef = useGuideTarget("tab.Scholarships");
  const scale = useRef(new Animated.Value(1)).current;
  const wasFocused = useRef(isFocused);
  // Explore's icon reflects whichever side of the Universities/Jobs pager
  // is currently open, so the tab bar icon matches what's on screen instead
  // of always showing the university glyph.
  const exploreTab = useExploreTab();
  const icon = exploreTab === "jobs" ? "briefcase" : "school";
  const iconScale = useRef(new Animated.Value(1)).current;
  const shownIcon = useRef(icon);

  useEffect(() => {
    if (shownIcon.current === icon) return;
    shownIcon.current = icon;
    if (reduceMotion) { iconScale.stopAnimation(); iconScale.setValue(1); return; }
    iconScale.setValue(0.9);
    Animated.spring(iconScale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }).start();
  }, [icon, reduceMotion, iconScale]);

  useEffect(() => {
    if (reduceMotion) {
      scale.stopAnimation();
      scale.setValue(1);
      wasFocused.current = isFocused;
      return;
    }
    if (isFocused && !wasFocused.current) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.08, friction: 7, tension: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      ]).start();
    }
    wasFocused.current = isFocused;
  }, [isFocused, reduceMotion, scale]);

  return (
    <Pressable
      ref={targetRef}
      collapsable={false}
      onPress={onPress}
      style={styles.centerTabItem}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      aria-selected={isFocused}
      accessibilityLabel={t ? t("tabs.explore") : "Explore"}
    >
      <Animated.View
        style={[
          styles.centerBubble,
          {
            backgroundColor: isFocused ? accent : colors?.surfaceAlt ?? "#f1f5f9",
            borderColor: colors?.tabBarBackground ?? "#fff",
            shadowColor: accent,
          },
          isFocused && styles.centerBubbleFocused,
          { transform: [{ scale }] },
        ]}
      >
        <Animated.View style={{ transform: [{ scale: iconScale }] }}>
          <Ionicons name={icon} size={26} color={isFocused ? "#fff" : selectedText} />
        </Animated.View>
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          styles.centerLabel,
          isFocused && styles.tabLabelActive,
          { color: isFocused ? selectedText : inactive },
        ]}
        numberOfLines={2}
      >
        {t ? t("tabs.explore") : "Explore"}
      </Text>
    </Pressable>
  );
}

export function AppTabBar({ state, descriptors, navigation }: AppTabBarProps) {
  const { t } = useContext(LanguageContext) || {};
  const labelFor = (name: string, fallback: string) =>
    t && LABEL_KEYS[name] ? t(LABEL_KEYS[name]) : fallback;
  const { favoritesCount, avatarIcon, avatarPhotoUri, user, unreadMessageCount } = useContext(AuthContext) || {};
  const { colors } = useTheme() || {};
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, {
      paddingBottom: Math.max(insets.bottom, 14),
      paddingLeft: Math.max(insets.left, 16),
      paddingRight: Math.max(insets.right, 16),
    }]}>
      <View
        style={[
          styles.container,
          styles.shadowEffect,
          colors && {
            backgroundColor: colors.tabBarBackground,
            borderColor: colors.tabBarBorder,
          },
        ]}
      >
        {state.routes.map((route: any, index: number) => {
          // Jobs stays registered on the navigator (href: null) purely so
          // switching to it from the Explore screen's in-page switch keeps
          // this tab bar visible — it must never get its own tab button.
          if (route.name === "Jobs") return null;

          const { options } = descriptors[route.key];
          const activeRouteName = state.routes[state.index]?.name;
          const isFocused =
            route.name === "Scholarships"
              ? activeRouteName === "Scholarships" || activeRouteName === "Jobs"
              : state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (route.name === "Scholarships") {
            return (
              <CenterTab
                key={route.key}
                isFocused={isFocused}
                onPress={onPress}
              />
            );
          }

          return (
            <RegularTab
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              accessibilityLabel={labelFor(route.name, options.title)}
              isProfile={route.name === "Profile"}
              user={user}
              avatarIcon={avatarIcon}
              avatarPhotoUri={avatarPhotoUri}
              badgeCount={
                route.name === "favourites"
                  ? favoritesCount
                  : route.name === "Chats"
                    ? unreadMessageCount
                    : 0
              }
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    width: "100%",
    maxWidth: 760,
    borderRadius: 26,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 6,
    position: "relative",
    borderWidth: 1,
    borderColor: "#eef1f5",
    backgroundColor: "#ffffff",
  },
  shadowEffect: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  tabItemPressed: {
    opacity: 0.75,
  },
  iconSlot: {
    width: 40,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  tabLabel: {
    width: "100%",
    paddingHorizontal: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  tabLabelActive: {
    fontWeight: "700",
  },
  centerTabItem: {
    flex: 1,
    minWidth: 0,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 4,
    minHeight: 48,
  },
  // Preserve the raised Explore control; fill it only when selected.
  centerBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -26,
    borderWidth: 3,
    borderColor: "#fff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerBubbleFocused: {
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 12,
  },
  centerLabel: {
    marginTop: -2,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: 0,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#fff",
    zIndex: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
