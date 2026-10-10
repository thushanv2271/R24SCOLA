import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useTheme } from "../ThemeContext";

const OPTIONS = [
  { value: "light", icon: "sunny-outline", labelKey: "settings.themeLight" },
  { value: "dark", icon: "moon-outline", labelKey: "settings.themeDark" },
  { value: "system", icon: "phone-portrait-outline", labelKey: "settings.themeSystem" },
];

const ThemePickerModal = ({ visible, onClose }) => {
  const { t } = useContext(LanguageContext);
  const { themePreference, setThemePreference, colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          <TouchableOpacity
            style={[styles.closeIcon, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {t("settings.themeTitle")}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t("settings.themeSubtitle")}
          </Text>

          {OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.row, { borderTopColor: colors.divider }]}
              onPress={() => {
                setThemePreference(option.value);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Ionicons name={option.icon} size={18} color={colors.textSecondary} />
                <Text style={[styles.rowText, { color: colors.textPrimary }]}>
                  {t(option.labelKey)}
                </Text>
              </View>
              {themePreference === option.value && (
                <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
              )}
            </TouchableOpacity>
          ))}

        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  sheet: {
    borderRadius: 20,
    padding: 20,
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
    paddingRight: 40,
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: "Roboto",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: {
    fontSize: 15,
    fontFamily: "Roboto",
    fontWeight: "600",
  },
});

export default ThemePickerModal;
