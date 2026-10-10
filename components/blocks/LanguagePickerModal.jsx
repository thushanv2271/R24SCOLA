import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext, LANGUAGES } from "../LanguageContext";
import { useTheme } from "../ThemeContext";

const LanguagePickerModal = ({ visible, onClose, onSelect }) => {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={(e) => e.stopPropagation()}>
          <TouchableOpacity
            style={[styles.closeIcon, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            accessibilityRole="button"
            accessibilityLabel={t("common.close")}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("settings.languageTitle")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("settings.languageSubtitle")}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {LANGUAGES.map((lang) => {
              const selected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.row, { borderTopColor: colors.divider }]}
                  onPress={() => onSelect(lang.code)}
                  activeOpacity={0.7}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${lang.name}, ${lang.english}`}
                >
                  <View style={styles.rowLabels}>
                    <Text style={[styles.rowText, { color: colors.textPrimary }]}>{lang.name}</Text>
                    {lang.english !== lang.name && (
                      <Text style={[styles.rowSub, { color: colors.textMuted }]}>{lang.english}</Text>
                    )}
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

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
    backgroundColor: "#fff",
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
    color: "#111827",
    fontFamily: "Roboto",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    fontFamily: "Roboto",
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 12,
  },
  list: {
    maxHeight: 380,
  },
  rowLabels: {
    flex: 1,
    marginRight: 8,
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Roboto",
    marginTop: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  rowText: {
    fontSize: 15,
    color: "#111827",
    fontFamily: "Roboto",
    fontWeight: "600",
  },
});

export default LanguagePickerModal;
