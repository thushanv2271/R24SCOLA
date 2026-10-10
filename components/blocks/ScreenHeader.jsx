import React, { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { publishHeaderSpace } from "../../utils/hootHeaderSpace";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../ThemeContext";
import { LanguageContext } from "../LanguageContext";

const { width } = Dimensions.get("window");

// Common navigational header — modeled on app/(tabs)/Scholarships.jsx's
// header (logo + customizable icon row + collapsible search), the reference
// the rest of the app's screen headers are unified onto. Shared by nearly
// every screen, so theming this one component covers all of them at once.
const IconButton = ({ icon, size = 22 }) => {
  const { name, onPress, active, badgeCount, accessibilityLabel } = icon;
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.iconBackground,
        { backgroundColor: colors.surfaceAlt },
        active && { backgroundColor: colors.accent },
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={active !== undefined ? { selected: !!active } : undefined}
    >
      <Ionicons name={name} size={size} color={active ? "#fff" : colors.textSecondary} />
      {!!badgeCount && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ScreenHeader = ({
  onBack,
  showLogo = true,
  logoTintColor,
  title,
  icons = [],
  searchable = false,
  searchValue = "",
  onSearchChange,
  searchPlaceholder,
  onMenuPress,
  accessory,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);

  const toggleSearch = () => {
    if (searchOpen) onSearchChange?.("");
    setSearchOpen((v) => !v);
  };

  // Work out the empty strip of this header so the pet can live in it.
  const rowRef = useRef(null);
  const backRef = useRef(null);
  const leadRef = useRef(null);
  const iconsRef = useRef(null);
  const textWidth = useRef(0);
  const space = useRef(null);
  const focused = useRef(false);
  const alive = useRef(true);

  const measureSpace = useCallback(() => {
    const m = (ref) =>
      new Promise((resolve) => {
        if (!ref.current?.measureInWindow) return resolve(null);
        ref.current.measureInWindow((x, y, w, h) => resolve({ x, y, w, h }));
      });
    Promise.all([m(rowRef), m(iconsRef), m(leadRef), m(backRef)]).then(([row, icons, lead, back]) => {
      if (!alive.current || !row || !icons || !lead || !row.h) return;
      let x0;
      let x1 = icons.x - 4;
      if (showLogo) {
        x0 = lead.x + lead.w + 4;
      } else {
        const center = lead.x + lead.w / 2;
        const half = Math.min(textWidth.current, lead.w) / 2;
        const leftStart = back ? back.x + back.w + 4 : row.x;
        const left = { a: leftStart, b: center - half - 4 };
        const right = { a: center + half + 4, b: x1 };
        const best = left.b - left.a >= right.b - right.a ? left : right;
        x0 = best.a;
        x1 = best.b;
      }
      space.current = { x: x0, y: row.y, w: x1 - x0, h: row.h };
      if (focused.current) publishHeaderSpace(space.current);
    });
  }, [showLogo]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      if (space.current) publishHeaderSpace(space.current);
      else measureSpace();
      return () => {
        focused.current = false;
      };
    }, [measureSpace]),
  );

  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );

  return (
    <View>
      <View ref={rowRef} style={styles.headerRow} onLayout={() => requestAnimationFrame(measureSpace)}>
        {onBack && (
          <TouchableOpacity
            ref={backRef}
            style={[styles.iconBackground, { backgroundColor: colors.surfaceAlt }]}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("ui.a11y.back")}
          >
            <Ionicons name="arrow-back" size={25} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        {showLogo ? (
          <View ref={leadRef} collapsable={false} style={{ flexShrink: 1 }}>
            <Image
              source={require("../../assets/images/OPPORTUNITIES.png")}
              style={[styles.logo, logoTintColor && { tintColor: logoTintColor }]}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View ref={leadRef} collapsable={false} style={styles.titleWrap}>
            <Text
              style={[styles.title, { color: colors.textPrimary }]}
              numberOfLines={1}
              onTextLayout={(e) => {
                const w = Math.max(0, ...e.nativeEvent.lines.map((l) => l.width));
                if (Math.abs(w - textWidth.current) > 1) {
                  textWidth.current = w;
                  requestAnimationFrame(measureSpace);
                }
              }}
            >
              {title}
            </Text>
          </View>
        )}

        <View ref={iconsRef} collapsable={false} style={styles.iconsContainer}>
          {accessory}
          {icons.map((icon) => (
            <IconButton key={icon.key} icon={icon} />
          ))}
          {searchable && (
            <IconButton
              key="search"
              icon={{
                name: searchOpen ? "close" : "search",
                onPress: toggleSearch,
                active: searchOpen,
                accessibilityLabel: t("ui.a11y.toggleSearch"),
              }}
            />
          )}
          {onMenuPress && (
            <IconButton
              key="menu"
              icon={{
                name: "menu",
                onPress: onMenuPress,
                accessibilityLabel: t("ui.a11y.openMenu"),
              }}
            />
          )}
        </View>
      </View>

      {searchable && searchOpen && (
        <View style={[styles.searchBarContainer, { backgroundColor: colors.surfaceAlt }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={searchPlaceholder ?? `${t("common.search", "Search")}...`}
            placeholderTextColor={colors.textMuted}
            value={searchValue}
            onChangeText={onSearchChange}
            autoFocus
            returnKeyType="search"
          />
          {!!searchValue && (
            <TouchableOpacity
              onPress={() => onSearchChange?.("")}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t("ui.a11y.dismiss")}
            >
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  logo: {
    width: 150,
    height: 50,
    flexShrink: 1,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    textAlign: "center",
  },
  iconsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBackground: {
    backgroundColor: "#f1f5f9",
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 2,
    elevation: 2,
  },
  iconBackgroundActive: {
    backgroundColor: "#004aad",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#ef4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Roboto",
    color: "#111827",
    padding: 0,
  },
});

export default ScreenHeader;
