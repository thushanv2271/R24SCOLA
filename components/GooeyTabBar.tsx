import React, { useEffect } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { IconSymbol } from "./ui/IconSymbol";
import { Colors } from "@/constants/Colors";

const ICON_SIZE = 28;
const TAB_WIDTH = 80;

interface GooeyTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function GooeyTabBar({
  state,
  descriptors,
  navigation,
}: GooeyTabBarProps) {
  const blobPosition = useSharedValue(0);
  const tabCount = state.routes.length;
  const totalWidth = TAB_WIDTH * tabCount;

  useEffect(() => {
    blobPosition.value = withSpring(state.index * TAB_WIDTH, {
      damping: 10,
      mass: 1,
      overshootClamping: false,
    });
  }, [state.index]);

  const blobStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: blobPosition.value,
        },
      ],
    };
  });

  return (
    <View style={[styles.container, styles.shadowEffect]}>
      {/* Gooey Background Blob */}
      <Animated.View style={[styles.gooeyBlob, blobStyle]} />

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, { width: TAB_WIDTH }]}
            >
              <Animated.View style={styles.iconWrapper}>
                {options.tabBarIcon &&
                  options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused
                      ? Colors["light"].tabBarBackground
                      : Colors["light"].tabIconDefault,
                    size: ICON_SIZE,
                  })}
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors["light"].tabBarBackground,
    borderTopColor: Colors["light"].tabBarBorder,
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "relative",
    overflow: "hidden",
  },
  shadowEffect: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  gooeyBlob: {
    position: "absolute",
    width: TAB_WIDTH - 16,
    height: 56,
    backgroundColor: Colors["light"].tabBarAccent,
    borderRadius: 28,
    top: 6,
    left: 12,
    zIndex: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    zIndex: 1,
  },
  tabItem: {
    justifyContent: "center",
    alignItems: "center",
    height: 56,
  },
  iconWrapper: {
    justifyContent: "center",
    alignItems: "center",
  },
});
