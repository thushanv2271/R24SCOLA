import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { View } from "react-native";
import "react-native-reanimated";
import { AuthProvider } from "../components/AuthContext";
import ToastNotification from "../components/ToastNotification";
import { useColorScheme } from "@/hooks/useColorScheme";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const router = useRouter();

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the splash screen
      SplashScreen.hideAsync().then(() => {
        // Redirect to the login page after the splash screen is hidden
        router.replace("/Instructions");
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  return (
    <AuthProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="Instructions" options={{ headerShown: false }} />
          <Stack.Screen name="RegisterForm" options={{ headerShown: false }} />
          <Stack.Screen name="Scholarships" options={{ headerShown: false }} />
          <Stack.Screen name="Itjobs" options={{ headerShown: false }} />
          <Stack.Screen name="ScholarshipCalculator" options={{ headerShown: false }} />
          <Stack.Screen name="Profile" options={{ headerShown: false }} />
          <Stack.Screen name="CustomMail" options={{ headerShown: false }} />
          <Stack.Screen name="PrivacyPolicy" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <ToastNotification />
        <StatusBar style="dark" />
      </View>
    </AuthProvider>
  );
}
