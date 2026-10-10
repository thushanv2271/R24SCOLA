import React, { useContext, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { LanguageContext } from "../components/LanguageContext";
import KeyboardSafe from "../components/blocks/KeyboardSafe";
import { useTheme } from "../components/ThemeContext";
import { creatorListingsAPI } from "../services/apiService";
import ScreenHeader from "../components/blocks/ScreenHeader";
import AlertModal from "../components/AlertModal";

export default function CreateCreatorListing() {
  const params = useLocalSearchParams();
  const isEditing = !!params.id;
  const type = params.type === "company" ? "company" : "university";
  const isCompany = type === "company";
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();

  const [name, setName] = useState(params.name || "");
  const [country, setCountry] = useState(params.country || "");
  const [description, setDescription] = useState(params.description || "");
  const [website, setWebsite] = useState(params.website || "");
  const [contactEmail, setContactEmail] = useState(params.contactEmail || "");
  const [submitting, setSubmitting] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: "", message: "", type: "info" });

  const showAlert = (title, message, type = "info") =>
    setAlertConfig({ visible: true, title, message, type });

  const handlePublish = async () => {
    if (submitting) return;
    if (!name.trim() || !country.trim() || !description.trim()) {
      setErrorText(t("creatorListing.requiredFields"));
      return;
    }
    setErrorText("");
    setSubmitting(true);
    const payload = {
      type,
      name: name.trim(),
      country: country.trim(),
      description: description.trim(),
      website: website.trim(),
      contactEmail: contactEmail.trim(),
    };
    try {
      if (isEditing) {
        await creatorListingsAPI.update(params.id, payload);
        showAlert(t("creatorListing.updatedTitle"), t("creatorListing.updatedMessage"), "success");
      } else {
        await creatorListingsAPI.create(payload);
        showAlert(t("creatorListing.publishedTitle"), t("creatorListing.publishedMessage"), "success");
      }
    } catch (error) {
      console.error("Error saving creator listing:", error);
      showAlert(
        t("common.error"),
        error?.message || t(isEditing ? "creatorListing.updateFailed" : "creatorListing.publishFailed"),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const fields = [
    {
      key: "name",
      label: isCompany ? t("creatorListing.companyName") : t("creatorListing.universityName"),
      value: name,
      onChangeText: setName,
      icon: isCompany ? "business-outline" : "school-outline",
    },
    {
      key: "country",
      label: t("creatorListing.country"),
      value: country,
      onChangeText: setCountry,
      icon: "earth-outline",
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={
          isEditing
            ? (isCompany ? t("creatorListing.editCompany") : t("creatorListing.editUniversity"))
            : (isCompany ? t("creatorListing.addCompany") : t("creatorListing.addUniversity"))
        }
      />
      <KeyboardSafe>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.iconWrap, { backgroundColor: colors.accentLight }]}>
            <Ionicons name={isCompany ? "business" : "school"} size={26} color={colors.accent} />
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("creatorListing.subtitle")}
          </Text>

          {fields.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{field.label}</Text>
              <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name={field.icon} size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.input, { color: colors.textPrimary }]}
                  value={field.value}
                  onChangeText={field.onChangeText}
                  placeholder={field.label}
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>
            </View>
          ))}

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t("creatorListing.description")}</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.textPrimary }]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("creatorListing.description")}
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t("creatorListing.website")}</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="link-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={website}
                onChangeText={setWebsite}
                placeholder="https://"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t("creatorListing.contactEmail")}</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
              <TextInput
                style={[styles.input, { color: colors.textPrimary }]}
                value={contactEmail}
                onChangeText={setContactEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {!!errorText && <Text style={[styles.errorText, { color: colors.danger }]}>{errorText}</Text>}

          <TouchableOpacity
            style={[styles.publishBtn, { backgroundColor: colors.accent }, submitting && styles.publishBtnDisabled]}
            onPress={handlePublish}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.publishBtnText}>
              {isEditing
                ? (submitting ? t("creatorListing.saving") : t("creatorListing.save"))
                : (submitting ? t("creatorListing.publishing") : t("creatorListing.publish"))}
            </Text>
            {!submitting && <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardSafe>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        actions={[
          {
            text: t("common.ok"),
            onPress: () => {
              setAlertConfig((prev) => ({ ...prev, visible: false }));
              if (alertConfig.type === "success") router.back();
            },
          },
        ]}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 19,
    fontFamily: "Roboto",
    marginTop: 12,
    marginBottom: 20,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    fontFamily: "Roboto",
    marginBottom: 7,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textAreaWrap: {
    alignItems: "flex-start",
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Roboto",
    padding: 0,
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    marginBottom: 12,
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 6,
  },
  publishBtnDisabled: {
    opacity: 0.6,
  },
  publishBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "Roboto",
  },
});
