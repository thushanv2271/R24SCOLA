import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import { AuthProvider } from "../components/AuthContext";
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
        router.replace("/instructions");
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // Return null while fonts are loading
  }

  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="tenHome" options={{ headerShown: false }} />
          <Stack.Screen name="instructions" options={{ headerShown: false }} />
          <Stack.Screen name="RegisterForm" options={{ headerShown: false }} />
          <Stack.Screen
            name="ComputerScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Chemistry" options={{ headerShown: false }} />
          <Stack.Screen name="PChemistry" options={{ headerShown: false }} />
          <Stack.Screen name="MChemistry" options={{ headerShown: false }} />
          <Stack.Screen name="Community" options={{ headerShown: false }} />

          <Stack.Screen name="Business" options={{ headerShown: false }} />
          <Stack.Screen name="PBusiness" options={{ headerShown: false }} />
          <Stack.Screen name="MBusiness" options={{ headerShown: false }} />

          <Stack.Screen name="Engineering" options={{ headerShown: false }} />
          <Stack.Screen name="PEngineering" options={{ headerShown: false }} />
          <Stack.Screen name="JobInside" options={{ headerShown: false }} />
          <Stack.Screen name="MEngineering" options={{ headerShown: false }} />
          <Stack.Screen name="Scholarships" options={{ headerShown: false }} />
          <Stack.Screen name="Itjobs" options={{ headerShown: false }} />
          <Stack.Screen name="ScholarshipCreateNew" options={{ headerShown: false }} />

          <Stack.Screen name="HealthScience" options={{ headerShown: false }} />
          <Stack.Screen
            name="PHealthScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MHealthScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="NaturalScience"
            options={{ headerShown: false }}
          />

          <Stack.Screen
            name="PNaturalScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MNaturalScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Statictics" options={{ headerShown: false }} />
          <Stack.Screen name="Info" options={{ headerShown: false }} />
          <Stack.Screen name="PStatictics" options={{ headerShown: false }} />
          <Stack.Screen name="MStatictics" options={{ headerShown: false }} />
          <Stack.Screen
            name="MComputerScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PComputerScience"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ScholarshipCalculator"
            options={{ headerShown: false }}
          />

          <Stack.Screen name="Profile" options={{ headerShown: false }} />
          <Stack.Screen
            name="BachalorsInside"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="MastersInside" options={{ headerShown: false }} />
          <Stack.Screen name="CustomMail" options={{ headerShown: false }} />
          <Stack.Screen name="PhdInside" options={{ headerShown: false }} />
          <Stack.Screen name="Premium" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
