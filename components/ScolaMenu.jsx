import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, usePathname } from "expo-router";
import * as Application from "expo-application";
import Constants from "expo-constants";
import { AuthContext } from "./AuthContext";
import { LanguageContext, LANGUAGES } from "./LanguageContext";
import { useTheme } from "./ThemeContext";
import { useInterest } from "./InterestContext";
import Avatar from "./ui/Avatar";
import AlertModal from "./AlertModal";
import LanguagePickerModal from "./blocks/LanguagePickerModal";

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = width * 0.78;
const ANIM_DURATION = 280;

const TAB_PATHS = ["/", "/favourites", "/Scholarships", "/Jobs", "/Chats", "/Profile"];

// Screens outside the tab bar have no bottom navigation, so the drawer doubles
// as their way back to the main tabs ("Go to"). On tab screens that section is
// hidden because the tab bar already covers it.
const getTabShortcuts = (t, interest) => [
  { title: t("menu.home"), icon: "home-outline", path: "/" },
  interest === "companies"
    ? { title: t("menu.jobs"), icon: "briefcase-outline", path: "/Scholarships" }
    : { title: t("menu.scholarships"), icon: "school-outline", path: "/Scholarships" },
  { title: t("menu.favourites"), icon: "heart-outline", path: "/favourites" },
  { title: t("menu.messages"), icon: "chatbubbles-outline", path: "/Chats", badge: true },
  { title: t("menu.profile"), icon: "person-outline", path: "/Profile" },
];

const getMenuSections = (t, { hasCoins, creatorMode, isAdmin, interest }) => {
  const sections = [
    // The separate Jobs link only makes sense when both sides are on; with
    // one interest Explore already is that side.
    ...(interest === "both"
      ? [
          {
            title: t("menu.opportunities"),
            data: [{ title: t("menu.jobs"), icon: "briefcase-outline", path: "/Jobs" }],
          },
        ]
      : []),
    {
      title: t("menu.community"),
      data: [{ title: t("menu.communityFeed"), icon: "people-outline", path: "/Community" }],
    },
    {
      title: t("menu.tools"),
      data: [
        {
          title: t("menu.checkEligibility"),
          icon: "checkmark-circle-outline",
          path: "/ScholarshipCalculator",
        },
        { title: t("menu.editMail"), icon: "create-outline", path: "/CustomMail" },
      ],
    },
    {
      title: t("settings.account"),
      data: [
        ...(hasCoins ? [] : [{ title: t("menu.wallet"), icon: "wallet-outline", path: "/Wallet" }]),
        { title: t("profile.personalDetails"), icon: "person-circle-outline", path: "/PersonalDetails" },
      ],
    },
  ];

  const manage = [];
  if (creatorMode) {
    manage.push({ title: t("creatorListing.myListings"), icon: "bar-chart-outline", path: "/MyCreatorListings" });
  }
  if (isAdmin) {
    manage.push({ title: t("admin.dashboard"), icon: "shield-checkmark-outline", path: "/AdminPanel" });
  }
  if (manage.length > 0) sections.push({ title: t("home.manage"), data: manage });

  sections.push({
    title: t("settings.privacyLegal"),
    data: [
      { title: t("profile.howToApply"), icon: "help-circle-outline", path: "/HowToApply" },
      { title: t("profile.privacyPolicy"), icon: "lock-closed-outline", path: "/PrivacyPolicy" },
    ],
  });

  return sections;
};

const THEME_OPTIONS = [
  { value: "light", icon: "sunny", labelKey: "settings.themeLight" },
  { value: "dark", icon: "moon", labelKey: "settings.themeDark" },
  { value: "system", icon: "phone-portrait-outline", labelKey: "settings.themeSystem" },
];

