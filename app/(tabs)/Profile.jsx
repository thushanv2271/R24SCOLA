import React, { useState, useEffect, useContext, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
} from "react-native";
import RefreshControl from "../../components/ui/AppRefreshControl";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { authAPI } from "../../services/apiService";
import usePushSettings from "../../hooks/usePushSettings";
import { useFavorites } from "../../services/favoritesStore";
import AlertModal from "../../components/AlertModal";
import { useFeedbackPrefs, setFeedbackPref, playSound } from "../../utils/feedback";
import { haptic } from "../../components/ui/motion";
import { AuthContext } from "../../components/AuthContext";
import { LanguageContext, LANGUAGES } from "../../components/LanguageContext";
import ScolaMenu from "../../components/ScolaMenu";
import NotificationModal from "../../components/NotificationModal";
import LoaderModal from "../../components/ui/LoaderModal";
import Avatar from "../../components/ui/Avatar";
import ProgressRing from "../../components/ui/ProgressRing";
import Badge from "../../components/ui/Badge";
import ScreenHeader from "../../components/blocks/ScreenHeader";
import AvatarPickerModal from "../../components/blocks/AvatarPickerModal";
import CoinsDetailCard from "../../components/blocks/CoinsDetailCard";
import LanguagePickerModal from "../../components/blocks/LanguagePickerModal";
import ThemePickerModal from "../../components/blocks/ThemePickerModal";
import InterestPickerModal from "../../components/blocks/InterestPickerModal";
import { useInterest } from "../../components/InterestContext";
import CreatorModePickerModal from "../../components/blocks/CreatorModePickerModal";
import ChangePasswordModal from "../../components/blocks/ChangePasswordModal";
import DeleteAccountModal from "../../components/blocks/DeleteAccountModal";
import { educationLevelLabelKey } from "../../constants/educationLevels";
import { useTheme } from "../../components/ThemeContext";
import { useGuideTarget, useGuideScroll } from "../../utils/guideTargets";
import { setPetHidden, useSetupGuide } from "../../utils/setupGuide";
import { openHootCustomize } from "../../utils/hootChatStore";

const AVATAR_SIZE = 64;
const RING_SIZE = AVATAR_SIZE + 12;

const PERSONAL_DETAILS_EMPTY = {
  fullName: "",
  email: "",
  phoneNumber: "",
  country: "",
  dateOfBirth: "",
  educationLevel: "",
  fieldOfStudy: "",
};
const COMPLETENESS_KEYS = Object.keys(PERSONAL_DETAILS_EMPTY);

