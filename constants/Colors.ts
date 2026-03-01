/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#6366f1"; // Indigo - modern and vibrant
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#888888",
    tabIconSelected: tintColorLight,
    tabBarBackground: "#ffffff",
    tabBarBorder: "#f0f0f0",
    tabBarAccent: "#6366f1",
    tabBarAccentLight: "rgba(99, 102, 241, 0.1)",
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
    tabBarBackground: "#1F2937",
    tabBarBorder: "#374151",
    tabBarAccent: "#6366f1",
    tabBarAccentLight: "rgba(99, 102, 241, 0.2)",
  },
};
