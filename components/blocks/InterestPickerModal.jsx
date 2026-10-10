import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LanguageContext } from "../LanguageContext";
import { useInterest } from "../InterestContext";
import { useTheme } from "../ThemeContext";
import { haptic } from "../ui/motion";
import InterestCard from "./InterestCard";

// Settings: change what Scola shows -- universities, companies or both.
const InterestPickerModal = ({ visible, onClose }) => {
  const { t } = useContext(LanguageContext);
  const { interest, setInterest } = useInterest();
  const { colors } = useTheme();

  const options = [
    { value: "universities", title: t("explore.universities"), description: t("interest.universitiesDesc") },
    { value: "companies", title: t("explore.companies"), description: t("interest.companiesDesc") },
    { value: "both", title: t("interest.both"), description: t("interest.bothDesc") },
  ];

  const choose = (value) => {
    haptic("select");
    setInterest(value);
    // Let the selection animation play before the sheet closes.
    setTimeout(onClose, 320);
  };

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
          <Text style={[styles.title, { color: colors.textPrimary }]}>{t("interest.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{t("interest.subtitle")}</Text>
          <View accessibilityRole="radiogroup">
            {options.map((option, index) => (
              <View key={option.value} style={styles.gap}>
                <InterestCard
                  value={option.value}
                  title={option.title}
                  description={option.description}
                  selected={interest === option.value}
                  index={index}
                  animateIn={false}
                  onPress={() => choose(option.value)}
                />
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: 20 },
  sheet: { borderRadius: 24, padding: 20 },
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
  title: { paddingRight: 40, fontSize: 19, lineHeight: 26, fontWeight: "800" },
  subtitle: { marginTop: 6, marginBottom: 14, fontSize: 13, lineHeight: 18 },
  gap: { marginBottom: 10 },
});

export default InterestPickerModal;
