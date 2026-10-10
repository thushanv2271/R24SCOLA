import React, { memo, useCallback, useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  InteractionManager,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Avatar from "../ui/Avatar";
import { useTheme } from "../ThemeContext";
import { LanguageContext } from "../LanguageContext";
import { AVATAR_ICONS } from "../../constants/avatarIcons";

const TILE_SIZE = 56;
const INITIAL_ID = "__initial";
const OPTIONS = [{ id: INITIAL_ID }, ...AVATAR_ICONS];

const AvatarTile = memo(({ option, isSelected, username, label, onChoose }) => {
  const isInitial = option.id === INITIAL_ID;
  return (
    <TouchableOpacity
      style={styles.cell}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={isInitial ? label : option.id}
      onPress={() => onChoose(isInitial ? null : option.icon, isInitial ? null : option.color)}
    >
      <View>
        {isInitial ? (
          <Avatar name={username} size={TILE_SIZE} borderWidth={2} />
        ) : (
          <Avatar icon={option.icon} color={option.color} size={TILE_SIZE} borderWidth={2} />
        )}
        {isSelected && (
          <View style={styles.checkBadge}>
            <Ionicons name="checkmark" size={12} color="#fff" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

const keyExtractor = (option) => option.id;

const AvatarPickerModal = ({ visible, onClose, username, selectedIcon, onSelect, photoUri }) => {
  const { colors } = useTheme();
  const { t } = useContext(LanguageContext);
  const { height: windowHeight } = useWindowDimensions();
  const [gridReady, setGridReady] = useState(false);

  // The cartoon faces are SVGs; mounting dozens of them while the modal fades
  // in makes it stutter. Open the card first, fill the grid on the next frame.
  useEffect(() => {
    if (!visible) {
      setGridReady(false);
      return undefined;
    }
    const handle = InteractionManager.runAfterInteractions(() => setGridReady(true));
    return () => handle.cancel();
  }, [visible]);

  const hasPhoto = !!photoUri;
  const selectedId = hasPhoto ? null : selectedIcon?.icon || INITIAL_ID;
  const initialLabel = username || t("ui.avatar.title");

  const handleChoose = useCallback(
    (icon, color) => {
      onClose();
      onSelect(icon, color);
    },
    [onClose, onSelect],
  );

  const renderItem = useCallback(
    ({ item }) => (
      <AvatarTile
        option={item}
        isSelected={item.id === selectedId}
        username={username}
        label={initialLabel}
        onChoose={handleChoose}
      />
    ),
    [selectedId, username, initialLabel, handleChoose],
  );

  const gridHeight = Math.max(180, windowHeight * 0.45);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={[styles.closeIcon, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("ui.avatar.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("ui.avatar.subtitle")}
          </Text>

          <View style={[styles.gridBox, { height: gridHeight }]}>
            {gridReady && (
              <FlatList
                data={OPTIONS}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                extraData={selectedId}
                numColumns={4}
                initialNumToRender={12}
                maxToRenderPerBatch={8}
                windowSize={5}
                removeClippedSubviews
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    width: "100%",
    maxWidth: 360,
  },
  closeIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  title: {
    paddingHorizontal: 36,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: "Roboto",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    textAlign: "center",
    fontFamily: "Roboto",
    marginBottom: 14,
  },
  gridBox: {
    alignSelf: "stretch",
  },
  cell: {
    width: "25%",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#004aad",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default AvatarPickerModal;
