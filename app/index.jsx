import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoaderModal from "../components/ui/LoaderModal";
import { AuthContext } from "../components/AuthContext";
import { useTheme } from "../components/ThemeContext";
import { LanguageContext } from "../components/LanguageContext";
import { useInterest } from "../components/InterestContext";
import { ONBOARDING_DONE_KEY } from "../constants/onboarding";

// Owns the "/" route so Expo Router never falls back to resolving it as
// (tabs)/index. Returning users with a stored session go straight to the
// tabs. Everyone else goes through the one-screen first-launch setup
// (language, what you're looking for, light/dark, notifications) until it has
// been finished or was already configured on this device, then to login.
export default function Index() {
  const { user, loading } = useContext(AuthContext);
  const { ready: languageReady, languageConfigured } = useContext(LanguageContext);
  const { interestReady, interestConfigured } = useInterest();
  const { colors, themeConfigured, loaded: themeLoaded } = useTheme();
  const [setupDone, setSetupDone] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    const resolve = async () => {
      let value = null;
      try {
        value = await AsyncStorage.getItem(ONBOARDING_DONE_KEY);
      } catch (_) {}
      if (!cancelled) setSetupDone(!!value);
    };
    resolve();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || setupDone === undefined || !languageReady || !interestReady || !themeLoaded) {
    return (
      <View style={[styles.container, { backgroundColor: colors.screenBackground }]}>
        <LoaderModal visible />
      </View>
    );
  }

  if (user) return <Redirect href="/(tabs)" />;
  // Devices that already chose all three before this setup existed skip it.
  const alreadyConfigured = languageConfigured && interestConfigured && themeConfigured;
  if (!setupDone && !alreadyConfigured) return <Redirect href="/Onboarding" />;
  return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
