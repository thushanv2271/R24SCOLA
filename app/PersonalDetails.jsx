import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  BackHandler,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { AuthContext } from "../components/AuthContext";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { authAPI } from "../services/apiService";
import { EDUCATION_LEVELS, educationLevelLabelKey } from "../constants/educationLevels";
import { PROFILE_COUNTRIES } from "../constants/countries";
import { FIELD_OF_STUDY_OPTIONS } from "../constants/categories";
import ScreenHeader from "../components/blocks/ScreenHeader";
import ScolaMenu from "../components/ScolaMenu";
import LoaderModal from "../components/ui/LoaderModal";
import AlertModal from "../components/AlertModal";
import PickerField from "../components/ui/PickerField";
import DateField, { formatDate } from "../components/ui/DateField";
import { validateField } from "../utils/profileValidation";
import { markGuideStepDone } from "../utils/setupGuide";

const OTHER_FIELD = "__other__";

const KEYS = ["fullName", "dateOfBirth", "country", "email", "phoneNumber", "educationLevel", "fieldOfStudy"];

const SECTIONS = [
  { id: "about", titleKey: "personalDetails.sectionAbout", icon: "person", keys: ["fullName", "dateOfBirth", "country"] },
  { id: "contact", titleKey: "personalDetails.sectionContact", icon: "call", keys: ["email", "phoneNumber"] },
  { id: "education", titleKey: "personalDetails.sectionEducation", icon: "school", keys: ["educationLevel", "fieldOfStudy"] },
];

const FIELDS = {
  fullName: { labelKey: "personalDetails.fullName", placeholderKey: "personalDetails.fullNamePlaceholder", hintKey: "personalDetails.hintName", icon: "person-outline", autoCapitalize: "words", autoComplete: "name" },
  dateOfBirth: { labelKey: "personalDetails.dateOfBirth", placeholderKey: "personalDetails.dateOfBirthPlaceholder", hintKey: "personalDetails.hintDob", icon: "calendar-outline" },
  country: { labelKey: "personalDetails.country", placeholderKey: "personalDetails.countryPlaceholder", hintKey: "personalDetails.hintCountry", icon: "earth-outline" },
  email: { labelKey: "personalDetails.email", placeholderKey: "personalDetails.emailPlaceholder", hintKey: "personalDetails.hintEmail", icon: "mail-outline", keyboardType: "email-address", autoCapitalize: "none", autoComplete: "email" },
  phoneNumber: { labelKey: "personalDetails.phoneNumber", placeholderKey: "personalDetails.phoneNumberPlaceholder", hintKey: "personalDetails.hintPhone", icon: "call-outline", keyboardType: "phone-pad", autoComplete: "tel" },
  educationLevel: { labelKey: "personalDetails.educationLevel", icon: "school-outline" },
  fieldOfStudy: { labelKey: "personalDetails.fieldOfStudy", placeholderKey: "personalDetails.fieldOfStudyPlaceholder", hintKey: "personalDetails.hintField", icon: "book-outline" },
};

const EMPTY_FORM = KEYS.reduce((acc, key) => ({ ...acc, [key]: "" }), {});

const FIELD_OPTIONS = FIELD_OF_STUDY_OPTIONS.map((major) => ({ value: major, label: major }));

const pickFields = (data) =>
  KEYS.reduce((acc, key) => ({ ...acc, [key]: (data?.[key] || "").toString().trim() }), {});

const FieldBlock = ({ label, error, hint, colors, onLayout, children }) => (
  <View style={styles.fieldBlock} onLayout={onLayout}>
    <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    {children}
    {error ? (
      <View style={styles.messageRow} accessibilityLiveRegion="polite">
        <Ionicons name="alert-circle" size={15} color={colors.danger} />
        <Text style={[styles.messageText, { color: colors.danger }]}>{error}</Text>
      </View>
    ) : hint ? (
      <Text style={[styles.hint, { color: colors.textMuted }]}>{hint}</Text>
    ) : null}
  </View>
);

