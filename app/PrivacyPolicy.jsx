import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import ScolaMenu from "../components/ScolaMenu";

const { width } = Dimensions.get("window");

export default function PrivacyPolicy() {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.backBtn}
        >
          <Ionicons name="menu" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      <ScolaMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last updated: June 2026</Text>

        <Text style={styles.intro}>
          Scola ("we", "our", or "us") is committed to protecting your privacy.
          This policy explains what information we collect, how we use it, and
          your rights regarding your data.
        </Text>

        <Section title="1. Information We Collect">
          <BulletItem text="Account information: username and password (password is never stored on your device)" />
          <BulletItem text="Profile data: name, email address, and academic details you provide" />
          <BulletItem text="Usage data: scholarships and jobs you save to favourites" />
          <BulletItem text="Session tokens: stored locally to keep you logged in" />
        </Section>

        <Section title="2. How We Use Your Information">
          <BulletItem text="To provide and personalise the Scola service" />
          <BulletItem text="To save your favourite scholarships and jobs" />
          <BulletItem text="To send scholarship notification emails (only if you opt in)" />
          <BulletItem text="To improve app performance and fix issues" />
        </Section>

        <Section title="3. Data Storage">
          <Text style={styles.body}>
            Your account data is stored securely on our servers. Session tokens
            and preferences are stored locally on your device using AsyncStorage
            and are cleared when you log out.
          </Text>
        </Section>

        <Section title="4. Data Sharing">
          <Text style={styles.body}>
            We do not sell, trade, or share your personal information with third
            parties, except as required by law.
          </Text>
        </Section>

        <Section title="5. Your Rights">
          <BulletItem text="Access or update your profile at any time from the Profile screen" />
          <BulletItem text="Delete your account by contacting us" />
          <BulletItem text="Opt out of email notifications via the Custom Mail settings" />
        </Section>

        <Section title="6. Children's Privacy">
          <Text style={styles.body}>
            Scola is intended for users aged 16 and above. We do not knowingly
            collect data from children under 16.
          </Text>
        </Section>

        <Section title="7. Contact Us">
          <Text style={styles.body}>
            If you have any questions about this policy, please contact us at:
            {"\n"}support@scola.app
          </Text>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletItem({ text }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: width * 0.045,
    fontWeight: "700",
    color: "#111827",
    fontFamily: "Roboto",
  },
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