export default function Profile() {
  const router = useRouter();
  const { username: paramUsername } = useLocalSearchParams();
  const {
    user,
    logout,
    favoritesRefreshTrigger,
    notifications,
    avatarIcon,
    updateAvatarIcon,
    avatarPhotoUri,
    updateCreatorMode,
  } = useContext(AuthContext);
  const { t, language, setLanguage } = useContext(LanguageContext);
  const { colors, themePreference } = useTheme();
  const [avatarPickerVisible, setAvatarPickerVisible] = useState(false);
  const [paidMember, setPaidMember] = useState(null);
  const [personalDetails, setPersonalDetails] = useState(PERSONAL_DETAILS_EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const sharedFavorites = useFavorites();
  const favoriteScholarshipsCount = sharedFavorites.scholarships?.length || 0;
  const favoriteJobsCount = sharedFavorites.jobs?.length || 0;
  const [username, setUsername] = useState(paramUsername || user?.username || "");
  const push = usePushSettings(user?.username);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [themePickerVisible, setThemePickerVisible] = useState(false);
  const [interestPickerVisible, setInterestPickerVisible] = useState(false);
  const { interest } = useInterest();
  const [creatorModePickerVisible, setCreatorModePickerVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info",
    actions: [],
  });

  const creatorModeEnabled = !!user?.creatorModeEnabled;
  const creatorRole = ["companyOwner", "universityOwner"].includes(user?.creatorRole)
    ? user.creatorRole
    : "companyOwner";
  const creatorModeValue = creatorModeEnabled
    ? (creatorRole === "universityOwner" ? t("profile.creatorRoleUniversityOwner") : t("profile.creatorRoleCompanyOwner"))
    : t("profile.creatorModeDisabled");

  const showAlert = (title, message, type = "info", actions = []) => {
    setAlertConfig({ visible: true, title, message, type, actions });
  };

  const closeAlert = () => {
    setAlertConfig({ ...alertConfig, visible: false });
  };

  useEffect(() => {
    const resolveUsername = async () => {
      if (paramUsername) {
        setUsername(paramUsername);
      } else if (user?.username) {
        setUsername(user.username);
      } else {
        const storedUsername = await AsyncStorage.getItem("username");
        if (storedUsername) {
          setUsername(storedUsername);
        }
      }
    };
    resolveUsername();
  }, [paramUsername, user?.username]);

  const fetchUserDetails = useCallback(async () => {
    if (!username) return;
    try {
      const data = await authAPI.getUserByUsername(username);
      setPaidMember(data.paidMember);
      setPersonalDetails({
        fullName: data.fullName || "",
        email: data.email || "",
        phoneNumber: data.phoneNumber || "",
        country: data.country || "",
        dateOfBirth: data.dateOfBirth || "",
        educationLevel: data.educationLevel || "",
        fieldOfStudy: data.fieldOfStudy || "",
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
      if (error?.isNetworkError) {
        showAlert(
          t("auth.noInternetTitle"),
          t("auth.noInternetMessage"),
          "warning",
        );
      }
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchUserDetails();
    }, [fetchUserDetails]),
  );

  const feedbackPrefs = useFeedbackPrefs();
  const guideState = useSetupGuide();
  const guideScroll = useGuideScroll();
  const guideDetailsRef = useGuideTarget("profile.details", guideScroll.reveal);
  const guideMailRef = useGuideTarget("profile.mail", guideScroll.reveal);
  const guideLanguageRef = useGuideTarget("profile.language", guideScroll.reveal);
  const guideThemeRef = useGuideTarget("profile.theme", guideScroll.reveal);
  const guideNotificationsRef = useGuideTarget("profile.notifications", guideScroll.reveal);
  const guideFeedbackRef = useGuideTarget("profile.feedback", guideScroll.reveal);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserDetails();
    setRefreshing(false);
  }, [fetchUserDetails]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Error during logout:", error);
      showAlert(t("common.error"), t("ui.errors.generic"), "error");
    }
  };

  const confirmLogout = () => {
    showAlert(t("ui.confirm.logoutTitle"), t("ui.confirm.logoutMessage"), "warning", [
      { text: t("common.cancel"), secondary: true },
      {
        text: t("profile.logout"),
        destructive: true,
        onPress: () => setTimeout(handleLogout, 350),
      },
    ]);
  };

  const handleToggleNotifications = async (next) => {
    const result = await push.toggle(next);
    if (result?.ok) return;
    if (result.reason === "denied") {
      showAlert(t("settings.notificationsBlockedTitle"), t("settings.notificationsBlockedMessage"), "warning", [
        { text: t("common.cancel"), secondary: true },
        { text: t("settings.notificationsOpenSettings"), onPress: () => Linking.openSettings() },
      ]);
    } else if (result.reason === "unavailable") {
      showAlert(t("settings.notifications"), t("settings.notificationsUnavailable"), "info");
    } else {
      showAlert(t("common.error"), t("settings.notificationsFailed"), "error");
    }
  };

  const handleSelectLanguage = async (code) => {
    setLanguage(code);
    setLanguagePickerVisible(false);
    if (user?.username) {
      try {
        await authAPI.updateLanguage(user.username, code);
      } catch (error) {
        // The switch already applied locally — a failed server sync just
        // means it won't be remembered on a different device yet.
        console.error("Error syncing language to server:", error);
      }
    }
  };

  const handleSelectCreatorMode = async (nextEnabled, nextRole) => {
    const saved = await updateCreatorMode(nextEnabled, nextRole);
    if (!saved) {
      showAlert(t("common.error"), t("ui.errors.generic"), "error");
    }
  };

  const handleConfirmDeleteAccount = async ({ reason, note }) => {
    if (!user?.username || deletingAccount) return;
    setDeletingAccount(true);
    try {
      await authAPI.deleteAccount(user.username, reason, note);
      setDeleteAccountVisible(false);
      await logout();
      router.replace("/login");
    } catch (error) {
      console.error("Error deleting account:", error);
      showAlert(t("common.error"), error?.message || "Could not delete your account.", "error");
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleChangePassword = async ({ currentPassword, newPassword }, resetForm) => {
    if (!user?.username || changingPassword) return;
    setChangingPassword(true);
    try {
      await authAPI.changePassword(user.username, currentPassword, newPassword);
      setChangePasswordVisible(false);
      resetForm();
      showAlert(t("changePassword.updatedTitle"), t("changePassword.updatedMessage"), "success");
    } catch (error) {
      console.error("Error changing password:", error);
      const message =
        error?.isNetworkError
          ? t("auth.noInternetMessage")
          : error?.status === 403
            ? t("changePassword.incorrectCurrent")
            : error?.status === 429
              ? t("changePassword.tooMany")
              : error?.status === 400
                ? t("changePassword.weak")
                : t("changePassword.failed");
      showAlert(t("common.error"), message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  // Setup progress = every personal-details field, each counting equally
  // toward the ring. (Language, light/dark and interest are chosen in the
  // first-launch setup, so they are not part of this checklist.)
  const filledDetails = COMPLETENESS_KEYS.filter((key) => !!personalDetails[key]?.trim?.()).length;
  const detailsDone = filledDetails === COMPLETENESS_KEYS.length;
  const completeness = Math.round((filledDetails / COMPLETENESS_KEYS.length) * 100);
  const setupSteps = [
    {
      key: "details",
      icon: "person-outline",
      label: t("profile.setupDetails"),
      done: detailsDone,
      onPress: () => router.push("/PersonalDetails"),
    },
  ];
  const nextSetupStep = setupSteps.find((step) => !step.done);

  const eduLabelKey = personalDetails.educationLevel
    ? educationLevelLabelKey(personalDetails.educationLevel)
    : null;
  // Falls back to the raw stored value for accounts that saved a free-text
  // education level before this screen had the fixed chip options.
  const educationLevelDisplay = personalDetails.educationLevel
    ? (eduLabelKey ? t(eduLabelKey) : personalDetails.educationLevel)
    : t("profile.notSet");

  const infoRows = [{ label: t("profile.username"), value: username }];
  if (paidMember !== null) {
    infoRows.push({
      label: t("profile.memberStatus"),
      value: paidMember ? t("profile.premiumMember") : t("profile.freeMember"),
      tone: paidMember ? "success" : "error",
    });
  }
  infoRows.push(
    { label: t("profile.fullName"), value: personalDetails.fullName || t("profile.notSet") },
    { label: t("profile.email"), value: personalDetails.email || t("profile.notSet") },
    { label: t("profile.phoneNumber"), value: personalDetails.phoneNumber || t("profile.notSet") },
    { label: t("profile.country"), value: personalDetails.country || t("profile.notSet") },
    { label: t("profile.dateOfBirth"), value: personalDetails.dateOfBirth || t("profile.notSet") },
    { label: t("profile.educationLevel"), value: educationLevelDisplay },
    { label: t("profile.fieldOfStudy"), value: personalDetails.fieldOfStudy || t("profile.notSet") },
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <View style={[styles.headerContainer, { backgroundColor: colors.headerBackground }]}>
        <ScreenHeader
          icons={[
            {
              key: "notifications",
              name: "notifications",
              accessibilityLabel: t("ui.a11y.notifications"),
              onPress: () => setShowNotificationModal(true),
              badgeCount: notifications?.length || 0,
            },
          ]}
          onMenuPress={() => setMenuVisible(true)}
        />
      </View>

      <ScrollView
        {...guideScroll.scrollProps}
        contentContainerStyle={styles.scrollViewContent}
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hero: avatar + identity + stats, all in one compact card */}
        <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
          <View style={styles.heroTopRow}>
            <TouchableOpacity
              onPress={() => setAvatarPickerVisible(true)}
              activeOpacity={0.8}
              style={styles.avatarTouchable}
              accessibilityRole="button"
              accessibilityLabel={t("profile.changeAvatar", "Change avatar")}
            >
              <ProgressRing size={RING_SIZE} strokeWidth={3.5} progress={completeness}>
                <Avatar
                  name={username}
                  size={AVATAR_SIZE}
                  icon={avatarIcon?.icon}
                  color={avatarIcon?.color}
                  photoUri={avatarPhotoUri}
                />
              </ProgressRing>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={11} color="#fff" />
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {username || "User"}
              </Text>
              <Text style={[styles.completenessText, { color: colors.accent }]} numberOfLines={1}>
                {t("profile.setupProgressTemplate", { pct: completeness })}
              </Text>
              {nextSetupStep && (
                <TouchableOpacity
                  onPress={nextSetupStep.onPress}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Text style={[styles.completenessCta, { color: colors.textSecondary }]} numberOfLines={2}>
                    {t("profile.setupFinishCta")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.heroDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStat}>
              <Ionicons name="book-outline" size={16} color={colors.accent} />
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{favoriteScholarshipsCount}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t("profile.scholarships")}</Text>
            </View>
            <View style={[styles.heroStatDivider, { backgroundColor: colors.divider }]} />
            <View style={styles.heroStat}>
              <Ionicons name="briefcase-outline" size={16} color={colors.accent} />
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>{favoriteJobsCount}</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]} numberOfLines={1}>{t("profile.jobs")}</Text>
            </View>
          </View>
        </View>

        {/* Initial setup checklist: hidden once everything is done */}
        {nextSetupStep && (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("profile.setupTitle")}</Text>
            <Text style={[styles.moreRowValue, { color: colors.textMuted, marginBottom: 6 }]}>
              {t("profile.setupSubtitle")}
            </Text>
            {setupSteps.map((step, index) => (
              <View key={step.key}>
                {index > 0 && <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />}
                <TouchableOpacity
                  style={styles.moreRow}
                  onPress={step.onPress}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityState={{ checked: step.done }}
                >
                  <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
                    <Ionicons name={step.icon} size={18} color={colors.accent} />
                  </View>
                  <View style={styles.moreRowText}>
                    <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{step.label}</Text>
                  </View>
                  {step.done ? (
                    <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                  ) : (
                    <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Scola Coins */}
        <View style={styles.coinsCardSlot}>
          <CoinsDetailCard />
        </View>

        {/* Account Information */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("profile.accountInformation")}</Text>
          {infoRows.map((row, index) => (
            <View key={row.label}>
              {index > 0 && <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />}
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.textSecondary }]} numberOfLines={1}>{row.label}</Text>
                {row.tone ? (
                  <Badge label={row.value} tone={row.tone} />
                ) : (
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                    {row.value}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>


        {/* Account: edit details, change password */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("settings.account")}</Text>

          <View ref={guideDetailsRef} collapsable={false}>
          <TouchableOpacity style={styles.moreRow} onPress={() => router.push("/PersonalDetails")} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="person-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("profile.personalDetails")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                {t("profile.personalDetailsDesc")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View ref={guideMailRef} collapsable={false}>
          <TouchableOpacity style={styles.moreRow} onPress={() => router.push("/CustomMail")} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="mail-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("home.stepMail")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("home.stepMailDesc")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.moreRow} onPress={() => setChangePasswordVisible(true)} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="key-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("changePassword.title")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Preferences: language, appearance */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("settings.preferences")}</Text>

          <View ref={guideLanguageRef} collapsable={false}>
          <TouchableOpacity style={styles.moreRow} onPress={() => setLanguagePickerVisible(true)} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="language-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("profile.language")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                {LANGUAGES.find((l) => l.code === language)?.name || "English"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.moreRow} onPress={() => setInterestPickerVisible(true)} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="compass-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("interest.settingsLabel")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                {interest === "universities"
                  ? t("explore.universities")
                  : interest === "companies"
                    ? t("explore.companies")
                    : t("interest.both")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View ref={guideThemeRef} collapsable={false}>
          <TouchableOpacity style={styles.moreRow} onPress={() => setThemePickerVisible(true)} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="contrast-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("settings.appearance")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                {t(`settings.theme${themePreference.charAt(0).toUpperCase()}${themePreference.slice(1)}`)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View ref={guideNotificationsRef} collapsable={false} style={styles.moreRow}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name={push.enabled ? "notifications" : "notifications-outline"} size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("settings.notifications")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {push.enabled
                  ? t("settings.notificationsOn")
                  : push.blocked
                    ? t("settings.notificationsBlocked")
                    : t("settings.notificationsOff")}
              </Text>
            </View>
            <Switch
              value={push.enabled}
              onValueChange={handleToggleNotifications}
              disabled={push.busy}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
              accessibilityLabel={t("settings.notifications")}
            />
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View ref={guideFeedbackRef} collapsable={false}>
          <View style={styles.moreRow}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="volume-high-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("settings.soundEffects")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("settings.soundEffectsDesc")}
              </Text>
            </View>
            <Switch
              value={feedbackPrefs.sound}
              onValueChange={(v) => {
                setFeedbackPref("sound", v);
                if (v) setTimeout(() => playSound("success"), 50);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
              accessibilityLabel={t("settings.soundEffects")}
            />
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.moreRow}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="phone-portrait-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("settings.haptics")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("settings.hapticsDesc")}
              </Text>
            </View>
            <Switch
              value={feedbackPrefs.haptics}
              onValueChange={(v) => {
                setFeedbackPref("haptics", v);
                if (v) setTimeout(() => haptic("success"), 50);
              }}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
              accessibilityLabel={t("settings.haptics")}
            />
          </View>
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <View style={styles.moreRow}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="help-buoy-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("setup.assistantTitle")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("setup.assistantSub")}
              </Text>
            </View>
            <Switch
              value={!guideState.petHidden}
              onValueChange={(v) => setPetHidden(!v)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor="#ffffff"
              accessibilityLabel={t("setup.assistantTitle")}
            />
          </View>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.moreRow} onPress={openHootCustomize} activeOpacity={0.7} accessibilityRole="button">
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="color-palette-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("setup.pet.customize")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("setup.pet.customizeSub")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Creator Mode */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("profile.creatorMode")}</Text>
          <TouchableOpacity style={styles.moreRow} onPress={() => setCreatorModePickerVisible(true)} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="megaphone-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("profile.creatorMode")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                {creatorModeValue}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          {creatorModeEnabled && (
            <>
              <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />
              <TouchableOpacity style={styles.moreRow} onPress={() => router.push("/MyCreatorListings")} activeOpacity={0.7}>
                <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="bar-chart-outline" size={18} color={colors.accent} />
                </View>
                <View style={styles.moreRowText}>
                  <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("creatorListing.myListings")}</Text>
                  <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={1}>
                    {t("creatorListing.myListingsDesc")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}

          <Text style={[styles.cardFootnote, { color: colors.textSecondary }]}>
            {t("profile.creatorModeDescription")}
          </Text>
        </View>

        {/* Privacy & Legal (incl. delete account) */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardTitle, { color: colors.textMuted }]}>{t("settings.privacyLegal")}</Text>

          <TouchableOpacity style={styles.moreRow} onPress={() => router.push("/HowToApply")} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("profile.howToApply")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.infoDivider, { backgroundColor: colors.divider }]} />

          <TouchableOpacity style={styles.moreRow} onPress={() => router.push("/PrivacyPolicy")} activeOpacity={0.7}>
            <View style={[styles.moreIconWrap, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.textPrimary }]}>{t("profile.privacyPolicy")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>

        </View>

        {/* Logout */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={styles.moreRow} onPress={confirmLogout} activeOpacity={0.7} accessibilityRole="button">
            <View style={[styles.moreIconWrap, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.danger }]}>{t("profile.logout")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Danger zone: kept apart from everyday actions like Logout */}
        <View style={[styles.card, styles.dangerCard, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
          <Text style={[styles.cardTitle, { color: colors.danger }]}>{t("ui.dangerZone")}</Text>
          <TouchableOpacity style={styles.moreRow} onPress={() => setDeleteAccountVisible(true)} activeOpacity={0.7} accessibilityRole="button">
            <View style={[styles.moreIconWrap, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </View>
            <View style={styles.moreRowText}>
              <Text style={[styles.moreRowLabel, { color: colors.danger }]}>{t("profile.deleteAccount")}</Text>
              <Text style={[styles.moreRowValue, { color: colors.textMuted }]} numberOfLines={2}>
                {t("profile.deleteAccountWarning")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={15} color={colors.success} />
          <Text style={[styles.trustBadgeText, { color: colors.textSecondary }]}>{t("profile.trustBadge")}</Text>
        </View>
      </ScrollView>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={
          alertConfig.actions.length > 0
            ? alertConfig.actions
            : [{ text: t("common.ok"), onPress: closeAlert }]
        }
        onClose={closeAlert}
      />
      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      <AvatarPickerModal
        visible={avatarPickerVisible}
        onClose={() => setAvatarPickerVisible(false)}
        username={username}
        selectedIcon={avatarIcon}
        onSelect={updateAvatarIcon}
        photoUri={avatarPhotoUri}
      />
      <LanguagePickerModal
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
        onSelect={handleSelectLanguage}
      />
      <ThemePickerModal
        visible={themePickerVisible}
        onClose={() => setThemePickerVisible(false)}
      />
      <InterestPickerModal
        visible={interestPickerVisible}
        onClose={() => setInterestPickerVisible(false)}
      />
      <CreatorModePickerModal
        visible={creatorModePickerVisible}
        onClose={() => setCreatorModePickerVisible(false)}
        creatorModeEnabled={creatorModeEnabled}
        creatorRole={creatorRole}
        onSelect={handleSelectCreatorMode}
      />
      <ChangePasswordModal
        visible={changePasswordVisible}
        onClose={() => setChangePasswordVisible(false)}
        onSubmit={handleChangePassword}
        submitting={changingPassword}
      />
      <DeleteAccountModal
        visible={deleteAccountVisible}
        onClose={() => setDeleteAccountVisible(false)}
        onConfirm={handleConfirmDeleteAccount}
        deleting={deletingAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  // Same side gutter and bottom spacing as the other tab headers.
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  dangerCard: {
    borderWidth: 1,
    marginTop: 14,
  },
  scrollViewContent: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 28,
  },
  heroCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 10,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarTouchable: {
    position: "relative",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#004aad",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInfo: {
    flex: 1,
  },
  name: {
    fontSize: 19,
    fontWeight: "800",
    fontFamily: "Roboto",
    color: "#111827",
    textTransform: "capitalize",
  },
  completenessText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#004aad",
    fontFamily: "Roboto",
    marginTop: 3,
  },
  completenessCta: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    fontFamily: "Roboto",
    textDecorationLine: "underline",
    marginTop: 3,
  },
  heroDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 12,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroStat: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
  },
  heroStatValue: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
    fontFamily: "Roboto",
  },
  heroStatLabel: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Roboto",
  },
  heroStatDivider: {
    width: 1,
    height: 20,
    backgroundColor: "#f1f5f9",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  coinsCardSlot: {
    marginTop: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94a3b8",
    fontFamily: "Roboto",
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    gap: 10,
  },
  infoLabel: {
    fontSize: 13.5,
    fontFamily: "Roboto",
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    flexShrink: 1,
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
  },
  moreRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 12,
  },
  moreIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "#eff6ff",
    justifyContent: "center",
    alignItems: "center",
  },
  moreIconWrapDanger: {
    backgroundColor: "#fee2e2",
  },
  moreRowText: {
    flex: 1,
  },
  moreRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
  moreRowLabelDanger: {
    color: "#ef4444",
  },
  moreRowValue: {
    fontSize: 12,
    color: "#94a3b8",
    fontFamily: "Roboto",
    marginTop: 2,
  },
  cardFootnote: {
    fontSize: 12,
    fontFamily: "Roboto",
    lineHeight: 16,
    marginTop: 8,
  },
  trustBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 16,
  },
  trustBadgeText: {
    fontSize: 12,
    color: "#64748b",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
});
