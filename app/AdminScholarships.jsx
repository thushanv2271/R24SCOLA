import React, { useCallback, useContext, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView } from "react-native";
import RefreshControl from "../components/ui/AppRefreshControl";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";
import { adminExternalAPI, scholarshipAPI } from "../services/apiService";
import ScreenHeader from "../components/blocks/ScreenHeader";
import LoaderModal from "../components/ui/LoaderModal";
import AlertModal from "../components/AlertModal";
import { AuthContext } from "../components/AuthContext";
import { STUDY_LEVELS, getCategories, getGroupNames, getSubcategories, normalizeListing, normalizeListings } from "../constants/categories";

const PAGE_SIZE = 20;
// Compact UI chrome (chips, pill tags, icon-button labels) is capped so a
// device's "larger text" accessibility setting can't blow past the space
// these small elements have — full-size body text elsewhere isn't affected.
const COMPACT_FONT_SCALE = 1.2;

const LISTING_KIND_TABS = [
  { key: "university", labelKey: "admin.universities" },
  { key: "company", labelKey: "admin.companies" },
];

const EMPTY_FORM = {
  title: "",
  country: "",
  university: "",
  category: "",
  subcategory: "",
  listingKind: "university",
  funding: "Partial scholar",
  type: "Postgraduate",
  level: "Masters",
  courseValue: "",
  universityDetails: "",
  qualifications: "",
  universityWebsite: "",
  languageTestsText: "",
  imagesText: "",
  departmentHeadName: "",
  departmentHeadPosition: "",
  departmentHeadEmail: "",
  departmentHeadResearch: "",
  departmentHeadOffice: "",
  professorName: "",
  professorPosition: "",
  professorEmail: "",
  professorResearch: "",
  professorOffice: "",
};

const REMOTE_JOB_CATEGORIES = [
  { label: "All", value: "" },
  { label: "Software", value: "software-dev" },
  { label: "DevOps", value: "devops-sysadmin" },
  { label: "Data", value: "data" },
  { label: "QA", value: "qa" },
  { label: "Design", value: "design" },
  { label: "Product", value: "product" },
  { label: "Marketing", value: "marketing" },
];

const REMOTE_JOB_TYPE_LABELS = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  freelance: "Freelance",
  internship: "Internship",
};

const QUALITY_OPTIONS = ["all", "missing", "present"];

const hasScholarshipDetails = (item) => [
  item.universityDetails,
  item.qualifications,
  item.courseValue,
  item.universityWebsite,
  item.departmentHead?.name,
  item.departmentHead?.email,
  ...(item.contactProfessors || []).flatMap((professor) => [professor?.name, professor?.email, professor?.research, professor?.office]),
].some((value) => !!String(value || "").trim());

const hasScholarshipContactEmail = (item) =>
  (item.contactProfessors || []).some((professor) => !!professor?.email?.trim());

// Small pill — used for funding/major tags and the data-quality warnings.
// No numberOfLines/ellipsis: it sits in a flexWrap row, so it either fits on
// the current line or wraps whole to the next one — it never has a reason
// to truncate, which is what was cutting these off before.
const Pill = ({ label, color, backgroundColor }) => (
  <Text
    style={[styles.pill, { color, backgroundColor }]}
    maxFontSizeMultiplier={COMPACT_FONT_SCALE}
  >
    {label}
  </Text>
);

