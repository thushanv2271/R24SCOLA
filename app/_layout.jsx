import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { AuthProvider } from "../components/AuthContext";
import { LanguageProvider } from "../components/LanguageContext";
import { InterestProvider } from "../components/InterestContext";
import { ThemeProvider, useTheme } from "../components/ThemeContext";
import PushNotificationHandler from "../components/PushNotificationHandler";
import ToastNotification from "../components/ToastNotification";
import GuideOverlay from "../components/blocks/GuideOverlay";
import HootChat from "../components/blocks/HootChat";
import HootCustomize from "../components/blocks/HootCustomize";
import SwitchLoaderHost from "../components/ui/SwitchLoaderHost";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Split out so it can read ThemeContext — the provider has to be above this
// in the tree, so this can't just live inline in RootLayout itself. Also
// owns the <Stack> itself now: expo-router's Stack (a React Navigation
// native-stack under the hood) has its own default white "contentStyle"
// backdrop, shown during screen transitions and behind anything that
// doesn't fully cover the screen — that default was bleeding through as a
// stray white background independent of anything each individual screen
// does with its own theming, and this is what actually controls it.
function ThemedApp() {
  const { colors, scheme } = useTheme() || {};

  return (
    <View style={[{ flex: 1 }, colors && { backgroundColor: colors.screenBackground }]}>
      <Stack screenOptions={{ freezeOnBlur: true, contentStyle: colors && { backgroundColor: colors.screenBackground } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="Onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="RegisterForm" options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" options={{ headerShown: false }} />
        <Stack.Screen name="ScholarshipCalculator" options={{ headerShown: false }} />
        <Stack.Screen name="CreateCreatorListing" options={{ headerShown: false }} />
        <Stack.Screen name="MyCreatorListings" options={{ headerShown: false }} />
        <Stack.Screen name="AdminPanel" options={{ headerShown: false }} />
        <Stack.Screen name="AdminCreatorListings" options={{ headerShown: false }} />
        <Stack.Screen name="AdminScholarships" options={{ headerShown: false }} />
        <Stack.Screen name="PersonalDetails" options={{ headerShown: false }} />
        <Stack.Screen name="CustomMail" options={{ headerShown: false }} />
        <Stack.Screen name="PrivacyPolicy" options={{ headerShown: false }} />
        <Stack.Screen name="HowToApply" options={{ headerShown: false }} />
        <Stack.Screen name="Categories" options={{ headerShown: false }} />
        <Stack.Screen name="Wallet" options={{ headerShown: false }} />
        <Stack.Screen name="Community" options={{ headerShown: false }} />
        <Stack.Screen name="CreateCommunityPost" options={{ headerShown: false }} />
        <Stack.Screen name="CommunityPostDetail" options={{ headerShown: false }} />
        <Stack.Screen name="Chat" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <PushNotificationHandler />
      <ToastNotification />
      <GuideOverlay />
      <HootChat />
      <HootCustomize />
      <SwitchLoaderHost />
      <StatusBar style={colors?.statusBarStyle ?? (scheme === "dark" ? "light" : "dark")} />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <InterestProvider>
          <AuthProvider>
            <ThemedApp />
          </AuthProvider>
        </InterestProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
