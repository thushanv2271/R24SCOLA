import React, { useContext, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";

const SUPPORT_EMAIL = "support@scola.app";

export default function PrivacyPolicy() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={t("legal.privacyPolicyTitle")}
        onMenuPress={() => setMenuVisible(true)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.textMuted }]}>{t("privacy.lastUpdated")}</Text>

        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t("privacy.intro")}</Text>

        <Section title={t("privacy.s1Title")}>
          <BulletItem text={t("privacy.s1b1")} />
          <BulletItem text={t("privacy.s1b2")} />
          <BulletItem text={t("privacy.s1b3")} />
          <BulletItem text={t("privacy.s1b4")} />
        </Section>

        <Section title={t("privacy.s2Title")}>
          <BulletItem text={t("privacy.s2b1")} />
          <BulletItem text={t("privacy.s2b2")} />
          <BulletItem text={t("privacy.s2b3")} />
          <BulletItem text={t("privacy.s2b4")} />
        </Section>

        <Section title={t("privacy.s3Title")}>
          <BodyText>{t("privacy.s3Body")}</BodyText>
        </Section>

        <Section title={t("privacy.s4Title")}>
          <BodyText>{t("privacy.s4Body")}</BodyText>
        </Section>

        <Section title={t("privacy.s5Title")}>
          <BulletItem text={t("privacy.s5b1")} />
          <BulletItem text={t("privacy.s5b2")} />
          <BulletItem text={t("privacy.s5b3")} />
        </Section>

        <Section title={t("privacy.s6Title")}>
          <BodyText>{t("privacy.s6Body")}</BodyText>
        </Section>

        <Section title={t("privacy.s7Title")}>
          <BodyText>
            {t("privacy.s7Body")}
            {"\n"}
            {SUPPORT_EMAIL}
          </BodyText>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

function BodyText({ children }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.textSecondary }]}>{children}</Text>;
}

function BulletItem({ text }) {
  const { colors } = useTheme();
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bullet, { color: colors.textSecondary }]}>•</Text>
      <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  lastUpdated: {
    fontSize: 12,
    color: "#94a3b8",
    marginBottom: 12,
    fontFamily: "Roboto",
  },
  intro: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: "Roboto",
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    fontFamily: "Roboto",
  },
  body: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    fontFamily: "Roboto",
  },
  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bullet: { fontSize: 14, color: "#666", marginRight: 8, marginTop: 1 },
  bulletText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    flex: 1,
    fontFamily: "Roboto",
  },
});