export default function PersonalDetailsScreen() {
  const { user, updateProfile } = useContext(AuthContext);
  const { t, language } = useContext(LanguageContext);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const themed = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState("edit");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saved, setSaved] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [focusedKey, setFocusedKey] = useState(null);
  const [otherField, setOtherField] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info", actions: null });
  const scrollRef = useRef(null);
  const sectionY = useRef({});
  const fieldY = useRef({});
  const toastTimer = useRef(null);

  const showAlert = (title, message, type = "info", actions = null) =>
    setAlertConfig({ visible: true, title, message, type, actions });
  const hideAlert = () => setAlertConfig((prev) => ({ ...prev, visible: false }));

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardOpen(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardOpen(false));
    return () => {
      show.remove();
      hide.remove();
      clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }
      try {
        const data = await authAPI.getUserByUsername(user.username);
        const fields = pickFields(data);
        setForm(fields);
        setSaved(fields);
        setOtherField(!!fields.fieldOfStudy && !FIELD_OF_STUDY_OPTIONS.includes(fields.fieldOfStudy));
        // Everything answered already: show the saved profile, not the questions.
        setMode(KEYS.every((key) => !validateField(key, fields[key])) ? "view" : "edit");
        if (KEYS.some((key) => (user?.[key] || "") !== fields[key])) updateProfile?.(fields);
      } catch (error) {
        console.error("Error loading personal details:", error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.username]);

  const errors = useMemo(
    () => KEYS.reduce((acc, key) => ({ ...acc, [key]: validateField(key, form[key]) }), {}),
    [form],
  );
  const validCount = KEYS.filter((key) => !errors[key]).length;
  const dirty = KEYS.some((key) => form[key].trim() !== saved[key]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const errorFor = (key) => ((touched[key] || submitted) && errors[key] ? t(errors[key]) : null);

  const save = async (payload) => {
    await authAPI.updatePersonalDetails(user.username, payload);
    await updateProfile?.(payload);
    setSaved(payload);
  };

  const scrollToFirstInvalid = () => {
    const firstKey = KEYS.find((key) => errors[key]);
    if (!firstKey) return;
    const section = SECTIONS.find((s) => s.keys.includes(firstKey));
    const y = (sectionY.current[section.id] || 0) + (fieldY.current[firstKey] || 0);
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 24), animated: true });
  };

  const handleSave = async () => {
    if (saving) return;
    Keyboard.dismiss();
    setSubmitted(true);
    if (KEYS.some((key) => errors[key])) {
      scrollToFirstInvalid();
      return;
    }
    const payload = pickFields(form);
    setSaving(true);
    try {
      if (user?.username) await save(payload);
      setForm(payload);
      markGuideStepDone("detailsForm", "profile");
      setMode("view");
      setSubmitted(false);
      setTouched({});
      setJustSaved(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setJustSaved(false), 3000);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch (error) {
      console.error("Error saving personal details:", error);
      showAlert(t("common.error"), error?.message || t("ui.errors.generic"), "error");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setSubmitted(false);
    setTouched({});
    setJustSaved(false);
    setMode("edit");
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };

  const cancelEdit = () => {
    Keyboard.dismiss();
    setForm(saved);
    setOtherField(!!saved.fieldOfStudy && !FIELD_OF_STUDY_OPTIONS.includes(saved.fieldOfStudy));
    setSubmitted(false);
    setTouched({});
    setMode("view");
  };

  // Leaving mid-way keeps every valid answer; invalid ones fall back to what
  // was already saved, so nothing is wiped and nothing half-typed is stored.
  const handleExit = useCallback(async () => {
    if (mode !== "edit" || !dirty || !user?.username) {
      router.back();
      return;
    }
    const payload = KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: errors[key] ? saved[key] : form[key].trim() }),
      {},
    );
    try {
      await save(payload);
      router.back();
    } catch (error) {
      console.error("Error saving personal details:", error);
      showAlert(t("common.error"), error?.message || t("ui.errors.generic"), "error", [
        { text: t("common.cancel"), onPress: hideAlert },
        { text: t("common.back"), onPress: () => { hideAlert(); router.back(); } },
      ]);
    }
  }, [mode, dirty, errors, form, saved, user?.username]);

  const exitRef = useRef(handleExit);
  exitRef.current = handleExit;
  const guardBack = mode === "edit" && dirty;

  useEffect(() => {
    if (!guardBack) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      exitRef.current();
      return true;
    });
    return () => sub.remove();
  }, [guardBack]);

  if (loading) {
    return (
      <SafeAreaView style={themed.container}>
        <LoaderModal />
      </SafeAreaView>
    );
  }

  const fieldOptions = [...FIELD_OPTIONS, { value: OTHER_FIELD, label: t("personalDetails.fieldOther") }];
  const hintOf = (key) => t(FIELDS[key].hintKey);
  const focusProps = (key) => ({
    onFocus: () => setFocusedKey(key),
    onBlur: () => {
      setFocusedKey(null);
      if (form[key]) setTouched((prev) => ({ ...prev, [key]: true }));
    },
  });

  const renderTextInput = (key) => {
    const cfg = FIELDS[key];
    const hasError = !!errorFor(key);
    return (
      <View
        style={[
          themed.inputWrap,
          focusedKey === key && themed.inputWrapFocused,
          hasError && { borderColor: colors.danger },
        ]}
      >
        <Ionicons name={cfg.icon} size={20} color={colors.textMuted} />
        <TextInput
          style={themed.input}
          value={form[key]}
          onChangeText={(value) => handleChange(key, value)}
          placeholder={t(cfg.placeholderKey)}
          placeholderTextColor={colors.textMuted}
          keyboardType={cfg.keyboardType}
          autoCapitalize={cfg.autoCapitalize || "sentences"}
          autoComplete={cfg.autoComplete}
          autoCorrect={false}
          returnKeyType="next"
          {...focusProps(key)}
        />
      </View>
    );
  };

  const renderControl = (key) => {
    const cfg = FIELDS[key];
    switch (key) {
      case "country":
        return (
          <PickerField
            value={form.country}
            options={PROFILE_COUNTRIES}
            onChange={(value) => handleChange("country", value)}
            placeholder={t(cfg.placeholderKey)}
            title={t(cfg.labelKey)}
            searchable
            invalid={!!errorFor(key)}
            leadingIcon={<Ionicons name={cfg.icon} size={20} color={colors.textMuted} />}
          />
        );
      case "dateOfBirth":
        return (
          <DateField
            value={form.dateOfBirth}
            onChange={(value) => handleChange("dateOfBirth", value)}
            placeholder={t(cfg.placeholderKey)}
            title={t(cfg.labelKey)}
            invalid={!!errorFor(key)}
          />
        );
      case "educationLevel":
        return (
          <View style={themed.chipRow}>
            {EDUCATION_LEVELS.map((level) => {
              const selected = form.educationLevel === level.key;
              return (
                <TouchableOpacity
                  key={level.key}
                  style={[themed.chip, selected && themed.chipSelected, !!errorFor(key) && !selected && { borderColor: colors.danger }]}
                  onPress={() => handleChange("educationLevel", level.key)}
                  activeOpacity={0.8}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  {selected && <Ionicons name="checkmark" size={16} color="#fff" />}
                  <Text style={[themed.chipText, selected && themed.chipTextSelected]}>{t(level.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      case "fieldOfStudy":
        return (
          <View style={styles.fieldStack}>
            <PickerField
              value={otherField ? OTHER_FIELD : form.fieldOfStudy}
              options={fieldOptions}
              onChange={(value) => {
                if (value === OTHER_FIELD) {
                  setOtherField(true);
                  if (FIELD_OF_STUDY_OPTIONS.includes(form.fieldOfStudy)) handleChange("fieldOfStudy", "");
                } else {
                  setOtherField(false);
                  handleChange("fieldOfStudy", value);
                }
              }}
              placeholder={t(cfg.placeholderKey)}
              title={t(cfg.labelKey)}
              searchable
              invalid={!!errorFor(key) && !otherField}
              leadingIcon={<Ionicons name={cfg.icon} size={20} color={colors.textMuted} />}
            />
            {otherField && (
              <View
                style={[
                  themed.inputWrap,
                  focusedKey === key && themed.inputWrapFocused,
                  !!errorFor(key) && { borderColor: colors.danger },
                ]}
              >
                <Ionicons name="create-outline" size={20} color={colors.textMuted} />
                <TextInput
                  style={themed.input}
                  value={form.fieldOfStudy}
                  onChangeText={(value) => handleChange("fieldOfStudy", value)}
                  placeholder={t("personalDetails.fieldOtherPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                  returnKeyType="done"
                  {...focusProps(key)}
                />
              </View>
            )}
          </View>
        );
      default:
        return renderTextInput(key);
    }
  };

  const displayValue = (key) => {
    const value = saved[key];
    if (key === "dateOfBirth") return formatDate(value, language);
    if (key === "educationLevel") {
      const labelKey = educationLevelLabelKey(value);
      return labelKey ? t(labelKey) : value;
    }
    return value;
  };

  const renderView = () => (
    <>
      {justSaved && (
        <View style={[themed.toast, { backgroundColor: colors.accentLight }]} accessibilityLiveRegion="polite">
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={[themed.toastText, { color: colors.textPrimary }]}>{t("personalDetails.savedToast")}</Text>
        </View>
      )}
      <View style={themed.hero}>
        <View style={themed.heroIcon}>
          <Ionicons name="shield-checkmark" size={30} color={colors.success} />
        </View>
        <Text style={themed.heroTitle}>{t("personalDetails.completeTitle")}</Text>
        <Text style={themed.heroDesc}>{t("personalDetails.completeDesc")}</Text>
      </View>
      {SECTIONS.map((section) => (
        <View key={section.id} style={themed.card}>
          <View style={styles.cardHead}>
            <Ionicons name={section.icon} size={16} color={colors.accent} />
            <Text style={themed.cardTitle}>{t(section.titleKey)}</Text>
          </View>
          {section.keys.map((key, i) => {
            const flag = key === "country" ? PROFILE_COUNTRIES.find((c) => c.value === saved.country)?.flag : null;
            return (
              <View
                key={key}
                style={[styles.viewRow, i < section.keys.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}
              >
                <View style={themed.rowIcon}>
                  <Ionicons name={FIELDS[key].icon} size={18} color={colors.accent} />
                </View>
                <View style={styles.viewRowText}>
                  <Text style={themed.rowLabel}>{t(FIELDS[key].labelKey)}</Text>
                  <Text style={themed.rowValue} numberOfLines={2}>
                    {flag ? `${flag}  ` : ""}
                    {displayValue(key)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ))}
    </>
  );

  const renderEdit = () => (
    <>
      <Text style={themed.pageSubtitle}>
        {t("personalDetails.subtitle")}
      </Text>
      <View style={themed.progressCard}>
        <View style={styles.progressMeta}>
          <Text style={themed.progressText}>
            {t("personalDetails.completedOf", { done: validCount, total: KEYS.length })}
          </Text>
          <Text style={themed.progressPct}>{Math.round((validCount / KEYS.length) * 100)}%</Text>
        </View>
        <View style={themed.track}>
          <View style={[themed.trackFill, { width: `${(validCount / KEYS.length) * 100}%` }]} />
        </View>
      </View>
      {submitted && KEYS.some((key) => errors[key]) && (
        <View style={[themed.banner, { borderColor: colors.danger }]} accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={[themed.bannerText, { color: colors.danger }]}>{t("personalDetails.fixErrors")}</Text>
        </View>
      )}
      {SECTIONS.map((section) => (
        <View
          key={section.id}
          style={themed.card}
          onLayout={(e) => {
            sectionY.current[section.id] = e.nativeEvent.layout.y;
          }}
        >
          <View style={styles.cardHead}>
            <Ionicons name={section.icon} size={16} color={colors.accent} />
            <Text style={themed.cardTitle}>{t(section.titleKey)}</Text>
          </View>
          {section.keys.map((key) => (
            <FieldBlock
              key={key}
              label={t(FIELDS[key].labelKey)}
              error={errorFor(key)}
              hint={FIELDS[key].hintKey ? hintOf(key) : null}
              colors={colors}
              onLayout={(e) => {
                fieldY.current[key] = e.nativeEvent.layout.y;
              }}
            >
              {renderControl(key)}
            </FieldBlock>
          ))}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={themed.container} edges={["top", "left", "right"]}>
      <View style={themed.headerWrap}>
        <ScreenHeader onBack={handleExit} onMenuPress={() => setMenuVisible(true)} />
      </View>
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <KeyboardSafe>
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={themed.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={themed.pageTitle}>{t("personalDetails.title")}</Text>
          {mode === "view" ? renderView() : renderEdit()}
        </ScrollView>

        <View style={[themed.actionBar, { paddingBottom: (keyboardOpen ? 0 : insets.bottom) + 20 }]}>
          {mode === "view" ? (
            <TouchableOpacity
              style={themed.primaryAction}
              onPress={startEdit}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={themed.primaryActionText} numberOfLines={1}>
                {t("personalDetails.editDetails")}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {KEYS.every((key) => !validateField(key, saved[key])) && (
                <TouchableOpacity
                  style={themed.secondaryAction}
                  onPress={cancelEdit}
                  disabled={saving}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <Text style={themed.secondaryActionText} numberOfLines={1}>
                    {t("common.cancel")}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[themed.primaryAction, saving && themed.primaryActionDisabled]}
                onPress={handleSave}
                disabled={saving}
                activeOpacity={0.85}
                accessibilityRole="button"
              >
                <Text style={themed.primaryActionText} numberOfLines={1}>
                  {saving ? t("common.loading") : t("personalDetails.saveDetails")}
                </Text>
                {!saving && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardSafe>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={alertConfig.actions || [{ text: t("common.ok"), onPress: hideAlert }]}
        onClose={hideAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  fieldBlock: { marginTop: 14 },
  fieldStack: { gap: 10 },
  label: { fontSize: 13.5, fontWeight: "700", fontFamily: "Roboto", marginBottom: 8 },
  hint: { fontSize: 12, lineHeight: 17, fontFamily: "Roboto", marginTop: 6, textBreakStrategy: "simple" },
  messageRow: { flexDirection: "row", alignItems: "flex-start", gap: 5, marginTop: 6 },
  messageText: { flex: 1, fontSize: 12.5, lineHeight: 17, fontFamily: "Roboto", textBreakStrategy: "simple" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  progressMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  viewRowText: { flex: 1 },
});

const createStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenBackground },
    headerWrap: { paddingHorizontal: 16 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
    pageTitle: { fontSize: 24, fontWeight: "800", fontFamily: "Roboto", color: colors.textPrimary },
    pageSubtitle: {
      fontSize: 13.5,
      fontFamily: "Roboto",
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 19,
      textBreakStrategy: "simple",
    },
    progressCard: {
      marginTop: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    progressText: { fontSize: 13, fontWeight: "600", fontFamily: "Roboto", color: colors.textSecondary },
    progressPct: { fontSize: 13, fontWeight: "800", fontFamily: "Roboto", color: colors.accent },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.divider, overflow: "hidden" },
    trackFill: { height: 6, borderRadius: 3, backgroundColor: colors.accent },
    banner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    bannerText: { flex: 1, fontSize: 13, fontWeight: "600", fontFamily: "Roboto", textBreakStrategy: "simple" },
    card: {
      marginTop: 14,
      backgroundColor: colors.surface,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    cardTitle: {
      fontSize: 12.5,
      fontWeight: "800",
      fontFamily: "Roboto",
      color: colors.accent,
    },
    inputWrap: {
      minHeight: 54,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.surfaceAlt,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: "transparent",
      paddingHorizontal: 16,
    },
    inputWrapFocused: { borderColor: colors.accent, backgroundColor: colors.surface },
    input: {
      flex: 1,
      minHeight: 52,
      fontSize: 16,
      color: colors.textPrimary,
      fontFamily: "Roboto",
      paddingVertical: 10,
    },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      borderRadius: 22,
      borderWidth: 1.5,
      borderColor: "transparent",
      backgroundColor: colors.surfaceAlt,
    },
    chipSelected: { backgroundColor: colors.accent },
    chipText: { fontSize: 14, fontWeight: "600", fontFamily: "Roboto", color: colors.textSecondary },
    chipTextSelected: { color: "#fff" },
    hero: { alignItems: "center", marginTop: 16, paddingHorizontal: 12 },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    heroTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Roboto", color: colors.textPrimary, textAlign: "center" },
    heroDesc: {
      fontSize: 13.5,
      lineHeight: 19,
      fontFamily: "Roboto",
      color: colors.textSecondary,
      textAlign: "center",
      marginTop: 4,
      textBreakStrategy: "simple",
    },
    toast: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
    },
    toastText: { flex: 1, fontSize: 13.5, fontWeight: "600", fontFamily: "Roboto" },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.accentLight,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: { fontSize: 12, fontFamily: "Roboto", color: colors.textMuted },
    rowValue: { fontSize: 15, fontWeight: "600", fontFamily: "Roboto", color: colors.textPrimary, marginTop: 1, textBreakStrategy: "simple" },
    actionBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: colors.screenBackground,
    },
    primaryAction: {
      flex: 1,
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: colors.accent,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingHorizontal: 20,
    },
    primaryActionDisabled: { opacity: 0.6 },
    primaryActionText: { flexShrink: 1, fontSize: 16, fontWeight: "700", fontFamily: "Roboto", color: "#fff" },
    secondaryAction: {
      minHeight: 52,
      borderRadius: 26,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 22,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    secondaryActionText: { fontSize: 15, fontWeight: "700", fontFamily: "Roboto", color: colors.textPrimary },
  });
