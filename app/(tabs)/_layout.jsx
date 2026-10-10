import { Tabs } from "expo-router";
import React, { useContext } from "react";
import { AppTabBar } from "@/components/AppTabBar";
import { useTheme } from "@/components/ThemeContext";
import { AuthContext } from "@/components/AuthContext";

export default function TabLayout() {
  const { colors } = useTheme() || {};
  const { avatarIcon, avatarPhotoUri } = useContext(AuthContext) || {};
  // Force the custom tab bar to remount whenever the avatar changes — some
  // navigation libraries don't re-invoke a custom tabBar render function on
  // context-only changes unrelated to navigation state, so a plain
  // useContext subscription inside AppTabBar wasn't enough on its own.
  const tabBarKey = `${avatarIcon?.icon || "initial"}-${avatarIcon?.color || "default"}-${avatarPhotoUri || "nophoto"}`;

  return (
    <Tabs
      // `tabBar` must be a direct prop on <Tabs>, not nested inside
      // screenOptions — the navigator only forwards its *other* props to
      // the tab-bar-rendering view; anything inside screenOptions is
      // consumed earlier to build per-screen descriptors and never reaches
      // it. Nesting it there (as this file used to) silently falls back to
      // the default tab bar instead of actually using AppTabBar.
      tabBar={(props) => <AppTabBar key={tabBarKey} {...props} />}
      // The navigator's own default scene/content backdrop is white,
      // independent of both AppTabBar's own theming and whatever each
      // individual tab screen does — visible as a stray light strip behind
      // the floating tab bar and during tab transitions if left unset.
      sceneContainerStyle={colors && { backgroundColor: colors.screenBackground }}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        contentStyle: colors && { backgroundColor: colors.screenBackground },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />

      <Tabs.Screen name="favourites" options={{ title: "Favourites" }} />

      <Tabs.Screen
        name="Scholarships"
        options={{
          // Universities and Jobs used to be two separate tabs; they're now
          // one screen with a switch at the top (see Scholarships.jsx /
          // Jobs.jsx), which frees up a slot elsewhere — this one sits in
          // the middle of the bar as the app's primary action.
          title: "Explore",
        }}
      />

      {/* Jobs lives inside the tabs group (Jobs.jsx) purely so
          switching to it from the Explore switch keeps the bottom tab bar
          visible — href: null keeps it off the tab bar itself, since Jobs
          and Universities now share one tab slot with an in-screen switch. */}
      <Tabs.Screen name="Jobs" options={{ href: null }} />

      <Tabs.Screen name="Chats" options={{ title: "Inbox" }} />

      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
