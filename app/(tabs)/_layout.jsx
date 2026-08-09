import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { GooeyTabBar } from "@/components/GooeyTabBar";
import { GooeyIcon } from "@/components/GooeyIcon";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBar: (props) => <GooeyTabBar {...props} />,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <GooeyIcon
              name="house.fill"
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Scholarships"
        options={{
          title: "Scholarships",
          tabBarIcon: ({ color, focused }) => (
            <GooeyIcon
              name="graduationcap.fill"
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Jobs"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, focused }) => (
            <GooeyIcon
              name="briefcase.fill"
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="favourites"
        options={{
          title: "Favourites",
          tabBarIcon: ({ color, focused }) => (
            <GooeyIcon
              name="heart.fill"
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <GooeyIcon
              name="person.circle.fill"
              size={28}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
