/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#004aad";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#5f6f86",
    tabIconSelected: "#004aad",
    tabBarBackground: "#ffffff",
    tabBarBorder: "#f0f0f0",
    // Brand blue — the indigo #6366f1 was a template leftover that clashed
    // with the app's #004aad design language.
    tabBarAccent: "#004aad",
    tabBarAccentLight: "rgba(0, 74, 173, 0.12)",

    // Semantic tokens for the app-wide light/dark theme toggle (see
    // ThemeContext). Values match colors already hardcoded throughout the
    // app's screens (e.g. index.jsx's "#f5f5f5" background, "#111827" text,
    // white cards) so switching to these is a like-for-like swap, not a
    // redesign.
    screenBackground: "#f5f5f5",
    headerBackground: "#f8fafc",
    surface: "#ffffff",
    surfaceAlt: "#f1f5f9",
    surfaceAccent: "#eaf2ff",
    textPrimary: "#111827",
    textSecondary: "#5f6f86",
    textMuted: "#94a3b8",
    border: "#e2e8f0",
    divider: "#f1f5f9",
    accent: "#004aad",
    accentLight: "#eaf2ff",
    danger: "#ef4444",
    dangerLight: "#fee2e2",
    success: "#16a34a",
    successLight: "#dcfce7",
    warning: "#d97706",
    warningLight: "#fef3c7",
    info: "#0284c7",
    infoLight: "#e0f2fe",
    statusBarStyle: "dark",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#93c5fd",
    tabBarBackground: "#1F2937",
    tabBarBorder: "#374151",
    tabBarAccent: "#0d64c8",
    tabBarAccentLight: "rgba(13, 100, 200, 0.22)",

    screenBackground: "#0f172a",
    headerBackground: "#0f172a",
    surface: "#1e293b",
    surfaceAlt: "#273449",
    surfaceAccent: "rgba(13, 100, 200, 0.18)",
    textPrimary: "#f1f5f9",
    textSecondary: "#cbd5e1",
    textMuted: "#94a3b8",
    border: "#334155",
    divider: "#273449",
    accent: "#3b82f6",
    accentLight: "rgba(59, 130, 246, 0.18)",
    danger: "#f87171",
    dangerLight: "rgba(248, 113, 113, 0.16)",
    success: "#22c55e",
    successLight: "rgba(34, 197, 94, 0.16)",
    warning: "#f59e0b",
    warningLight: "rgba(245, 158, 11, 0.16)",
    info: "#38bdf8",
    infoLight: "rgba(56, 189, 248, 0.16)",
    statusBarStyle: "light",
  },
};