const ScolaMenu = ({ visible, onClose }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, wallet, user, avatarIcon, avatarPhotoUri, unreadMessageCount } =
    useContext(AuthContext);
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { themePreference, setThemePreference, colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const coins = wallet?.coins;
  const username = user?.username;
  const onTabScreen = TAB_PATHS.includes(pathname);
  const { interest } = useInterest();
  const menuSections = getMenuSections(t, {
    hasCoins: coins != null,
    creatorMode: !!user?.creatorModeEnabled,
    isAdmin: !!user?.isAdmin,
    interest,
  });
  const [modalVisible, setModalVisible] = useState(visible);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -SIDEBAR_WIDTH,
        duration: ANIM_DURATION,
        useNativeDriver: true,
      }).start(() => setModalVisible(false));
    }
  }, [visible]);

  const navigateTo = (path) => {
    onClose();
    if (path === pathname) return;
    if (TAB_PATHS.includes(path) && path !== "/Jobs") router.navigate(path);
    else router.push(path);
  };

  const appVersion = Application.nativeApplicationVersion || Constants.expoConfig?.version || "";
  const appBuild = Application.nativeBuildVersion || "";
  const versionLabel = !appVersion
    ? ""
    : appBuild
      ? t("home.appVersion", { version: appVersion, build: appBuild })
      : t("home.appVersionOnly", { version: appVersion });

  const requestLogout = () => {
    onClose();
    setTimeout(() => setLogoutConfirmVisible(true), ANIM_DURATION + 40);
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const renderItem = (item) => {
    const active = item.path === pathname;
    const badge = item.badge ? unreadMessageCount : 0;
    return (
      <TouchableOpacity
        key={item.path}
        style={[styles.sidebarItem, active && styles.sidebarItemActive]}
        onPress={() => navigateTo(item.path)}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <View style={[styles.iconCircle, active && styles.iconCircleActive]}>
          <Ionicons name={item.icon} size={20} color={active ? "#fff" : colors.textSecondary} />
        </View>
        <Text style={[styles.sidebarItemText, active && styles.sidebarItemTextActive]}>
          {item.title}
        </Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
    <AlertModal
      visible={logoutConfirmVisible}
      type="warning"
      title={t("ui.confirm.logoutTitle")}
      message={t("ui.confirm.logoutMessage")}
      onClose={() => setLogoutConfirmVisible(false)}
      actions={[
        { text: t("common.cancel"), secondary: true },
        { text: t("menu.logout"), destructive: true, onPress: handleLogout },
      ]}
    />
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(0,0,0,0.45)",
              opacity: slideAnim.interpolate({
                inputRange: [-SIDEBAR_WIDTH, 0],
                outputRange: [0, 1],
                extrapolate: "clamp",
              }),
            },
          ]}
        />
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.sidebar,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.sidebarHeader}>
            <TouchableOpacity
              style={styles.accountButton}
              activeOpacity={0.8}
              onPress={() => navigateTo("/Profile")}
              accessibilityRole="button"
              accessibilityLabel={t("menu.viewProfile")}
            >
              <Avatar
                name={username}
                size={44}
                borderWidth={2}
                icon={avatarIcon?.icon}
                color={avatarIcon?.color}
                photoUri={avatarPhotoUri}
              />
              <View style={styles.accountText}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {username || t("menu.profile")}
                </Text>
                <Text style={styles.accountHint}>{t("menu.viewProfile")}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel={t("ui.a11y.closeMenu")}
            >
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sidebarList}
            contentContainerStyle={styles.sidebarContent}
            showsVerticalScrollIndicator={false}
          >
            {coins != null && (
              <TouchableOpacity
                style={styles.coinsRow}
                activeOpacity={0.85}
                onPress={() => navigateTo("/Wallet")}
                accessibilityRole="button"
                accessibilityLabel={`${t("ui.home.coinsTitle")}: ${coins}`}
              >
                <View style={styles.coinsIconWrap}>
                  <MaterialCommunityIcons
                    name="treasure-chest"
                    size={22}
                    color={colors.warning}
                  />
                </View>
                <View style={styles.coinsTextWrap}>
                  <Text style={styles.coinsLabel}>{t("ui.home.coinsTitle")}</Text>
                  <Text style={styles.coinsValue}>{coins}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            )}

            {!onTabScreen && (
              <>
                <Text style={styles.sectionHeader}>{t("menu.goTo")}</Text>
                {getTabShortcuts(t, interest).map(renderItem)}
              </>
            )}

            {menuSections.map((section) => (
              <View key={section.title}>
                <Text style={styles.sectionHeader}>{section.title}</Text>
                {section.data.map(renderItem)}
              </View>
            ))}

            <Text style={styles.sectionHeader}>{t("menu.language")}</Text>
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setLanguagePickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t("menu.language")}
            >
              <View style={[styles.iconCircle, styles.iconCircleTinted]}>
                <Ionicons name="language-outline" size={20} color={colors.accent} />
              </View>
              <Text style={styles.languageButtonText} numberOfLines={1}>
                {LANGUAGES.find((l) => l.code === language)?.name}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <Text style={styles.sectionHeader}>{t("menu.theme")}</Text>
            <View style={styles.segment}>
              {THEME_OPTIONS.map((opt) => {
                const selected = themePreference === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={styles.segmentOption}
                    onPress={() => setThemePreference(opt.value)}
                    accessibilityRole="button"
                    accessibilityLabel={t(opt.labelKey)}
                    accessibilityState={{ selected }}
                  >
                    <View style={[styles.iconCircle, styles.themeCircle, selected && styles.iconCircleActive]}>
                      <Ionicons
                        name={opt.icon}
                        size={20}
                        color={selected ? "#fff" : colors.textSecondary}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.logoutItem}
            onPress={requestLogout}
            accessibilityRole="button"
          >
            <View style={[styles.iconCircle, styles.logoutCircle]}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <Text style={styles.logoutText}>{t("menu.logout")}</Text>
          </TouchableOpacity>
          {versionLabel ? (
            <Text style={styles.versionText} maxFontSizeMultiplier={1.2}>
              {versionLabel}
            </Text>
          ) : null}
        </Animated.View>
        <LanguagePickerModal
          visible={languagePickerVisible}
          onClose={() => setLanguagePickerVisible(false)}
          onSelect={(code) => {
            setLanguage(code);
            setLanguagePickerVisible(false);
          }}
        />
      </View>
    </Modal>
    </>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
    },
    sidebar: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: SIDEBAR_WIDTH,
      backgroundColor: colors.surface,
      borderTopRightRadius: 28,
      borderBottomRightRadius: 28,
      overflow: "hidden",
      elevation: 16,
    },
    sidebarHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: (StatusBar.currentHeight || 40) + 14,
      paddingBottom: 16,
      paddingLeft: 16,
      paddingRight: 12,
      backgroundColor: colors.tabBarAccent,
    },
    accountButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      minHeight: 48,
    },
    accountText: {
      flex: 1,
      marginLeft: 12,
    },
    accountName: {
      fontSize: 16,
      fontWeight: "700",
      color: "#ffffff",
    },
    accountHint: {
      fontSize: 12,
      color: "rgba(255, 255, 255, 0.82)",
      fontWeight: "600",
      marginTop: 2,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255, 255, 255, 0.18)",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 8,
    },
    coinsRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 20,
      backgroundColor: colors.warningLight,
    },
    coinsIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    coinsTextWrap: {
      flex: 1,
    },
    coinsLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    coinsValue: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "700",
      marginTop: 2,
    },
    sidebarList: {
      flex: 1,
    },
    sidebarContent: {
      padding: 12,
      paddingBottom: 16,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: "700",
      letterSpacing: 0.4,
      color: colors.textMuted,
      marginTop: 16,
      marginBottom: 6,
      paddingHorizontal: 12,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    iconCircleActive: {
      backgroundColor: colors.accent,
    },
    iconCircleTinted: {
      backgroundColor: colors.accentLight,
    },
    sidebarItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 6,
      paddingLeft: 8,
      paddingRight: 12,
      minHeight: 52,
      borderRadius: 26,
    },
    sidebarItemActive: {
      backgroundColor: colors.accentLight,
    },
    sidebarItemText: {
      flex: 1,
      fontSize: 15,
      color: colors.textPrimary,
      marginLeft: 12,
      fontWeight: "500",
    },
    sidebarItemTextActive: {
      color: colors.accent,
      fontWeight: "700",
    },
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      fontSize: 12,
      fontWeight: "700",
      color: "#fff",
    },
    segment: {
      flexDirection: "row",
      justifyContent: "space-around",
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 30,
      backgroundColor: colors.surfaceAlt,
      marginHorizontal: 4,
    },
    languageButton: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 52,
      borderRadius: 26,
      paddingLeft: 8,
      paddingRight: 14,
      marginHorizontal: 4,
      backgroundColor: colors.surfaceAlt,
    },
    languageButtonText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: colors.textPrimary,
      marginLeft: 12,
    },
    segmentOption: {
      alignItems: "center",
      justifyContent: "center",
      padding: 2,
    },
    themeCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.surface,
    },
    logoutItem: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 52,
      marginHorizontal: 12,
      marginTop: 4,
      marginBottom: 8,
      paddingLeft: 8,
      paddingRight: 14,
      borderRadius: 26,
      backgroundColor: colors.dangerLight,
    },
    versionText: {
      fontSize: 12,
      fontWeight: "500",
      color: colors.textMuted,
      textAlign: "center",
      marginBottom: 16,
    },
    logoutCircle: {
      backgroundColor: colors.surface,
    },
    logoutText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "600",
      color: colors.danger,
      marginLeft: 12,
    },
  });

export default ScolaMenu;
