import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useColorScheme as useSystemColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "../constants/Colors";
import { runWithSwitchLoader } from "./ui/switchLoader";

const THEME_PREFERENCE_KEY = "themePreference";

export const ThemeContext = createContext();

// "system" follows the OS setting until the user picks something;
// "light"/"dark" pin it regardless of the OS and are remembered across
// restarts. themeConfigured records that a choice has been made, for the
// setup checklist.
export const ThemeProvider = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  const [themePreference, setThemePreferenceState] = useState("system");
  const [themeConfigured, setThemeConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
        if (stored === "light" || stored === "dark" || stored === "system") {
          setThemePreferenceState(stored);
          setThemeConfigured(true);
        }
      } catch (error) {
        console.error("Error loading theme preference:", error);
      } finally {
        setLoaded(true);
      }
    };
    loadPreference();
  }, []);

  const preferenceRef = useRef("system");
  preferenceRef.current = themePreference;

  const setThemePreference = useCallback(async (preference) => {
    const apply = () => {
      setThemePreferenceState(preference);
      setThemeConfigured(true);
    };
    if (preference === preferenceRef.current) apply();
    else runWithSwitchLoader("theme", apply);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  }, []);

  const scheme = themePreference === "system" ? systemScheme || "light" : themePreference;
  const colors = Colors[scheme];
  const isDark = scheme === "dark";

  const value = useMemo(
    () => ({ themePreference, scheme, colors, isDark, setThemePreference, themeConfigured, loaded }),
    [themePreference, scheme, colors, isDark, setThemePreference, themeConfigured, loaded],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
