import React, { useContext, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ScolaMenu from "../components/ScolaMenu";
import ScreenHeader from "../components/blocks/ScreenHeader";
import { LanguageContext } from "../components/LanguageContext";
import { useTheme } from "../components/ThemeContext";

export default function HowToApply() {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.screenBackground }]}>
      <ScreenHeader
        onBack={() => router.back()}
        showLogo={false}
        title={t("legal.howToApplyTitle")}
        onMenuPress={() => setMenuVisible(true)}
      />
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.intro, { color: colors.textSecondary }]}>{t("howTo.intro")}</Text>

        <Section icon="mail-outline" title={t("howTo.setupTitle")}>
          <NumberedStep number="1" text={<Rich text={t("howTo.setup1")} />} />
          <NumberedStep number="2" text={<Rich text={t("howTo.setup2")} />} />
          <TipText>{t("howTo.setupTip")}</TipText>
        </Section>

        <Section icon="school-outline" title={t("howTo.schTitle")}>
          <NumberedStep number="1" text={<Rich text={t("howTo.sch1")} />} />
          <NumberedStep number="2" text={<Rich text={t("howTo.sch2")} />} />
          <NumberedStep number="3" text={<Rich text={t("howTo.sch3")} />} />
          <NumberedStep number="4" text={<Rich text={t("howTo.sch4")} />} />
          <NumberedStep number="5" text={<Rich text={t("howTo.sch5")} />} />
          <TipText>{t("howTo.schTip")}</TipText>
        </Section>

        <Section icon="briefcase-outline" title={t("howTo.jobTitle")}>
          <NumberedStep number="1" text={<Rich text={t("howTo.job1")} />} />
          <NumberedStep number="2" text={<Rich text={t("howTo.job2")} />} />
          <NumberedStep number="3" text={<Rich text={t("howTo.job3")} />} />
          <NumberedStep number="4" text={<Rich text={t("howTo.job4")} />} />
          <NumberedStep number="5" text={<Rich text={t("howTo.job5")} />} />
        </Section>

        <Section icon="heart-outline" title={t("howTo.trackTitle")}>
          <BodyText>
            <Rich text={t("howTo.trackBody")} />
          </BodyText>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ icon, title, children }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function NumberedStep({ number, text }) {
  const { colors } = useTheme();
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepBadgeText}>{number}</Text>
      </View>
      <Text style={[styles.stepText, { color: colors.textPrimary }]}>{text}</Text>
    </View>
  );
}

function TipText({ children }) {
  const { colors } = useTheme();
  return <Text style={[styles.tip, { color: colors.textMuted }]}>{children}</Text>;
}

function BodyText({ children }) {
  const { colors } = useTheme();
  return <Text style={[styles.body, { color: colors.textSecondary }]}>{children}</Text>;
}

function Rich({ text }) {
  const { colors } = useTheme();
  return String(text)
    .split("**")
    .map((part, i) =>
      i % 2 === 1 ? (
        <Text key={i} style={[styles.boldText, { color: colors.textPrimary }]}>
          {part}
        </Text>
      ) : (
        part
      ),
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: "Roboto",
  },
  section: { marginBottom: 26 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
    fontFamily: "Roboto",
  },
  body: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    fontFamily: "Roboto",
  },
  boldText: {
    fontWeight: "700",
    color: "#111827",
  },
  stepRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#004aad",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    marginTop: 1,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
    lineHeight: 21,
    fontFamily: "Roboto",
  },
  tip: {
    fontSize: 13,
    color: "#94a3b8",
    lineHeight: 19,
    fontStyle: "italic",
    marginTop: 4,
    fontFamily: "Roboto",
  },
});
