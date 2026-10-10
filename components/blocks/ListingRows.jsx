import React, { useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { FontAwesome } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";

// Two columns inside the screens' 16px side padding with a 12px gap.
const gridTileWidthFor = (screenWidth) => (screenWidth - 32 - 12) / 2;

const listingTag = (item, variant, t) =>
  variant === "job" ? item.subcategory || item.major : t("ui.card.tagFunding", { funding: item.funding });

export const ListingListItem = React.memo(
  ({ item, handleFavorite, isFavorite, onPress, variant }) => {
    const { t } = useContext(LanguageContext);
    const { colors } = useTheme();
    return (
      <TouchableOpacity
        style={[styles.listItem, { backgroundColor: colors.surface }]}
        activeOpacity={0.75}
        onPress={() => onPress(item)}
      >
        <Image
          source={{ uri: item.images?.[0] }}
          style={styles.listItemImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        <View style={styles.listItemBody}>
          <Text style={[styles.listItemTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.listItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.university}
          </Text>
          <View style={styles.listItemTagsRow}>
            <Text style={[styles.listItemTag, { color: colors.accent, backgroundColor: colors.accentLight }]}>
              {listingTag(item, variant, t)}
            </Text>
            <Text style={[styles.listItemTagMuted, { color: colors.textSecondary, backgroundColor: colors.surfaceAlt }]}>{item.country}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleFavorite(item.id)}
          style={styles.listItemFavBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityState={{ selected: isFavorite }}
          accessibilityLabel={
            isFavorite ? t("ui.a11y.removeFavourite") : t("ui.a11y.addFavourite")
          }
        >
          <FontAwesome
            name={isFavorite ? "heart" : "heart-o"}
            size={18}
            color={isFavorite ? "#ef4444" : colors.textMuted}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item === nextProps.item &&
    prevProps.isFavorite === nextProps.isFavorite &&
    prevProps.variant === nextProps.variant,
);

export const ListingGridTile = React.memo(
  ({ item, handleFavorite, isFavorite, onPress }) => {
    const { t } = useContext(LanguageContext);
    const { colors } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    return (
      <TouchableOpacity
        style={[styles.gridTile, { width: gridTileWidthFor(screenWidth), backgroundColor: colors.surface }]}
        activeOpacity={0.8}
        onPress={() => onPress(item)}
      >
        <View style={styles.gridTileImageWrap}>
          <Image
            source={{ uri: item.images?.[0] }}
            style={styles.gridTileImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
          <TouchableOpacity
            onPress={() => handleFavorite(item.id)}
            style={styles.gridTileFavBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityState={{ selected: isFavorite }}
            accessibilityLabel={
              isFavorite ? t("ui.a11y.removeFavourite") : t("ui.a11y.addFavourite")
            }
          >
            <FontAwesome
              name={isFavorite ? "heart" : "heart-o"}
              size={15}
              color={isFavorite ? "#ef4444" : "#fff"}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.gridTileBody}>
          <Text style={[styles.gridTileTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.gridTileSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.university}
          </Text>
          <Text style={[styles.gridTileTag, { color: colors.accent }]} numberOfLines={1}>
            {item.country}
          </Text>
        </View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    prevProps.item === nextProps.item && prevProps.isFavorite === nextProps.isFavorite,
);

const styles = StyleSheet.create({
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  listItemImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
  },
  listItemBody: {
    flex: 1,
    gap: 3,
  },
  listItemTitle: {
    fontSize: 14.5,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
  },
  listItemSubtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    color: "#64748b",
  },
  listItemTagsRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
    flexWrap: "wrap",
  },
  listItemTag: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#004aad",
    backgroundColor: "#eaf2ff",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  listItemTagMuted: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Roboto",
    color: "#64748b",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  listItemFavBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  gridRow: {
    gap: 12,
  },
  gridTile: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  gridTileImageWrap: {
    position: "relative",
    width: "100%",
    height: 110,
  },
  gridTileImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e2e8f0",
  },
  gridTileFavBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  gridTileBody: {
    padding: 10,
    gap: 2,
  },
  gridTileTitle: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Roboto",
    color: "#111827",
    lineHeight: 17,
  },
  gridTileSubtitle: {
    fontSize: 12,
    fontFamily: "Roboto",
    color: "#64748b",
  },
  gridTileTag: {
    fontSize: 12,
    fontFamily: "Roboto",
    color: "#004aad",
    fontWeight: "600",
    marginTop: 2,
  },
});
