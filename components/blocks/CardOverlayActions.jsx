import React, { useContext, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";
import { Pop, haptic } from "../ui/motion";

// Actions overlaid on a scholarship/job card image. Favourite is the only
// always-visible action; Share and Report live in an overflow menu so the
// image isn't ringed by three unlabelled circles.
const CardOverlayActions = ({ isFavorite, onToggleFavorite, onShare, onReport }) => {
  const { t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const hasMenu = Boolean(onShare || onReport);

  const run = (fn) => () => {
    setMenuOpen(false);
    fn?.();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (!isFavorite) haptic("success");
          onToggleFavorite?.();
        }}
        style={[styles.circle, styles.topRight]}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? t("ui.a11y.removeFavourite") : t("ui.a11y.addFavourite")}
        accessibilityState={{ selected: isFavorite }}
      >
        <Pop trigger={isFavorite} from={1.25}>
          <FontAwesome
            name={isFavorite ? "heart" : "heart-o"}
            size={18}
            color={isFavorite ? "#ef4444" : "#fff"}
          />
        </Pop>
      </TouchableOpacity>

      {hasMenu && (
        <>
          <TouchableOpacity
            onPress={() => setMenuOpen((open) => !open)}
            style={[styles.circle, styles.bottomRight]}
            accessibilityRole="button"
            accessibilityLabel={t("ui.a11y.moreOptions")}
            accessibilityState={{ expanded: menuOpen }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </TouchableOpacity>
          {menuOpen && (
            <View
              style={[
                styles.menu,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {onShare && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={run(onShare)}
                  accessibilityRole="button"
                >
                  <Ionicons name="people-outline" size={18} color={colors.textPrimary} />
                  <Text style={[styles.menuText, { color: colors.textPrimary }]}>
                    {t("ui.a11y.shareToCommunity")}
                  </Text>
                </TouchableOpacity>
              )}
              {onReport && (
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={run(onReport)}
                  accessibilityRole="button"
                >
                  <Ionicons name="flag-outline" size={18} color={colors.danger} />
                  <Text style={[styles.menuText, { color: colors.danger }]}>
                    {t("ui.a11y.report")}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  circle: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  topRight: {
    top: 6,
    right: 6,
  },
  bottomRight: {
    bottom: 6,
    right: 6,
  },
  menu: {
    position: "absolute",
    right: 6,
    bottom: 56,
    minWidth: 190,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 14,
  },
  menuText: {
    fontSize: 14,
    fontFamily: "Roboto",
    fontWeight: "500",
  },
});

export default CardOverlayActions;