export default function AdminScholarships() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listingKind, setListingKind] = useState("university");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [activeMajor, setActiveMajor] = useState("");
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [imageFilter, setImageFilter] = useState("all");
  const [detailsFilter, setDetailsFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [failedImageUrls, setFailedImageUrls] = useState({});
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [lookupVisible, setLookupVisible] = useState(false);
  const [lookupType, setLookupType] = useState("university");
  const [lookupQuery, setLookupQuery] = useState("");
  const [remoteCategory, setRemoteCategory] = useState("");
  const [lookupResults, setLookupResults] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [cleanupBusy, setCleanupBusy] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState(null);
  const [importCountry, setImportCountry] = useState("Germany");
  const [importLimit, setImportLimit] = useState("50");
  const [importBusy, setImportBusy] = useState(false);
  const [importPreview, setImportPreview] = useState(null);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });

  const load = useCallback(async () => {
    if (!user?.isAdmin) {
      setLoading(false);
      return;
    }
    try {
      const data = await scholarshipAPI.getAdminPaged({
        page,
        pageSize: PAGE_SIZE,
        search: appliedSearch,
        major: activeMajor,
        ascending,
        kind: listingKind,
      });
      setItems(normalizeListings(data?.items));
      setTotalCount(data?.totalCount || 0);
      setPageCount(data?.pageCount || 0);
    } catch (error) {
      console.error("Error loading scholarships for admin:", error);
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeMajor, appliedSearch, ascending, listingKind, page, user?.isAdmin]);

  const switchListingKind = (kind) => {
    setPage(1);
    setListingKind(kind);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const applySearch = () => {
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const applyMajorFilter = () => {
    setPage(1);
    setActiveMajor(majorQuery.trim());
  };

  const clearMajorFilter = () => {
    setPage(1);
    setActiveMajor("");
    setMajorQuery("");
  };

  const runCategoryCleanup = async () => {
    setCleanupBusy(true);
    try {
      const preview = await scholarshipAPI.normalizeCategories(true);
      if (!preview?.changed) {
        showAlert("Categories", `All ${preview?.total ?? 0} listings already use the clean categories.`, "success");
      } else {
        setCleanupPreview(preview);
      }
    } catch (error) {
      showAlert(t("common.error"), "Could not reach the category cleanup. Deploy the updated backend first.", "error");
    } finally {
      setCleanupBusy(false);
    }
  };

  const applyCategoryCleanup = async () => {
    setCleanupPreview(null);
    setCleanupBusy(true);
    try {
      const result = await scholarshipAPI.normalizeCategories(false);
      await load();
      showAlert("Categories", `Updated ${result?.modified ?? 0} of ${result?.total ?? 0} listings.`, "success");
    } catch (error) {
      showAlert(t("common.error"), error?.message || "Category cleanup failed.", "error");
    } finally {
      setCleanupBusy(false);
    }
  };

  const runImport = async (source) => {
    const limit = Math.max(1, Math.min(500, parseInt(importLimit, 10) || 50));
    const country = importCountry.trim();
    if (source === "hipo" && !country) {
      showAlert(t("common.error"), "Enter a country to import universities from.", "error");
      return;
    }
    setImportBusy(true);
    try {
      const preview = await scholarshipAPI.importExternal({ source, country, limit, dryRun: true });
      if (!preview?.new) {
        showAlert("Import", `Nothing new to add (${preview?.fetched ?? 0} found, ${preview?.duplicates ?? 0} already in the app).`, "info");
      } else {
        setImportPreview({ source, country, limit, ...preview });
      }
    } catch (error) {
      showAlert(t("common.error"), error?.message || "Import failed. Deploy the updated backend first.", "error");
    } finally {
      setImportBusy(false);
    }
  };

  const applyImport = async () => {
    const pending = importPreview;
    setImportPreview(null);
    if (!pending) return;
    setImportBusy(true);
    try {
      const result = await scholarshipAPI.importExternal({ source: pending.source, country: pending.country, limit: pending.limit, dryRun: false });
      setPage(1);
      await load();
      showAlert("Import", `Added ${result?.inserted ?? 0} ${pending.source === "hipo" ? "universities" : "jobs"}.`, "success");
    } catch (error) {
      showAlert(t("common.error"), error?.message || "Import failed.", "error");
    } finally {
      setImportBusy(false);
    }
  };

  const toggleSort = (nextAscending) => {
    setPage(1);
    setAscending(nextAscending);
  };

  const clearAllFilters = () => {
    setPage(1);
    setActiveMajor("");
    setMajorQuery("");
    setImageFilter("all");
    setDetailsFilter("all");
    setContactFilter("all");
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelected = (id) => {
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCardPress = (item) => {
    if (selectMode) toggleSelected(item.id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      await scholarshipAPI.deleteScholarship(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (error) {
      console.error("Error deleting scholarship:", error);
      showAlert(t("common.error"), error?.message || t("admin.deleteScholarshipFailed"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleConfirmBulkDelete = async () => {
    if (bulkDeleting || selectedIds.size === 0) return;
    setBulkDeleting(true);
    setConfirmBulkDelete(false);
    try {
      const results = await Promise.allSettled(
        [...selectedIds].map((id) => scholarshipAPI.deleteScholarship(id)),
      );
      const failed = results.some((result) => result.status === "rejected");
      exitSelectMode();
      await load();
      if (failed) {
        showAlert(t("common.error"), t("admin.bulkDeleteFailed"), "error");
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const openEditor = (item = null) => {
    if (item) item = normalizeListing(item);
    setEditingItem(item);
    setForm(item ? {
      ...EMPTY_FORM,
      ...item,
      languageTestsText: (item.languageTests || []).join(", "),
      imagesText: (item.images || []).join(", "),
      departmentHeadName: item.departmentHead?.name || "",
      departmentHeadPosition: item.departmentHead?.position || "",
      departmentHeadEmail: item.departmentHead?.email || "",
      departmentHeadResearch: item.departmentHead?.research || "",
      departmentHeadOffice: item.departmentHead?.office || "",
      professorName: item.contactProfessors?.[0]?.name || "",
      professorPosition: item.contactProfessors?.[0]?.position || "",
      professorEmail: item.contactProfessors?.[0]?.email || "",
      professorResearch: item.contactProfessors?.[0]?.research || "",
      professorOffice: item.contactProfessors?.[0]?.office || "",
    } : { ...EMPTY_FORM, listingKind, level: listingKind === "company" ? "Mid-level" : "Masters" });
    setEditorVisible(true);
  };

  const saveScholarship = async () => {
    const required = ["title", "country", "university", "subcategory", "funding", "type", "level"];
    if (required.some((key) => !String(form[key] || "").trim())) {
      showAlert(t("common.error"), t("admin.requiredScholarshipFields"), "warning");
      return;
    }

    setSaving(true);
    try {
      const splitList = (value) => String(value || "").split(",").map((part) => part.trim()).filter(Boolean);
      const payload = {
        ...(editingItem || {}),
        ...form,
        major: form.subcategory,
        languageTests: splitList(form.languageTestsText),
        images: splitList(form.imagesText),
        departmentHead: {
          name: form.departmentHeadName,
          position: form.departmentHeadPosition,
          email: form.departmentHeadEmail,
          research: form.departmentHeadResearch,
          office: form.departmentHeadOffice,
        },
        contactProfessors: form.professorName || form.professorEmail ? [{
          name: form.professorName,
          position: form.professorPosition,
          email: form.professorEmail,
          research: form.professorResearch,
          office: form.professorOffice,
        }] : [],
      };
      Object.keys(EMPTY_FORM).filter((key) => key.endsWith("Text") || key.startsWith("departmentHead") || key.startsWith("professor")).forEach((key) => delete payload[key]);
      delete payload.id;
      if (editingItem) {
        await scholarshipAPI.updateScholarship(editingItem.id, payload);
      } else {
        await scholarshipAPI.createScholarship(payload);
        setPage(1);
      }
      setEditorVisible(false);
      await load();
    } catch (error) {
      console.error("Error saving scholarship:", error);
      showAlert(t("common.error"), error?.message || t("admin.saveScholarshipFailed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const runLookup = async () => {
    if (!lookupQuery.trim()) return;
    setLookupLoading(true);
    try {
      const results = lookupType === "university"
        ? await adminExternalAPI.searchUniversities(lookupQuery.trim())
        : await adminExternalAPI.searchRemoteJobs({ query: lookupQuery.trim(), category: remoteCategory });
      setLookupResults(Array.isArray(results) ? results : []);
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("admin.lookupFailed"), "error");
      setLookupResults([]);
    } finally {
      setLookupLoading(false);
    }
  };

  const selectUniversity = (university) => {
    setLookupVisible(false);
    openEditor();
    setForm((previous) => ({
      ...previous,
      university: university.name || "",
      country: university.country || "",
      universityWebsite: university.web_pages?.[0] || "",
    }));
  };

  const importRemoteJob = async (job) => {
    setImportingId(String(job.id));
    try {
      const body = {
        title: job.title || "",
        country: job.candidate_required_location || "Remote",
        university: job.company_name || "",
        major: "",
        listingKind: "company",
        funding: REMOTE_JOB_TYPE_LABELS[job.job_type] || "Full-time",
        type: "Remote",
        level: "Mid-level",
        languageTests: [],
        images: job.company_logo ? [job.company_logo] : [],
        courseValue: job.salary || "",
        universityDetails: job.description || "",
        qualifications: Array.isArray(job.tags) ? job.tags.join(", ") : "",
        universityWebsite: job.url || "",
        departmentHead: { name: "", position: "", email: "", research: "", office: "" },
        contactProfessors: [],
      };
      await scholarshipAPI.createScholarship(normalizeListing(body));
      setLookupResults((previous) => previous.filter((item) => String(item.id) !== String(job.id)));
      setPage(1);
      await load();
      showAlert(t("common.success"), t("admin.remoteJobImported"), "success");
    } catch (error) {
      showAlert(t("common.error"), error?.message || t("admin.remoteJobImportFailed"), "error");
    } finally {
      setImportingId(null);
    }
  };

  // Text search and major are applied server-side (see load()) so paging
  // stays cheap regardless of collection size. These three "quality" filters
  // stay client-side and scoped to the current page only — good enough for
  // spot-checking data quality without pulling every row to filter globally.
  const filtered = useMemo(() => items.filter((item) => {
    const hasImages = (item.images || []).some((imageUrl) => imageUrl && !failedImageUrls[imageUrl]);
    const hasContactEmail = hasScholarshipContactEmail(item);
    const hasDetails = hasScholarshipDetails(item);

    return (imageFilter === "all" || (imageFilter === "missing" ? !hasImages : hasImages))
      && (detailsFilter === "all" || (detailsFilter === "missing" ? !hasDetails : hasDetails))
      && (contactFilter === "all" || (contactFilter === "missing" ? !hasContactEmail : hasContactEmail));
  }), [items, failedImageUrls, imageFilter, detailsFilter, contactFilter]);

  const hasActiveFilters = !!activeMajor || imageFilter !== "all" || detailsFilter !== "all" || contactFilter !== "all";

  const renderCard = useCallback(({ item }) => {
    const previewImage = item.images?.find((imageUrl) => imageUrl && !failedImageUrls[imageUrl]);
    const missingImages = !previewImage;
    const missingDetails = !hasScholarshipDetails(item);
    const missingContact = !hasScholarshipContactEmail(item);
    const selected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        activeOpacity={selectMode ? 0.7 : 1}
        onPress={() => handleCardPress(item)}
        style={[
          styles.card,
          { backgroundColor: colors.surface },
          selected && { borderColor: colors.accent, borderWidth: 2 },
        ]}
      >
        <View style={styles.cardTopRow}>
          {selectMode && (
            <View style={[styles.checkbox, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : "transparent" }]}>
              {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
          )}
          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              style={styles.imagePreview}
              contentFit="cover"
              onError={() => setFailedImageUrls((previous) => ({ ...previous, [previewImage]: true }))}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="school-outline" size={20} color={colors.textMuted} />
            </View>
          )}
          <View style={styles.cardTitleWrap}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
              {item.university} · {item.country}
            </Text>
          </View>
        </View>

        <View style={styles.tagsWrap}>
          {!!item.funding && <Pill label={item.funding} color="#fff" backgroundColor={colors.accent} />}
          {!!item.major && <Pill label={item.major} color={colors.warning} backgroundColor={colors.warningLight} />}
          {missingImages && <Pill label={t("admin.noImages")} color={colors.danger} backgroundColor={colors.dangerLight} />}
          {missingDetails && <Pill label={t("admin.noDetails")} color={colors.warning} backgroundColor={colors.warningLight} />}
          {missingContact && <Pill label={t("admin.noContactEmails")} color={colors.danger} backgroundColor={colors.dangerLight} />}
        </View>

        {!!item.universityDetails && (
          <Text style={[styles.itemDetails, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.universityDetails}
          </Text>
        )}

        {!selectMode && (
          <View style={styles.cardActions}>
            <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 0, right: 0 }} style={[styles.actionButton, { backgroundColor: colors.accentLight }]} onPress={() => openEditor(item)}>
              <Ionicons name="create-outline" size={15} color={colors.accent} />
              <Text style={[styles.actionText, { color: colors.accent }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
                {t("common.edit")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 0, right: 0 }} style={[styles.actionButton, { backgroundColor: colors.dangerLight }]} onPress={() => setDeleteTarget(item)}>
              <Ionicons name="trash-outline" size={15} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
                {t("common.delete")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors, failedImageUrls, selectMode, selectedIds, t]);

  if (!user?.isAdmin) {
    return (
      <SafeAreaView style={[styles.container, styles.accessDenied, { backgroundColor: colors.screenBackground }]}>
        <ScreenHeader onBack={() => router.back()} showLogo={false} title={t("admin.scholarships")} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("admin.accessDenied")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader onBack={() => router.back()} showLogo={false} title={t("admin.scholarships")} />

      <View style={styles.kindTabsRow}>
        {LISTING_KIND_TABS.map((tabItem) => {
          const active = listingKind === tabItem.key;
          return (
            <TouchableOpacity hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              key={tabItem.key}
              style={[
                styles.kindTab,
                { borderColor: colors.border },
                active && { backgroundColor: colors.accent, borderColor: colors.accent },
              ]}
              onPress={() => switchListingKind(tabItem.key)}
            >
              <Text
                style={[styles.kindTabText, { color: active ? "#fff" : colors.textSecondary }]}
                maxFontSizeMultiplier={COMPACT_FONT_SCALE}
              >
                {t(tabItem.labelKey)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.headerActionsRow}>
        <View style={[styles.searchWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t("explore.searchUniversities")}
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={applySearch}
            maxFontSizeMultiplier={COMPACT_FONT_SCALE}
          />
          {!!search && (
            <TouchableOpacity onPress={() => { setSearch(""); setPage(1); setAppliedSearch(""); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity hitSlop={{ top: 1, bottom: 1, left: 1, right: 1 }}
          style={[styles.iconActionBtn, { backgroundColor: colors.surface, borderColor: hasActiveFilters ? colors.accent : colors.border }]}
          onPress={() => setFilterSheetVisible(true)}
          accessibilityLabel={t("admin.filters")}
        >
          <Ionicons name="options-outline" size={19} color={hasActiveFilters ? colors.accent : colors.textSecondary} />
          {hasActiveFilters && <View style={[styles.filterDot, { backgroundColor: colors.accent, borderColor: colors.surface }]} />}
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 1, bottom: 1, left: 1, right: 1 }}
          style={[styles.iconActionBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => { setLookupType("university"); setLookupQuery(""); setRemoteCategory(""); setLookupResults([]); setLookupVisible(true); }}
          accessibilityLabel={t("admin.externalLookup")}
        >
          <Ionicons name="globe-outline" size={19} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 1, bottom: 1, left: 1, right: 1 }}
          style={[styles.iconActionBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
          onPress={() => openEditor()}
          accessibilityLabel={t("admin.addScholarship")}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <Text style={[styles.countText, { color: colors.textSecondary }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
          {totalCount} {t("admin.listingsCount")}
        </Text>
        <TouchableOpacity onPress={() => (selectMode ? exitSelectMode() : setSelectMode(true))}>
          <Text style={[styles.selectToggleText, { color: colors.accent }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
            {selectMode ? t("common.cancel") : t("admin.select")}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <LoaderModal />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderCard}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={7}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="file-tray-outline" size={40} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t("admin.noScholarships")}</Text>
            </View>
          }
        />
      )}

      {selectedIds.size > 0 ? (
        <View style={[styles.stickyPagination, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
          <Text style={[styles.pageText, { color: colors.textSecondary }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
            {t("admin.selectedCount", { count: selectedIds.size })}
          </Text>
          <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 6, right: 6 }}
            style={[styles.bulkDeleteBtn, { backgroundColor: colors.danger }]}
            onPress={() => setConfirmBulkDelete(true)}
            disabled={bulkDeleting}
          >
            {bulkDeleting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.addButtonText} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>{t("common.delete")}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : pageCount > 1 ? (
        <View style={[styles.stickyPagination, { backgroundColor: colors.surface, borderTopColor: colors.divider }]}>
          <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={[styles.pageButton, { borderColor: colors.border }, page <= 1 && styles.pageButtonDisabled]}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page <= 1}
            accessibilityLabel={t("common.back")}
          >
            <Ionicons name="chevron-back" size={18} color={page <= 1 ? colors.textMuted : colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.pageText, { color: colors.textSecondary }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
            {t("admin.pageOf", { page, pages: Math.max(pageCount, 1), total: totalCount })}
          </Text>
          <TouchableOpacity hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            style={[styles.pageButton, { borderColor: colors.border }, page >= pageCount && styles.pageButtonDisabled]}
            onPress={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page >= pageCount}
            accessibilityLabel={t("common.next")}
          >
            <Ionicons name="chevron-forward" size={18} color={page >= pageCount ? colors.textMuted : colors.accent} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Filters bottom sheet — major/sort/quality, kept off the main list so
          the list itself isn't permanently crowded by rows of controls. */}
      <Modal visible={filterSheetVisible} transparent animationType="slide" onRequestClose={() => setFilterSheetVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setFilterSheetVisible(false)} />
          <View style={[styles.filterSheet, { backgroundColor: colors.surfaceAlt }]}>
            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
            <View style={styles.filterSheetHeader}>
              <Text style={[styles.editorTitle, { color: colors.textPrimary }]}>{t("admin.filters")}</Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={[styles.clearAllText, { color: colors.accent }]}>{t("admin.clearAllFilters")}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.filterSheetContent} keyboardShouldPersistTaps="handled">
              {getCategories(listingKind).map((group, groupIndex) => (
                <View key={group.name}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary, marginTop: groupIndex === 0 ? 0 : 14 }]}>{group.name}</Text>
                  <View style={styles.chipRow}>
                    {group.subcategories.map((sub) => {
                      const selected = activeMajor === sub;
                      return (
                        <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
                          key={sub}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                          ]}
                          onPress={() => {
                            setPage(1);
                            setActiveMajor(selected ? "" : sub);
                          }}
                        >
                          <Text
                            style={[styles.chipText, { color: selected ? "#fff" : colors.textSecondary }]}
                            maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                          >
                            {sub}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <TouchableOpacity
                style={[styles.chip, { alignSelf: "flex-start", marginTop: 18, backgroundColor: colors.surface, borderColor: colors.border, opacity: cleanupBusy ? 0.6 : 1 }]}
                onPress={runCategoryCleanup}
                disabled={cleanupBusy}
              >
                <Text style={[styles.chipText, { color: colors.accent }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
                  {cleanupBusy ? "Checking..." : "Tidy up categories"}
                </Text>
              </TouchableOpacity>

              <Text style={[styles.filterGroupLabel, { color: colors.textSecondary, marginTop: 18 }]}>Import from the web</Text>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <TextInput
                  style={[styles.chip, { flex: 1, color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={importCountry}
                  onChangeText={setImportCountry}
                  placeholder="Country (universities)"
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={[styles.chip, { width: 72, textAlign: "center", color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.border }]}
                  value={importLimit}
                  onChangeText={(value) => setImportLimit(value.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  placeholder="Max"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
              <View style={styles.chipRow}>
                {[{ key: "hipo", label: "Add universities" }, { key: "arbeitnow", label: "Add jobs" }].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border, opacity: importBusy ? 0.6 : 1 }]}
                    onPress={() => runImport(option.key)}
                    disabled={importBusy}
                  >
                    <Text style={[styles.chipText, { color: colors.accent }]} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>
                      {importBusy ? "Checking..." : option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.filterGroupLabel, { color: colors.textSecondary, marginTop: 18 }]}>{t("admin.sortBy")}</Text>
              <View style={styles.chipRow}>
                {[{ key: false, label: t("admin.sortNewest") }, { key: true, label: t("admin.sortOldest") }].map((option) => (
                  <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
                    key={String(option.key)}
                    style={[
                      styles.chip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      ascending === option.key && { backgroundColor: colors.accent, borderColor: colors.accent },
                    ]}
                    onPress={() => toggleSort(option.key)}
                  >
                    <Text
                      style={[styles.chipText, { color: ascending === option.key ? "#fff" : colors.textSecondary }]}
                      maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {[
                { label: t("admin.imagesFilter"), value: imageFilter, setValue: setImageFilter },
                { label: t("admin.detailsFilter"), value: detailsFilter, setValue: setDetailsFilter },
                { label: t("admin.contactFilter"), value: contactFilter, setValue: setContactFilter },
              ].map((group) => (
                <View key={group.label}>
                  <Text style={[styles.filterGroupLabel, { color: colors.textSecondary, marginTop: 18 }]}>{group.label}</Text>
                  <View style={styles.chipRow}>
                    {QUALITY_OPTIONS.map((option) => {
                      const labelKey = option === "all" ? "admin.filterAll" : option === "missing" ? "admin.filterMissing" : "admin.filterPresent";
                      const selected = group.value === option;
                      return (
                        <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
                          key={option}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                          ]}
                          onPress={() => group.setValue(option)}
                        >
                          <Text
                            style={[styles.chipText, { color: selected ? "#fff" : colors.textSecondary }]}
                            maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                          >
                            {t(labelKey)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={[styles.filterSheetFooter, { borderTopColor: colors.divider }]}>
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={() => setFilterSheetVisible(false)}>
                <Text style={styles.addButtonText} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>{t("common.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={[styles.editorSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, { color: colors.textPrimary }]}>
                {t(editingItem ? "admin.editScholarship" : "admin.addScholarship")}
              </Text>
              <TouchableOpacity onPress={() => setEditorVisible(false)} accessibilityLabel={t("common.close")}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
              <View style={styles.formField}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{t("admin.listingKind")}</Text>
                <View style={styles.chipRow}>
                  {LISTING_KIND_TABS.map((tabItem) => {
                    const selected = form.listingKind === tabItem.key;
                    return (
                      <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
                        key={tabItem.key}
                        style={[
                          styles.chip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                        ]}
                        onPress={() => setForm((previous) => previous.listingKind === tabItem.key ? previous : ({ ...previous, listingKind: tabItem.key, category: "", subcategory: "", level: tabItem.key === "company" ? "Mid-level" : "Masters" }))}
                      >
                        <Text
                          style={[styles.chipText, { color: selected ? "#fff" : colors.textSecondary }]}
                          maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                        >
                          {t(tabItem.key === "university" ? "admin.kindUniversity" : "admin.kindCompany")}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              {[
                { label: "Category", options: getGroupNames(form.listingKind), value: form.category, onSelect: (value) => setForm((previous) => ({ ...previous, category: value, subcategory: "" })) },
                ...(form.category
                  ? [{ label: form.listingKind === "company" ? "Role" : "Subject", options: getSubcategories(form.listingKind, form.category), value: form.subcategory, onSelect: (value) => setForm((previous) => ({ ...previous, subcategory: value })) }]
                  : []),
                ...(form.listingKind === "university"
                  ? [{ label: t("admin.fieldLevel"), options: STUDY_LEVELS, value: form.level, onSelect: (value) => setForm((previous) => ({ ...previous, level: value })) }]
                  : []),
              ].map((picker) => (
                <View key={picker.label} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{picker.label}</Text>
                  <View style={styles.chipRow}>
                    {picker.options.map((option) => {
                      const selected = picker.value === option;
                      return (
                        <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 6, right: 6 }}
                          key={option}
                          style={[
                            styles.chip,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                            selected && { backgroundColor: colors.accent, borderColor: colors.accent },
                          ]}
                          onPress={() => picker.onSelect(option)}
                        >
                          <Text
                            style={[styles.chipText, { color: selected ? "#fff" : colors.textSecondary }]}
                            maxFontSizeMultiplier={COMPACT_FONT_SCALE}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              {[
                ["title", t("admin.fieldTitle")],
                ["university", t("admin.fieldUniversity")],
                ["country", t("admin.fieldCountry")],
                ["funding", t("admin.fieldFunding")],
                ["type", t("admin.fieldType")],
                ...(form.listingKind === "company" ? [["level", t("admin.fieldLevel")]] : []),
                ["courseValue", t("admin.fieldCourseValue")],
                ["universityWebsite", t("admin.fieldWebsite")],
                ["universityDetails", t("admin.fieldDetails")],
                ["qualifications", t("admin.fieldQualifications")],
                ["languageTestsText", t("admin.fieldLanguageTests")],
                ["imagesText", t("admin.fieldImages")],
                ["departmentHeadName", t("admin.fieldDepartmentHead")],
                ["departmentHeadPosition", t("admin.fieldDepartmentHeadPosition")],
                ["departmentHeadEmail", t("admin.fieldDepartmentHeadEmail")],
                ["departmentHeadResearch", t("admin.fieldDepartmentHeadResearch")],
                ["departmentHeadOffice", t("admin.fieldDepartmentHeadOffice")],
                ["professorName", t("admin.fieldProfessor")],
                ["professorPosition", t("admin.fieldProfessorPosition")],
                ["professorEmail", t("admin.fieldProfessorEmail")],
                ["professorResearch", t("admin.fieldProfessorResearch")],
                ["professorOffice", t("admin.fieldProfessorOffice")],
              ].map(([key, label]) => (
                <View key={key} style={styles.formField}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>{label}</Text>
                  <TextInput
                    value={String(form[key] || "")}
                    onChangeText={(value) => setForm((previous) => ({ ...previous, [key]: value }))}
                    placeholder={label}
                    placeholderTextColor={colors.textMuted}
                    multiline={["universityDetails", "qualifications"].includes(key)}
                    style={[styles.formInput, { borderColor: colors.border, color: colors.textPrimary }]}
                  />
                </View>
              ))}
              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.accent }]} onPress={saveScholarship} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={18} color="#fff" />}
                <Text style={styles.addButtonText} maxFontSizeMultiplier={COMPACT_FONT_SCALE}>{saving ? t("common.sending") : t("common.save")}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={lookupVisible} transparent animationType="slide" onRequestClose={() => setLookupVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior="padding">
          <View style={[styles.editorSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.editorHeader}>
              <Text style={[styles.editorTitle, { color: colors.textPrimary }]}>{t("admin.externalLookup")}</Text>
              <TouchableOpacity onPress={() => setLookupVisible(false)} accessibilityLabel={t("common.close")}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.lookupTabs}>
              {[
                { key: "university", label: t("admin.universities") },
                { key: "jobs", label: t("admin.remoteJobs") },
              ].map((option) => (
                <TouchableOpacity hitSlop={{ top: 7, bottom: 7, left: 6, right: 6 }}
                  key={option.key}
                  style={[styles.lookupTab, { borderColor: colors.border }, lookupType === option.key && { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => { setLookupType(option.key); setRemoteCategory(""); setLookupResults([]); }}
                >
                  <Text style={[styles.lookupTabText, { color: lookupType === option.key ? "#fff" : colors.textSecondary }]}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.lookupSearchRow, { borderColor: colors.border }]}>
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                value={lookupQuery}
                onChangeText={setLookupQuery}
                placeholder={t("admin.lookupPlaceholder")}
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={runLookup}
              />
              <TouchableOpacity onPress={runLookup} disabled={lookupLoading} accessibilityLabel={t("admin.search")}>
                {lookupLoading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="search" size={19} color={colors.accent} />}
              </TouchableOpacity>
            </View>
            {lookupType === "jobs" && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryOptions}>
                {REMOTE_JOB_CATEGORIES.map((option) => {
                  const selected = remoteCategory === option.value;
                  return (
                    <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                      key={option.value || "all"}
                      style={[styles.categoryOption, { borderColor: selected ? colors.accent : colors.border, backgroundColor: selected ? colors.accent : "transparent" }]}
                      onPress={() => setRemoteCategory(option.value)}
                    >
                      <Text style={[styles.categoryOptionText, { color: selected ? "#fff" : colors.textSecondary }]}>{option.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <ScrollView contentContainerStyle={styles.lookupResults} keyboardShouldPersistTaps="handled">
              {lookupType === "university" ? lookupResults.map((university, index) => (
                <TouchableOpacity key={`${university.name}-${university.country}-${index}`} style={[styles.lookupResult, { borderBottomColor: colors.divider }]} onPress={() => selectUniversity(university)}>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={2}>{university.name}</Text>
                    <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={1}>{university.country}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={20} color={colors.accent} />
                </TouchableOpacity>
              )) : lookupResults.map((job) => (
                <View key={String(job.id)} style={[styles.lookupResult, styles.jobResult, { borderBottomColor: colors.divider }]}>
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: colors.textPrimary }]} numberOfLines={2}>{job.title}</Text>
                    <Text style={[styles.rowValue, { color: colors.textMuted }]} numberOfLines={1}>{job.company_name} · {job.candidate_required_location}</Text>
                  </View>
                  <TouchableOpacity hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }} style={[styles.importButton, { backgroundColor: colors.accent }]} onPress={() => importRemoteJob(job)} disabled={importingId === String(job.id)}>
                    {importingId === String(job.id) ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="download-outline" size={16} color="#fff" />}
                  </TouchableOpacity>
                </View>
              ))}
              {!lookupLoading && lookupQuery && lookupResults.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t("admin.noLookupResults")}</Text>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <AlertModal
        visible={!!deleteTarget}
        title={t("admin.deleteScholarshipTitle")}
        message={t("admin.deleteScholarshipMessage")}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setDeleteTarget(null), secondary: true },
          { text: t("common.delete"), onPress: handleConfirmDelete, destructive: true },
        ]}
        onClose={() => setDeleteTarget(null)}
      />
      <AlertModal
        visible={confirmBulkDelete}
        title={t("admin.bulkDeleteTitle", { count: selectedIds.size })}
        message={t("admin.bulkDeleteMessage")}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setConfirmBulkDelete(false), secondary: true },
          { text: t("common.delete"), onPress: handleConfirmBulkDelete, destructive: true },
        ]}
        onClose={() => setConfirmBulkDelete(false)}
      />
      <AlertModal
        visible={!!importPreview}
        title="Import from the web"
        message={importPreview ? `${importPreview.new} new ${importPreview.source === "hipo" ? "universities" : "jobs"} will be added (${importPreview.duplicates} already in the app were skipped). e.g. ${importPreview.sample.slice(0, 3).map((item) => item.university).join(", ")}. Add them now?` : ""}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setImportPreview(null), secondary: true },
          { text: t("common.ok"), onPress: applyImport },
        ]}
        onClose={() => setImportPreview(null)}
      />
      <AlertModal
        visible={!!cleanupPreview}
        title="Tidy up categories"
        message={cleanupPreview ? `${cleanupPreview.changed} of ${cleanupPreview.total} listings will be moved to the clean categories (and blank levels set to Masters). Apply now?` : ""}
        type="warning"
        actions={[
          { text: t("common.cancel"), onPress: () => setCleanupPreview(null), secondary: true },
          { text: t("common.ok"), onPress: applyCategoryCleanup },
        ]}
        onClose={() => setCleanupPreview(null)}
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
  container: { flex: 1 },
  accessDenied: { justifyContent: "flex-start" },
  kindTabsRow: { flexDirection: "row", gap: 8, marginHorizontal: 14, marginTop: 10 },
  kindTab: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  kindTabText: { fontSize: 12.5, fontWeight: "700", fontFamily: "Roboto" },
  headerActionsRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginTop: 10, marginBottom: 10 },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: "Roboto",
    padding: 0,
  },
  iconActionBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  filterDot: { position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  toolbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginHorizontal: 14, marginBottom: 12, gap: 10 },
  countText: { fontSize: 12.5, fontWeight: "700" },
  selectToggleText: { fontSize: 12.5, fontWeight: "700" },
  addButtonText: { color: "#fff", fontSize: 13, fontWeight: "800" },
  scrollContent: {
    paddingHorizontal: 14,
    paddingBottom: 20,
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
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: "center", justifyContent: "center", marginTop: 2 },
  imagePreview: { width: 46, height: 46, borderRadius: 10, backgroundColor: "#e2e8f0" },
  imagePlaceholder: { width: 46, height: 46, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTitleWrap: { flex: 1, minWidth: 0 },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Roboto",
    lineHeight: 18,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 3,
  },
  itemDetails: { fontSize: 12, lineHeight: 17, marginTop: 8 },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionButton: { minHeight: 34, borderRadius: 9, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5 },
  actionText: { fontSize: 12.5, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.48)", justifyContent: "flex-end" },
  editorSheet: { maxHeight: "92%", borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingTop: 18 },
  editorHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingBottom: 12 },
  editorTitle: { fontSize: 18, fontWeight: "800" },
  formContent: { paddingHorizontal: 18, paddingBottom: 30 },
  formField: { marginBottom: 12 },
  formLabel: { fontSize: 12, fontWeight: "700", marginBottom: 5 },
  formInput: { minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9, fontSize: 14 },
  saveButton: { minHeight: 46, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6, paddingVertical: 10, paddingHorizontal: 16 },
  lookupTabs: { flexDirection: "row", gap: 8, paddingHorizontal: 18, paddingBottom: 10 },
  lookupTab: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 7 },
  lookupTabText: { fontSize: 12, fontWeight: "700" },
  lookupSearchRow: { height: 42, marginHorizontal: 18, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  lookupResults: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 24 },
  categoryOptions: { gap: 7, paddingHorizontal: 18, paddingTop: 9 },
  categoryOption: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6 },
  categoryOptionText: { fontSize: 12, fontWeight: "700" },
  lookupResult: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, paddingVertical: 9 },
  jobResult: { alignItems: "center" },
  importButton: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: "700", fontFamily: "Roboto" },
  rowValue: { fontSize: 12, fontFamily: "Roboto", marginTop: 2 },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  pill: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: "hidden",
  },
  stickyPagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  pageButton: { width: 36, height: 36, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.45 },
  pageText: { fontSize: 12, fontWeight: "700", flexShrink: 1 },
  bulkDeleteBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  filterSheet: { maxHeight: "85%", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10, marginBottom: 6 },
  filterSheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 10 },
  clearAllText: { fontSize: 13, fontWeight: "700" },
  filterSheetContent: { paddingHorizontal: 18, paddingBottom: 20 },
  filterGroupLabel: { fontSize: 12.5, fontWeight: "700", marginBottom: 8 },
  majorRow: { flexDirection: "row", gap: 8 },
  majorInput: { flex: 1, height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13.5 },
  majorApplyBtn: { minHeight: 42, paddingHorizontal: 16, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  activeMajorPill: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  activeMajorText: { fontSize: 12.5, fontWeight: "700" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  chipText: { fontSize: 12.5, fontWeight: "700" },
  filterSheetFooter: { paddingHorizontal: 18, paddingTop: 12, borderTopWidth: 1 },
});
