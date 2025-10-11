import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    // <StripeProvider
    //   publishableKey="pk_test_51Moj0FA7YwNcizC88oNYnMH4OcCJvyfQSkTeiYWciqgdOfEPg5B74X0EEKSvFZD8dBog2ovsE6ZHpft5J8Avswah00Z0Ep11s4" // Replace with your actual Stripe key
    //   merchantIdentifier="merchant.com.thvnetwork" // Required for Apple Pay
    // >
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: "absolute",
            },
            default: {},
          }),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="house.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Scholarships"
          options={{
            title: "Scholarships",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="graduationcap.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="favourites"
          options={{
            title: "Favourites",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="heart.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Premium"
          options={{
            title: "Premium",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="star.fill" color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="Profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => (
              <IconSymbol size={28} name="person.circle.fill" color={color} />
            ),
          }}
        />
      </Tabs>
    // </StripeProvider>
  );
}
